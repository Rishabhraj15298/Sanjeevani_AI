import React, { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import PMHSelector from '../../components/PMHSelector';
import FileUpload from '../../components/FileUpload';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const [profile, setProfile] = useState({ name:'', age:'', gender:'other', weight:'', pmh:[], allergies:[] });
  useEffect(()=>{ (async ()=> {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    if (u) setProfile({...profile, name: u.name, age: u.age, gender: u.gender, weight: u.weight, pmh: u.pmh || [], allergies: u.allergies || []});
  })(); }, []);

  async function save() {
    try {
      const payload = { age: profile.age, gender: profile.gender, weight: profile.weight, pmh: profile.pmh, allergies: profile.allergies };
      const res = await api.post('/api/patient/profile', payload);
      localStorage.setItem('user', JSON.stringify({...JSON.parse(localStorage.getItem('user')), ...res.data.user}));
      toast.success('Profile updated');
    } catch (e) { toast.error('Save failed'); }
  }

  return (
    <Shell role="patient">
      <h2 className="text-lg font-semibold mb-3">Profile</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card space-y-3">
          <div>
            <div className="label">Full Name</div>
            <input className="input" value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><div className="label">Age</div><input className="input" value={profile.age} onChange={e=>setProfile({...profile,age:e.target.value})} /></div>
            <div><div className="label">Gender</div><select className="select" value={profile.gender} onChange={e=>setProfile({...profile,gender:e.target.value})}><option>male</option><option>female</option><option>other</option></select></div>
          </div>
          <div><div className="label">Weight (kg)</div><input className="input" value={profile.weight} onChange={e=>setProfile({...profile,weight:e.target.value})} /></div>
          <div>
            <div className="label">Past Medical History</div>
            <PMHSelector value={profile.pmh} onChange={v=>setProfile({...profile,pmh:v})} />
          </div>
          <div>
            <div className="label">Allergies (comma separated)</div>
            <input className="input" value={(profile.allergies || []).join(', ')} onChange={e=>setProfile({...profile,allergies: e.target.value.split(',').map(s=>s.trim())})} />
          </div>
          <div className="flex justify-end"><button onClick={save} className="btn btn-ok">Save Changes</button></div>
        </div>

        <div className="space-y-3">
          <div className="card">
            <div className="label">Medical Documents</div>
            <FileUpload onUploaded={()=>{ /* refresh files from server if needed */ }} />
          </div>
          <div className="card">
            <div className="label">Uploaded Documents</div>
            {/* optionally list via GET /api/patient/files */}
          </div>
        </div>
      </div>
    </Shell>
  );
}
