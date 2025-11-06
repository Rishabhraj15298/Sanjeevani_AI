import React from 'react';

export default function Banner({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="card border-l-4" style={{borderLeftColor:'var(--brand)'}}>
      <div className="flex items-start gap-3">
        <div className="pill">Nudge</div>
        <div className="flex-1">{message}</div>
        <button onClick={onClose} className="btn btn-ghost small">Dismiss</button>
      </div>
    </div>
  );
}
