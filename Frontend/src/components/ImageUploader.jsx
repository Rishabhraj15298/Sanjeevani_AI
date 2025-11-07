// frontend/src/components/ImageUploader.jsx
import React, { useState } from 'react';
import api from '../services/api';

export default function ImageUploader({ onDetected }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ocrText, setOcrText] = useState('');

  async function handleFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('image', f);
      const res = await api.post('/api/patient/upload-bp-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.ok) {
        setOcrText(res.data.text || '');
        // pass parsed to parent
        onDetected && onDetected({ parsed: res.data.parsed, text: res.data.text });
      } else {
        onDetected && onDetected({ error: 'ocr_failed' });
      }
    } catch (err) {
      console.error('upload failed', err);
      onDetected && onDetected({ error: 'upload_failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label className="btn btn-ghost small">
        Upload image
        <input className="hidden" type="file" accept="image/*" onChange={handleFile} />
      </label>
      {loading && <div className="text-xs">Processing…</div>}
      {preview && <img src={preview} alt="preview" className="w-16 h-16 object-contain rounded" />}
      {ocrText && <div className="text-xs text-slate-400 max-w-xs truncate">{ocrText}</div>}
    </div>
  );
}
