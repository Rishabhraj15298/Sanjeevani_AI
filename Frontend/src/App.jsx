// import React from 'react';
// import { Routes, Route, Navigate } from 'react-router-dom';
// import Login from './pages/Login';
// import Patient from './pages/Patient';
// import Doctor from './pages/Doctor';
// import PatientAnalytics from './pages/patient/Analytics';

// function PrivateRoute({ children, role }) {
//   const token = localStorage.getItem('token');
//   const user = JSON.parse(localStorage.getItem('user') || 'null');
//   if (!token || !user) return <Navigate to="/" replace />;
//   if (role && user.role !== role) return <Navigate to="/" replace />;
//   return children;
// }

// export default function App() {
//   return (
//     <Routes>
//       <Route path="/" element={<Login />} />
//       <Route
//         path="/patient"
//         element={
//           <PrivateRoute role="patient">
//             <Patient />
//           </PrivateRoute>
//         }
//       />
//       <Route
//         path="/doctor"
//         element={
//           <PrivateRoute role="doctor">
//             <Doctor />
//           </PrivateRoute>
//         }
//       />
//       <Route path="/patient/analytics" element={<PrivateRoute role="patient"><PatientAnalytics/></PrivateRoute>} />
//     </Routes>
//   );
// }


import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth';
import PatientChat from './pages/patient/Chatbot';
import PatientAnalytics from './pages/patient/Analytics';
import PatientHistory from './pages/patient/History';
import PatientProfile from './pages/patient/Profile';
import DoctorQueue from './pages/doctor/Queue';
import DoctorAnalytics from './pages/doctor/Analytics';
import DoctorPatients from './pages/doctor/Patients';
import DoctorFiles from './pages/doctor/Files';
import PrivateRoute from './components/PrivateRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/patient" element={<PrivateRoute role="patient"><PatientChat/></PrivateRoute>} />
      <Route path="/patient/analytics" element={<PrivateRoute role="patient"><PatientAnalytics/></PrivateRoute>} />
      <Route path="/patient/history" element={<PrivateRoute role="patient"><PatientHistory/></PrivateRoute>} />
      <Route path="/patient/profile" element={<PrivateRoute role="patient"><PatientProfile/></PrivateRoute>} />

      <Route path="/doctor" element={<PrivateRoute role="doctor"><DoctorQueue/></PrivateRoute>} />
      <Route path="/doctor/analytics" element={<PrivateRoute role="doctor"><DoctorAnalytics/></PrivateRoute>} />
      <Route path="/doctor/patients" element={<PrivateRoute role="doctor"><DoctorPatients/></PrivateRoute>} />
      <Route path="/doctor/files" element={<PrivateRoute role="doctor"><DoctorFiles/></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
