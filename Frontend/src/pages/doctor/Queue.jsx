// src/pages/doctor/Queue.jsx
import React, { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { ensureSocket, requestDoctorSync } from '../../lib/socket';
import api from '../../services/api';
import DoctorReportCard from '../../components/DoctorReportCard';
import toast from 'react-hot-toast';

export default function DoctorQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // load initial via REST in case socket missed anything
  async function loadPending() {
    setLoading(true);
    try {
      const res = await api.get('/api/doctor/pending');
      const reports = (res.data.reports || []).map(r => ({
        id: r._id,
        content: r.content,
        patient: r.patient,
        createdAt: r.createdAt,
      }));
      setItems(reports);
    } catch (e) {
      console.error('Load pending failed', e);
      toast.error('Failed to load queue');
    } finally { setLoading(false); }
  }

  useEffect(() => {
    loadPending(); // initial fetch

    const s = ensureSocket();

    // doctor:init -> backlog on connect
    s.on('doctor:init', (payload) => {
      const mapped = (payload.reports || []).map(r => ({
        id: r._id,
        content: r.content,
        patient: r.patient,
        createdAt: r.createdAt
      }));
      setItems(mapped);
    });

    // live push for newly generated ai reports
    s.on('ai_report:generated', (p) => {
      setItems(prev => [{ id: p.aiReportId, content: p.content, patient: p.patientDetails, createdAt: p.createdAt }, ...prev]);
      toast('New AI report arrived', { icon: '🩺' });
    });

    // If a reading arrives we could optionally refresh patient details
    s.on('reading:created', (d) => {
      // optional: show small toast
      // toast(`New reading from patient`);
    });

    return () => {
      s.off('doctor:init');
      s.off('ai_report:generated');
      s.off('reading:created');
    };
  }, []);

  // Approve handler (removes item optimistically)
  async function handleApprove(aiReportId, content) {
    try {
      await api.post(`/api/doctor/approve/${aiReportId}`, {
        finalSummary: content?.prediction || 'Approved',
        meds: content?.suggested_medicines || [],
        doctorNotes: 'Approved by doctor UI'
      });
      setItems(prev => prev.filter(i => i.id !== aiReportId));
      toast.success('Approved and patient notified');
    } catch (e) {
      console.error('Approve failed', e);
      toast.error('Approve failed');
    }
  }

  // Decline handler (calls API then removes item)
  async function handleDecline(aiReportId, reason) {
    try {
      await api.post(`/api/doctor/decline/${aiReportId}`, { reason });
      setItems(prev => prev.filter(i => i.id !== aiReportId));
      toast.success('Declined and patient notified');
    } catch (e) {
      console.error('Decline failed', e);
      toast.error('Decline failed');
    }
  }

  // manual sync (calls server ack for fresh list)
  async function manualSync() {
    const res = await requestDoctorSync();
    if (res?.ok) {
      setItems(res.reports.map(r => ({ id: r._id, content: r.content, patient: r.patient, createdAt: r.createdAt })));
      toast.success('Queue synced');
    } else {
      toast.error('Sync failed');
    }
  }

  return (
    <Shell role="doctor">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Doctor Queue</h2>
          <div className="small text-sub">AI suggestions awaiting review — approve or decline.</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={manualSync} className="btn btn-ghost small">Sync</button>
          <button onClick={loadPending} className="btn btn-ghost small">{loading ? 'Loading…' : 'Refresh (REST)'}</button>
        </div>
      </div>

      <div className="space-y-4">
        {items.length === 0 && <div className="card small text-sub">No pending reports.</div>}
        {items.map((r) => (
          <DoctorReportCard
            key={r.id}
            report={r}
            onApprove={() => handleApprove(r.id, r.content)}
            onDecline={(reason) => handleDecline(r.id, reason)}
          />
        ))}
      </div>
    </Shell>
  );
}
