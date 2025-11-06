import React, { useEffect, useMemo, useState } from 'react';
import Shell from '../../components/Shell';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, AreaChart, Area } from 'recharts';

export default function PatientAnalytics() {
  const [readings, setReadings] = useState([]);

  useEffect(() => {
    (async () => {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/api/patient/readings`, { headers: { Authorization: `Bearer ${token}` } });
      setReadings(res.data.readings || []);
    })();
  }, []);

  const week = useMemo(() => {
    const now = new Date(); const past7 = new Date(now); past7.setDate(now.getDate()-7);
    const data = (readings || []).filter(r => new Date(r.measuredAt) >= past7)
      .sort((a,b)=> new Date(a.measuredAt)-new Date(b.measuredAt))
      .map(r => ({
        t: new Date(r.measuredAt),
        day: new Date(r.measuredAt).toLocaleDateString(undefined,{weekday:'short'}),
        systolic: r.systolic,
        diastolic: r.diastolic
      }));
    const avg = (arr)=> arr.reduce((s,x)=> s+x,0)/Math.max(arr.length,1);
    const avgSys = Math.round(avg(data.map(d=>d.systolic)));
    const avgDia = Math.round(avg(data.map(d=>d.diastolic)));
    return { data, avgSys, avgDia, cnt: data.length };
  }, [readings]);

  const varSpark = useMemo(() => {
    const win = 3;
    const arr = week.data.map((d, i) => {
      const slice = week.data.slice(Math.max(0, i-win+1), i+1);
      const m = slice.reduce((s,x)=> s+x.systolic, 0) / (slice.length || 1);
      const v = Math.sqrt(slice.reduce((s,x)=> s + Math.pow(x.systolic - m,2), 0) / (slice.length || 1));
      return { name: d.day, var: +v.toFixed(2) };
    });
    return arr;
  }, [week]);

  return (
    <Shell role="patient">
      <h2 className="text-lg font-semibold mb-3">Analytics</h2>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="card">
          <div className="label mb-1">Average Systolic</div>
          <div className="text-2xl font-semibold">{week.avgSys || '—'} <span className="small">mmHg</span></div>
        </div>
        <div className="card">
          <div className="label mb-1">Average Diastolic</div>
          <div className="text-2xl font-semibold">{week.avgDia || '—'} <span className="small">mmHg</span></div>
        </div>
        <div className="card">
          <div className="label mb-1">Readings This Week</div>
          <div className="text-2xl font-semibold">{week.cnt}</div>
          <div className="small">Aim for 5+ for better AI accuracy</div>
        </div>
      </div>

      {/* Trend chart */}
      <div className="chart-card mb-4">
        <div className="label mb-2">Blood Pressure Trends (7 days)</div>
        <div style={{width:'100%', height: 280}}>
          <ResponsiveContainer>
            <LineChart data={week.data}>
              <CartesianGrid stroke="var(--line)" />
              <XAxis dataKey="day" stroke="var(--sub)" />
              <YAxis stroke="var(--sub)" />
              <Tooltip contentStyle={{background:'var(--panel)', border:'1px solid var(--line)'}} />
              <Legend />
              <Line type="monotone" dataKey="systolic" stroke="var(--brand)" dot={false} />
              <Line type="monotone" dataKey="diastolic" stroke="#60a5fa" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Variability sparkline */}
      <div className="chart-card">
        <div className="label mb-2">Systolic Variability (rolling window)</div>
        <div style={{width:'100%', height: 160}}>
          <ResponsiveContainer>
            <AreaChart data={varSpark}>
              <defs>
                <linearGradient id="varFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="var(--sub)" />
              <YAxis stroke="var(--sub)" />
              <Tooltip contentStyle={{background:'var(--panel)', border:'1px solid var(--line)'}} />
              <Area type="monotone" dataKey="var" stroke="var(--brand)" fillOpacity={1} fill="url(#varFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Shell>
  );
}
