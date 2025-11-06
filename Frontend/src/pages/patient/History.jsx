import React, { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import api from '../../services/api';

export default function History() {
  const [readings, setReadings] = useState([]);
  useEffect(()=>{ (async ()=> {
    const res = await api.get('/api/patient/readings');
    setReadings(res.data.readings || []);
  })(); }, []);
  return (
    <Shell role="patient">
      <h2 className="text-lg font-semibold mb-3">History</h2>
      <div className="card">
        <table className="w-full text-sm">
          <thead className="small text-sub">
            <tr><th>Date</th><th>Systolic</th><th>Diastolic</th><th>Pulse</th></tr>
          </thead>
          <tbody>
            {readings.map(r => (
              <tr key={r._id} className="border-t border-line">
                <td className="py-2 small">{new Date(r.measuredAt).toLocaleString()}</td>
                <td className="py-2">{r.systolic}</td>
                <td className="py-2">{r.diastolic}</td>
                <td className="py-2">{r.pulse ?? '—'}</td>
              </tr>
            ))}
            {!readings.length && <tr><td colSpan={4} className="small">No readings yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
