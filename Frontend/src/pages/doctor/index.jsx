import React, { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { ensureSocket, requestDoctorSync } from '../../lib/socket';
import axios from 'axios';

function Pill({ children }) {
  return <span className="inline-block text-xs px-2 py-1 rounded-full bg-soft text-sub">{children}</span>;
}

function AIPlan({ content }) {
  if (!content) return null;
  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm text-sub font-semibold mb-1">Prediction</div>
        <div className="text-text">{content.prediction || '—'}</div>
      </div>
      <div>
        <div className="text-sm text-sub font-semibold mb-1">Trend & Rationale</div>
        <div className="text-text/90 text-sm">{content.trend_explanation || '—'}</div>
      </div>
      <div>
        <div className="text-sm text-sub font-semibold mb-1">Suggested Medicines</div>
        <div className="flex flex-wrap gap-2">
          {(content.suggested_medicines || []).map((m,i)=> <Pill key={i}>{m}</Pill>)}
        </div>
        {Array.isArray(content.medicine_rationale) && content.medicine_rationale.length > 0 && (
          <ul className="list-disc list-inside text-sm text-sub mt-2 space-y-1">
            {content.medicine_rationale.map((r,i)=> <li key={i}>{r}</li>)}
          </ul>
        )}
      </div>
      <div>
        <div className="text-sm text-sub font-semibold mb-1">Urgency</div>
        <div className="flex items-center gap-2">
          <Pill>{content.urgency_level || 'routine'}</Pill>
          <span className="text-xs text-sub">{content.when_to_seek_care || ''}</span>
        </div>
      </div>
      <div>
        <div className="text-sm text-sub font-semibold mb-1">Key Numbers</div>
        <div className="text-xs text-sub">
          Avg {content?.numerics?.avg_systolic}/{content?.numerics?.avg_diastolic} •
          Min {content?.numerics?.min_systolic}/{content?.numerics?.min_diastolic} •
          Max {content?.numerics?.max_systolic}/{content?.numerics?.max_diastolic} •
          Slope S/D {content?.numerics?.slope_systolic}/{content?.numerics?.slope_diastolic}
        </div>
      </div>
      <div>
        <div className="text-sm text-sub font-semibold mb-1">Last 3</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(content.last_three_readings || []).map((x,i)=> (
            <div key={i} className="rounded-lg border border-line p-2">
              <div className="font-semibold">{x.systolic}/{x.diastolic}</div>
              <div className="text-xs text-sub">Pulse: {x.pulse ?? '—'}</div>
              <div className="text-xs text-sub">{new Date(x.measuredAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DoctorQueue() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const s = ensureSocket();

    // instant backlog
    s.on('doctor:init', (payload) => {
      const mapped = (payload.reports || []).map(r => ({
        id: r._id,
        content: r.content,
        patient: r.patient,
        createdAt: r.createdAt
      }));
      setItems(mapped);
    });

    // live push
    s.on('ai_report:generated', (p) => {
      setItems(prev => [{ id: p.aiReportId, content: p.content, patient: p.patientDetails, createdAt: p.createdAt }, ...prev]);
    });

    return () => { s.off('doctor:init'); s.off('ai_report:generated'); };
  }, []);

  async function approve(id, content) {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const token = localStorage.getItem('token');
    await axios.post(`${API}/api/doctor/approve/${id}`, {
      finalSummary: content?.prediction || 'Approved',
      meds: content?.suggested_medicines || [],
      doctorNotes: 'Approved in queue'
    }, { headers: { Authorization: `Bearer ${token}` }});
    // quick sync
    const res = await requestDoctorSync();
    if (res?.ok) {
      setItems(res.reports.map(r => ({ id: r._id, content: r.content, patient: r.patient, createdAt: r.createdAt })));
    } else {
      setItems(prev => prev.filter(x => x.id !== id));
    }
  }

  async function decline(id) {
    const reason = prompt('Add decline reason:');
    if (!reason) return;
    const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const token = localStorage.getItem('token');
    await axios.post(`${API}/api/doctor/decline/${id}`, { reason }, { headers: { Authorization: `Bearer ${token}` }});
    const res = await requestDoctorSync();
    if (res?.ok) {
      setItems(res.reports.map(r => ({ id: r._id, content: r.content, patient: r.patient, createdAt: r.createdAt })));
    } else {
      setItems(prev => prev.filter(x => x.id !== id));
    }
  }

  return (
    <Shell role="doctor">
      <div className="text-sub mb-3">Review AI suggestions, check patient context, then Approve or Decline.</div>

      <div className="space-y-4">
        {items.map(card => (
          <div key={card.id} className="rounded-2xl border border-line bg-panel p-4">
            <div className="flex items-center justify-between text-xs text-sub mb-2">
              <div>Created: {new Date(card.createdAt).toLocaleString()}</div>
              <div>Patient: <span className="text-text font-medium">{card.patient?.name || '—'}</span></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-line p-3"><AIPlan content={card.content} /></div>
              <div className="rounded-xl border border-line p-3">
                <div className="text-sm text-sub font-semibold mb-2">Patient Details</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><span className="text-sub">Name:</span> {card.patient?.name || '—'}</div>
                  <div><span className="text-sub">Age:</span> {card.patient?.age ?? '—'}</div>
                  <div><span className="text-sub">Gender:</span> {card.patient?.gender || '—'}</div>
                  <div><span className="text-sub">Weight:</span> {card.patient?.weight ?? '—'} kg</div>
                </div>
                <div className="mt-3">
                  <div className="text-sm text-sub font-semibold mb-1">PMH</div>
                  <div className="flex flex-wrap gap-2">
                    {(card.patient?.pmh || []).length ? card.patient.pmh.map((t,i)=> <Pill key={i}>{t}</Pill>) : <span className="text-sub text-sm">—</span>}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-sm text-sub font-semibold mb-1">Allergies</div>
                  <div className="flex flex-wrap gap-2">
                    {(card.patient?.allergies || []).length ? card.patient.allergies.map((t,i)=> <Pill key={i}>{t}</Pill>) : <span className="text-sub text-sm">—</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={() => approve(card.id, card.content)} className="px-4 py-2 rounded-lg bg-ok text-black hover:brightness-110">Approve</button>
              <button onClick={() => decline(card.id)} className="px-4 py-2 rounded-lg bg-danger text-white hover:brightness-110">Decline</button>
            </div>
          </div>
        ))}

        {!items.length && (
          <div className="text-sub">No pending items.</div>
        )}
      </div>
    </Shell>
  );
}
