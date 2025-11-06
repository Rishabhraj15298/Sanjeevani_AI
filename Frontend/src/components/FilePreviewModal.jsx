// src/components/FilePreviewModal.jsx
import React, { useState } from 'react';

export default function FilePreviewModal({ files = [], open = false, onClose = () => {} }) {
  const [selected, setSelected] = useState(files?.[0] || null);

  React.useEffect(() => {
    setSelected(files?.[0] || null);
  }, [files, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(2,6,23,0.6)'}}>
      <div className="max-w-5xl w-full mx-4 rounded-xl overflow-hidden" style={{background:'var(--panel)'}}>
        <div className="p-3 flex items-center justify-between border-b" style={{borderColor:'var(--line)'}}>
          <div className="font-medium">{selected?.originalName || 'Files preview'}</div>
          <div>
            <button className="btn btn-ghost small" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Thumbs */}
          <div className="lg:col-span-1 space-y-2">
            {files.map(f => (
              <div key={f._id} className={`p-2 rounded-md border ${selected?._id === f._id ? 'border-brand/40' : 'border-line'}`} style={{cursor:'pointer'}} onClick={() => setSelected(f)}>
                <div className="font-medium small">{f.originalName}</div>
                <div className="small text-sub">{new Date(f.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Viewer */}
          <div className="lg:col-span-3" style={{minHeight: 360}}>
            {selected ? (
              selected.mimeType && selected.mimeType.startsWith('image/') ? (
                <img src={selected.url} alt={selected.originalName} style={{maxWidth:'100%', maxHeight:'70vh'}} />
              ) : (
                <iframe src={selected.url} title={selected.originalName} style={{width:'100%', height:'60vh', border:0}} />
              )
            ) : (
              <div className="small text-sub">No file selected</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
