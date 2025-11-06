import React, { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import api from '../../services/api';
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function DoctorAnalytics() {
  const [data, setData] = useState([]);

  useEffect(()=> {
    // Sample: fetch aggregated endpoint if you have one. Otherwise we'll fetch pending and map.
    (async ()=> {
      try {
        const res = await api.get('/api/doctor/pending'); // fallback: just list pending reports
        const mapped = (res.data.reports || []).map(r => ({ name: r.patient?.name || 'Unknown', avgSys: r.content?.numerics?.avg_systolic || 0, avgDia: r.content?.numerics?.avg_diastolic || 0 }));
        setData(mapped);
      } catch (e) { console.warn(e); }
    })();
  }, []);

  return (
    <Shell role="doctor">
      <h2 className="text-lg font-semibold mb-3">Doctor Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        <div className="card"><div className="label">Active Requests</div><div className="text-2xl">{data.length}</div></div>
        <div className="card"><div className="label">Avg Systolic (sample)</div><div className="text-2xl">{Math.round(data.reduce((s,d)=>s+d.avgSys,0)/(data.length||1))}</div></div>
        <div className="card"><div className="label">Avg Diastolic (sample)</div><div className="text-2xl">{Math.round(data.reduce((s,d)=>s+d.avgDia,0)/(data.length||1))}</div></div>
      </div>

      <div className="chart-card">
        <div className="label mb-2">Patient Averages (sample)</div>
        <div style={{width:'100%',height:300}}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid stroke="var(--line)" />
              <XAxis dataKey="name" stroke="var(--sub)" />
              <YAxis stroke="var(--sub)" />
              <Tooltip contentStyle={{background:'var(--panel)', border:'1px solid var(--line)'}} />
              <Legend />
              <Line type="monotone" dataKey="avgSys" stroke="var(--brand)" />
              <Line type="monotone" dataKey="avgDia" stroke="#60a5fa" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Shell>
  );
}
