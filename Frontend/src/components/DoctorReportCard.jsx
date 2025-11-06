// src/components/DoctorReportCard.jsx
import React, { useState } from 'react';
import AIPlan from './AIPlan';
import FilePreviewModal from './FilePreviewModal';
import ReasonModal from './ReasonModal';
import api from '../services/api';

function Pill({ children }) { return <span className="pill">{children}</span>; }

export default function DoctorReportCard({ report, onApprove, onDecline }) {
  const { id, content, patient, createdAt } = report;
  const [files, setFiles] = useState([]);
  const [filesOpen, setFilesOpen] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [fetchingFiles, setFetchingFiles] = useState(false);

  async function fetchFiles() {
    if (!patient || !patient._id) return;
    setFetchingFiles(true);
    try {
      const res = await api.get(`/api/doctor/patient-files/${patient._id}`);
      setFiles(res.data.files || []);
      setFilesOpen(true);
    } catch (e) {
      console.error('fetch files failed', e);
      alert('Failed to fetch files');
    } finally { setFetchingFiles(false); }
  }

  return (
    <div className="card">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-sub">Patient: <span className="font-medium text-text">{patient?.name || '—'}</span></div>
            <div className="small text-sub">{new Date(createdAt).toLocaleString()}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl p-3 border" style={{borderColor:'var(--line)'}}>
              <AIPlan content={content} />
            </div>

            <div className="rounded-xl p-3 border" style={{borderColor:'var(--line)'}}>
              <div className="label mb-2">Patient Details</div>
              <div className="small text-sub mb-2">
                Age: {patient?.age ?? '—'} • Gender: {patient?.gender || '—'} • Weight: {patient?.weight ?? '—'}kg
              </div>

              <div>
                <div className="label mb-1">PMH</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(patient?.pmh || []).length ? patient.pmh.map((t,i)=><Pill key={i}>{t}</Pill>) : <div className="small text-sub">—</div>}
                </div>

                <div className="label mb-1">Allergies</div>
                <div className="mb-2">{(patient?.allergies && patient.allergies.length) ? patient.allergies.join(', ') : <span className="small text-sub">—</span>}</div>

                <div className="flex gap-2 mt-3">
                  <button onClick={fetchFiles} className="btn btn-ghost small">{fetchingFiles ? 'Loading…' : 'View Files'}</button>
                  <a className="btn btn-ghost small" href={`/api/doctor/patient-files/${patient?._id}`} target="_blank" rel="noreferrer">Open files API</a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button onClick={onApprove} className="btn btn-ok">Approve</button>
            <button onClick={() => setReasonOpen(true)} className="btn btn-danger">Decline</button>
            <a className="btn btn-ghost small" href={`/uploads`} target="_blank" rel="noreferrer">Uploads Folder</a>
          </div>
        </div>
      </div>

      {/* File preview modal */}
      <FilePreviewModal files={files} open={filesOpen} onClose={() => setFilesOpen(false)} />

      {/* Reason modal */}
      <ReasonModal open={reasonOpen} onClose={() => setReasonOpen(false)} onSubmit={(reason) => { setReasonOpen(false); onDecline(reason); }} />
    </div>
  );
}
