import React from 'react';

export default function Notifications({ items = [] }) {
  if (!items.length) return <div className="small">No notifications.</div>;
  return (
    <div className="space-y-2">
      {items.map((n,i) => (
        <div key={i} className="card flex items-center justify-between">
          <div>
            <div className="small">{new Date(n.time).toLocaleString()}</div>
            <div>{n.title}</div>
            <div className="small">{n.message}</div>
          </div>
          <div><button className="btn btn-ghost small">View</button></div>
        </div>
      ))}
    </div>
  );
}
