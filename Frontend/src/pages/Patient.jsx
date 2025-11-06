// import React, { useEffect, useState } from 'react';
// import Layout from '../components/Layout';
// import PatientForm from '../components/PatientForm';
// import axios from 'axios';
// import { createSocket, getSocket, disconnectSocket } from '../lib/socket';

// export default function PatientPage() {
//   const [readings, setReadings] = useState([]);
//   const [approvedReports, setApprovedReports] = useState([]);

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (!token) { window.location.href = '/'; return; }
//     createSocket(token);
//     const s = getSocket();
//     s.on('report:approved', (data) => {
//       setApprovedReports(prev => [data, ...prev]);
//       alert('Your report has been approved by doctor.');
//     });
//     return () => { try { s.off(); disconnectSocket(); } catch (e) {} };
//   }, []);

//   useEffect(() => {
//     async function fetchData() {
//       const token = localStorage.getItem('token');
//       const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
//       const r = await axios.get(`${API}/api/patient/readings`, { headers: { Authorization: `Bearer ${token}` } });
//       setReadings(r.data.readings || []);
//       const a = await axios.get(`${API}/api/patient/approved-reports`, { headers: { Authorization: `Bearer ${token}` } });
//       setApprovedReports(a.data.approved || []);
//     }
//     fetchData();
//   }, []);

//   return (
//     <Layout>
//       <h2 className="text-lg font-semibold mb-3">Patient Dashboard</h2>
//       <PatientForm onAdded={(r) => setReadings(prev => [r.reading, ...prev])} />
//       <section className="mt-6">
//         <h3 className="font-medium mb-2">Recent Readings</h3>
//         <div className="space-y-2">
//           {readings.map(r => (
//             <div key={r._id} className="bg-white p-3 rounded shadow">
//               <div className="text-sm text-slate-500">{new Date(r.measuredAt).toLocaleString()}</div>
//               <div className="font-medium mt-1">{r.systolic}/{r.diastolic} mmHg</div>
//               <div className="text-sm mt-1">Pulse: {r.pulse || '—'}</div>
//             </div>
//           ))}
//         </div>
//       </section>

//       <section className="mt-6">
//         <h3 className="font-medium mb-2">Approved Reports</h3>
//         <div className="space-y-2">
//           {approvedReports.map(a => (
//             <div key={a._id || a.approvedId} className="bg-white p-3 rounded shadow">
//               <div className="text-sm text-slate-500">Approved: {new Date(a.approvedAt || a.approvedAt).toLocaleString()}</div>
//               <div className="font-medium mt-1">{a.finalSummary}</div>
//               <div className="text-sm mt-2">Meds: {(a.meds || []).join(', ')}</div>
//               <div className="text-sm mt-2">Doctor Notes: {a.doctorNotes}</div>
//             </div>
//           ))}
//           {!approvedReports.length && <div className="text-slate-500">No approved reports yet.</div>}
//         </div>
//       </section>
//     </Layout>
//   );
// }


// src/pages/Patient.jsx
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PatientForm from '../components/PatientForm';
import Notifications from '../components/Notifications';
import axios from 'axios';
import Banner from '../components/Banner';
import { ensureSocket, getSocket } from '../lib/socket';

import { createSocket, getSocket, disconnectSocket } from '../lib/socket';

export default function PatientPage() {
  const [readings, setReadings] = useState([]);
  const [approvedReports, setApprovedReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [nudgeMsg, setNudgeMsg] = useState('');
   

  useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = '/'; return; }
  const s = ensureSocket();

  s.on('report:approved', (data) => {
    setApprovedReports(prev => [data, ...prev]);
    setNotifications(prev => [{ title: 'Report Approved', message: 'Doctor approved your report.', time: new Date().toISOString() }, ...prev]);
  });

  s.on('report:declined', (data) => {
    const reason = data?.reason || 'No reason provided';
    setNotifications(prev => [{ title: 'Report Declined', message: reason, time: new Date().toISOString() }, ...prev]);
    alert('Doctor declined the report: ' + reason);
  });

  // ✅ NUDGE LISTENER
  s.on('nudge:keep-going', (payload) => {
    setNudgeMsg(payload?.message || 'Keep going!');
  });

  return () => { s.off('report:approved'); s.off('report:declined'); s.off('nudge:keep-going'); };
}, []);



  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem('token');
      const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const r = await axios.get(`${API}/api/patient/readings`, { headers: { Authorization: `Bearer ${token}` } });
      setReadings(r.data.readings || []);
      const a = await axios.get(`${API}/api/patient/approved-reports`, { headers: { Authorization: `Bearer ${token}` } });
      setApprovedReports(a.data.approved || []);
    }
    fetchData();
  }, []);

  return (
    <Layout>
      <h2 className="text-lg font-semibold mb-3">Patient Dashboard</h2>
    <Banner message={nudgeMsg} onClose={() => setNudgeMsg('')} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Submit & Lists */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="font-medium mb-2">Submit New Reading</h3>
            <PatientForm onAdded={(r) => setReadings(prev => [r.reading, ...prev])} />
          </div>

          <section>
            <h3 className="font-medium mb-2">Recent Readings</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {readings.map(r => (
                <div key={r._id} className="bg-white p-3 rounded shadow border border-slate-200">
                  <div className="text-xs text-slate-500">{new Date(r.measuredAt).toLocaleString()}</div>
                  <div className="font-semibold mt-1 text-slate-800">{r.systolic}/{r.diastolic} mmHg</div>
                  <div className="text-sm text-slate-600 mt-1">Pulse: {r.pulse || '—'}</div>
                  {Array.isArray(r.symptoms) && r.symptoms.length ? (
                    <div className="text-xs mt-1 text-slate-500">Symptoms: {r.symptoms.join(', ')}</div>
                  ) : null}
                </div>
              ))}
              {!readings.length && <div className="text-slate-500 text-sm">No readings yet.</div>}
            </div>
          </section>

          <section>
            <h3 className="font-medium mb-2">Approved Reports</h3>
            <div className="space-y-2">
              {approvedReports.map(a => (
                <div key={a._id || a.approvedId} className="bg-white p-3 rounded shadow border border-slate-200">
                  <div className="text-xs text-slate-500">Approved: {new Date(a.approvedAt || Date.now()).toLocaleString()}</div>
                  <div className="font-medium mt-1 text-slate-800">{a.finalSummary}</div>
                  <div className="text-sm mt-2"><span className="font-semibold">Meds:</span> {(a.meds || []).join(', ') || '—'}</div>
                  <div className="text-sm mt-1"><span className="font-semibold">Doctor Notes:</span> {a.doctorNotes || '—'}</div>
                </div>
              ))}
              {!approvedReports.length && <div className="text-slate-500 text-sm">No approved reports yet.</div>}
            </div>
          </section>
        </div>

        {/* Right: Notifications */}
        <div className="space-y-3">
          <h3 className="font-medium mb-2">Notifications</h3>
          <Notifications items={notifications} />
        </div>
      </div>
    </Layout>
  );
}
