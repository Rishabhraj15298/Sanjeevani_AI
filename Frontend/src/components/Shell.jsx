import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Shell({ children, role='patient' }) {
  const loc = useLocation();
  const tabsPatient = [
    { to:'/patient', label:'Chatbot' },
    { to:'/patient/analytics', label:'Analytics' },
    { to:'/patient/history', label:'History' },
    { to:'/patient/profile', label:'Profile' },
  ];
  const tabsDoctor = [
    { to:'/doctor', label:'Queue' },
    { to:'/doctor/analytics', label:'Analytics' },
    { to:'/doctor/patients', label:'Patients' },
    { to:'/doctor/files', label:'Files' },
  ];
  const tabs = role === 'doctor' ? tabsDoctor : tabsPatient;
  const active = (p) => loc.pathname === p;

  function logout() {
    localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/';
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-wrap py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{width:32,height:32,background:'rgba(34,211,238,.12)',border:'1px solid rgba(34,211,238,.28)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>💙</div>
            <div className="font-semibold tracking-wide">BP Monitor</div>
          </div>
          <div>
            <button onClick={logout} className="btn btn-ghost small">Logout</button>
          </div>
        </div>
        <div className="app-wrap pb-2">
          <nav className="tabs flex flex-wrap gap-2">
            {tabs.map(t => (
              <Link key={t.to} to={t.to} className={active(t.to) ? 'active' : ''}>{t.label}</Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="app-wrap p-4">{children}</main>
    </div>
  );
}
