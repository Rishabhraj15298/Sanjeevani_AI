import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import PMHSelector from '../components/PMHSelector';

export default function Login() {
  const [register, setRegister] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'patient', age:'', gender:'other', weight:'', pmh:[], allergies:'' });
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      if (register) {
        const payload = {
          name: form.name, email: form.email, password: form.password, role: form.role,
          age: form.age ? Number(form.age) : undefined,
          gender: form.gender, weight: form.weight ? Number(form.weight) : undefined,
          pmh: form.pmh, allergies: form.allergies ? form.allergies.split(',').map(s=>s.trim()) : []
        };
        const res = await api.post('/api/auth/register', payload);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        nav(res.data.user.role === 'doctor' ? '/doctor' : '/patient');
      } else {
        const res = await api.post('/api/auth/login', { email: form.email, password: form.password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        nav(res.data.user.role === 'doctor' ? '/doctor' : '/patient');
      }
    } catch (e) { alert(e?.response?.data?.message || 'Auth error'); }
  }

  return (
    <div className="app-wrap py-10">
      <div className="max-w-xl mx-auto card">
        <h2 className="text-xl font-semibold mb-3">{register ? 'Create account' : 'Login'}</h2>
        <form onSubmit={submit} className="space-y-3">
          {register && <>
            <input className="input" placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
            <div className="grid grid-cols-2 gap-2">
              <input className="input" placeholder="Age" value={form.age} onChange={e=>setForm({...form,age:e.target.value})} />
              <select className="select" value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}>
                <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input className="input" placeholder="Weight (kg)" value={form.weight} onChange={e=>setForm({...form,weight:e.target.value})} />
              <select className="select" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            <div>
              <div className="label mb-1">Past Medical History</div>
              <PMHSelector value={form.pmh} onChange={v=>setForm({...form,pmh:v})} />
            </div>

            <input className="input" placeholder="Allergies (comma separated)" value={form.allergies} onChange={e=>setForm({...form,allergies:e.target.value})} />
          </>}

          <input className="input" placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required />
          <input className="input" placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required />

          <div className="flex items-center justify-between">
            <button className="btn btn-ok" type="submit">{register ? 'Register' : 'Login'}</button>
            <button type="button" className="btn btn-ghost" onClick={()=>setRegister(!register)}>{register ? 'Have an account? Login' : 'Create account'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
