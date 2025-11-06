import React, { useState } from 'react';
import api from '../services/api';

export default function FileUpload({ onUploaded }) {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  async function upload() {
    if (!files.length) return;
    setBusy(true);
    try {
      const form = new FormData();
      files.forEach(f => form.append('files', f));
      const res = await api.post('/api/patient/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      onUploaded && onUploaded(res.data.files || []);
      setFiles([]);
    } catch (e) {
      alert(e?.response?.data?.message || 'Upload failed');
    } finally { setBusy(false); }
  }

  return (
    <div className="card">
      <div className="label mb-2">Upload Medical Files (PNG/JPG/PDF)</div>
      <input type="file" multiple accept=".png,.jpg,.jpeg,.pdf" onChange={(e)=> setFiles(Array.from(e.target.files||[]))} className="w-full mb-3" />
      <div className="flex justify-end">
        <button onClick={upload} disabled={busy || !files.length} className="btn btn-ghost">{busy ? 'Uploading…' : 'Upload'}</button>
      </div>
    </div>
  );
}
