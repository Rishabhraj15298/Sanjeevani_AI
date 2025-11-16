

import React, { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import api from '../../services/api';

const toArray = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'object') {
    const vals = v.items || v.list || v.value || Object.values(v);
    return Array.isArray(vals) ? vals : [JSON.stringify(v)];
  }
  return [String(v)];
};

function ReportModal({ open=false, onClose=()=>{}, report=null }) {
  if (!open || !report) return null;

  const raw = report.content?.aiContent || report.content || {};
  const finalSummary = report.content?.finalSummary || raw.prediction || raw.summary || 'Clinical summary';
  const meds        = toArray(report.content?.meds || raw.suggested_medicines);
  const lifestyle   = toArray(raw.lifestyle_tips || raw.lifestyle);
  const precautions = toArray(raw.precautions || raw.when_to_seek_care);
  const causes      = toArray(raw.possible_conditions || raw.causes);
  const numerics    = raw.numerics || null;
  const trend       = raw.trend_explanation || '';
  const ts = new Date(report.createdAt).toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(2,6,23,0.6)'}}>
      <div className="w-full max-w-3xl mx-4 rounded-xl overflow-hidden" style={{background:'var(--panel)'}}>
        <div className="p-3 flex items-center justify-between border-b" style={{borderColor:'var(--line)'}}>
          <div className="font-semibold">Report details</div>
          <button className="btn btn-ghost small" onClick={onClose}>Close</button>
        </div>
        <div className="p-4 space-y-3">
          <div className="font-semibold">{finalSummary}</div>
          {!!trend && <div className="small text-sub">{trend}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-line">
              <div className="font-semibold mb-1">Suggested Medicines</div>
              {meds.length ? (
                <div className="flex flex-wrap gap-2">{meds.map((m,i)=><span key={i} className="pill">{m}</span>)}</div>
              ) : <div className="small text-sub">—</div>}
            </div>

            <div className="p-3 rounded-lg border border-line">
              <div className="font-semibold mb-1">Key Numbers</div>
              <div className="small text-sub">
                {numerics ? [
                  numerics.avg_systolic && `Avg Sys: ${numerics.avg_systolic}`,
                  numerics.avg_diastolic && `Avg Dia: ${numerics.avg_diastolic}`,
                  numerics.min_systolic && `Min Sys: ${numerics.min_systolic}`,
                  numerics.max_systolic && `Max Sys: ${numerics.max_systolic}`,
                ].filter(Boolean).join(' • ') : '—'}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-line">
              <div className="font-semibold mb-1">Lifestyle</div>
              {lifestyle.length
                ? <ul className="list-disc pl-5 small">{lifestyle.map((l,i)=><li key={i}>{l}</li>)}</ul>
                : <div className="small text-sub">—</div>}
            </div>

            <div className="p-3 rounded-lg border border-line">
              <div className="font-semibold mb-1">Precautions</div>
              {precautions.length
                ? <ul className="list-disc pl-5 small">{precautions.map((p,i)=><li key={i}>{p}</li>)}</ul>
                : <div className="small text-sub">—</div>}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-line">
            <div className="font-semibold mb-1">Possible Conditions</div>
            {causes.length
              ? <div className="flex flex-wrap gap-2">{causes.map((c,i)=><span key={i} className="pill">{c}</span>)}</div>
              : <div className="small text-sub">—</div>}
          </div>

          <div className="small text-sub">Created: {ts}</div>
        </div>
      </div>
    </div>
  );
}

export default function History() {
  const [items, setItems] = useState([]);
  const [page, setPage]   = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(30);
  const [open, setOpen]   = useState(false);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load(p = 1) {
    setLoading(true);
    try {
      const res = await api.get('/api/patient/history/reports', { params: { page: p, limit }});
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
      setPage(res.data.page || p);
    } catch (e) {
      console.error('history fetch failed', e);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(1); }, []);

  return (
    <Shell role="patient">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">History</div>
          <div className="small text-sub">Your approved doctor reports across sessions</div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost small" onClick={()=>load(page)}>{loading ? 'Loading…' : 'Refresh'}</button>
        </div>
      </div>

      {!items.length && !loading && <div className="card small text-sub">No reports yet.</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((r, i) => {
          const raw = r.content?.aiContent || r.content || {};
          const title = r.content?.finalSummary || raw.prediction || raw.summary || 'Approved report';
          const ts = new Date(r.createdAt).toLocaleString();
          return (
            <div key={r._id || i} className="card">
              <div className="font-medium mb-1 line-clamp-2">{title}</div>
              <div className="small text-sub">{ts}</div>
              <div className="mt-3 flex items-center gap-2">
                <button className="btn btn-ghost small" onClick={() => { setCurrent(r); setOpen(true); }}>View</button>
              </div>
            </div>
          );
        })}
      </div>

      {(total > limit) && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button className="btn btn-ghost small" disabled={page<=1} onClick={()=>load(page-1)}>Prev</button>
          <div className="small text-sub">Page {page} / {Math.ceil(total/limit)}</div>
          <button className="btn btn-ghost small" disabled={(page*limit)>=total} onClick={()=>load(page+1)}>Next</button>
        </div>
      )}

      <ReportModal open={open} onClose={()=>setOpen(false)} report={current} />
    </Shell>
  );
}

