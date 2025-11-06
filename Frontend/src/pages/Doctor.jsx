// import React, { useEffect, useState } from 'react';
// import Layout from '../components/Layout';
// import DoctorList from '../components/DoctorList';
// import axios from 'axios';
// import { createSocket, getSocket, disconnectSocket } from '../lib/socket';

// export default function DoctorPage() {
//   const [aiReports, setAiReports] = useState([]);

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (!token) { window.location.href = '/'; return; }
//     createSocket(token);
//     const s = getSocket();
//     s.on('reading:created', (payload) => {
//       console.log('reading:created', payload);
//     });
//     s.on('ai_report:generated', (payload) => {
//       setAiReports(prev => [{ aiReportId: payload.aiReportId, patientId: payload.patientId, content: payload.content, patientName: payload.patientName || null }, ...prev]);
//     });
//     return () => { try { s.off(); disconnectSocket(); } catch (e) {} };
//   }, []);

//   useEffect(() => {
//     async function fetchPending() {
//       const token = localStorage.getItem('token');
//       const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
//       const res = await axios.get(`${API}/api/doctor/pending`, { headers: { Authorization: `Bearer ${token}` } });
//       const formatted = (res.data.reports || []).map(r => ({ _id: r._id, aiReportId: r._id, content: r.content, patient: r.patient, patientName: r.patient?.name }));
//       setAiReports(formatted);
//     }
//     fetchPending();
//   }, []);

//   function handleApprove(approved) {
//     setAiReports(prev => prev.filter(p => (p.aiReportId || p._id) !== (approved.aiReport || approved._id)));
//   }

//   return (
//     <Layout>
//       <h2 className="text-lg font-semibold mb-3">Doctor Dashboard</h2>
//       <DoctorList aiReports={aiReports} onApprove={handleApprove} />
//     </Layout>
//   );
// }


// src/pages/Doctor.jsx
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import DoctorList from '../components/DoctorList';
import axios from 'axios';
import { createSocket, getSocket, disconnectSocket } from '../lib/socket';

export default function DoctorPage() {
  const [aiReports, setAiReports] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/'; return; }
    createSocket(token);
    const s = getSocket();

    s.on('reading:created', (payload) => {
      console.log('reading:created', payload);
    });

    s.on('ai_report:generated', (payload) => {
      setAiReports(prev => [
        {
          aiReportId: payload.aiReportId,
          patientId: payload.patientId,
          content: payload.content,
          patientDetails: payload.patientDetails,
          createdAt: payload.createdAt
        },
        ...prev
      ]);
    });

    return () => { try { s.off(); disconnectSocket(); } catch (e) {} };
  }, []);

  useEffect(() => {
    async function fetchPending() {
      const token = localStorage.getItem('token');
      const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await axios.get(`${API}/api/doctor/pending`, { headers: { Authorization: `Bearer ${token}` } });
      const formatted = (res.data.reports || []).map(r => ({
        _id: r._id,
        aiReportId: r._id,
        content: r.content,
        patientDetails: {
          name: r.patient?.name,
          age: r.patient?.age,
          gender: r.patient?.gender,
          weight: r.patient?.weight,
          pmh: r.patient?.pmh,
          allergies: r.patient?.allergies
        },
        createdAt: r.createdAt
      }));
      setAiReports(formatted);
    }
    fetchPending();
  }, []);

  function handleApprove(approved) {
    // remove approved card
    setAiReports(prev => prev.filter(p => (p.aiReportId || p._id) !== (approved.aiReport || approved._id)));
  }

  function handleDecline({ id }) {
    // remove declined card
    setAiReports(prev => prev.filter(p => (p.aiReportId || p._id) !== id));
  }

  return (
    <Layout>
      <h2 className="text-lg font-semibold mb-3">Doctor Dashboard</h2>
      <p className="text-slate-600 mb-4 text-sm">
        Review AI suggestions, check patient context, then Approve or Decline with a reason.
      </p>
      <DoctorList aiReports={aiReports} onApprove={handleApprove} onDecline={handleDecline} />
    </Layout>
  );
}
