import React, { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import api from '../../services/api';

export default function DoctorPatients(){
  const [list,setList] = useState([]);
  useEffect(()=>{ (async ()=> {
    try {
      const res = await api.get('/api/doctor/pending'); // no dedicated patients endpoint in MVP; adapt later
      setList((res.data.reports||[]).map(r=> r.patient));
    } catch(e) { console.warn(e); }
  })(); }, []);
  return (
    <Shell role="doctor">
      <h2 className="text-lg font-semibold mb-3">Patients</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {list.map((p,i)=> (
          <div key={i} className="card">
            <div className="font-semibold">{p?.name}</div>
            <div className="small">{p?.age} • {p?.gender}</div>
            <div className="mt-2 small">{(p?.pmh || []).join(', ')}</div>
          </div>
        ))}
        {!list.length && <div className="small">No patients yet.</div>}
      </div>
    </Shell>
  );
}
