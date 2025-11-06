import React from 'react';

export default function AIPlan({ content }) {
  if (!content) return <div className="small">No AI content.</div>;
  return (
    <div className="space-y-3">
      <div>
        <div className="label">Prediction</div>
        <div>{content.prediction || '—'}</div>
      </div>
      <div>
        <div className="label">Trend</div>
        <div className="small">{content.trend_explanation}</div>
      </div>
      <div>
        <div className="label">Suggested Medicines</div>
        <div className="flex gap-2 flex-wrap">
          {(content.suggested_medicines||[]).map((m,i)=> <span key={i} className="pill">{m}</span>)}
        </div>
      </div>
    </div>
  );
}
