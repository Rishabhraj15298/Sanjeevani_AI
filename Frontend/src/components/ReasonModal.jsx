// src/components/ReasonModal.jsx
import React, { useState } from 'react';

export default function ReasonModal({ open=false, onClose=()=>{}, onSubmit=(r)=>{} }) {
  const [reason, setReason] = useState('');

  React.useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(2,6,23,0.6)'}}>
      <div className="w-full max-w-md mx-4 card">
        <div className="font-semibold mb-2">Decline report — add reason</div>
        <textarea className="textarea" rows={4} value={reason} onChange={e=>setReason(e.target.value)} />
        <div className="flex justify-end gap-2 mt-3">
          <button className="btn btn-ghost small" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger small" onClick={() => onSubmit(reason || 'No reason provided')}>Send</button>
        </div>
      </div>
    </div>
  );
}
