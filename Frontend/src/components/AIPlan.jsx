// import React from 'react';

// export default function AIPlan({ content }) {
//   if (!content) return <div className="small">No AI content.</div>;
//   return (
//     <div className="space-y-3">
//       <div>
//         <div className="label">Prediction</div>
//         <div>{content.prediction || '—'}</div>
//       </div>
//       <div>
//         <div className="label">Trend</div>
//         <div className="small">{content.trend_explanation}</div>
//       </div>
//       <div>
//         <div className="label">Suggested Medicines</div>
//         <div className="flex gap-2 flex-wrap">
//           {(content.suggested_medicines||[]).map((m,i)=> <span key={i} className="pill">{m}</span>)}
//         </div>
//       </div>
//     </div>
//   );
// }

// src/components/AIPlan.jsx
import React from "react";

export default function AIPlan({ content }) {
  if (!content) return <div className="small text-sub">No content available</div>;

  const ml = content?.ml_recommendation;
  const meds = Array.isArray(content?.suggested_medicines)
    ? content.suggested_medicines
    : (content?.suggested_medicines || "").split(",").map((x) => x.trim());

  const mlBrands = typeof ml?.suggestedBrands === "string"
    ? ml.suggestedBrands.split(",").map((x) => x.trim()).slice(0, 8)
    : [];

  return (
    <div className="space-y-3">
      {/* Gemini Section */}
      <div className="p-3 rounded-xl border border-slate-700 bg-[#0c1622]">
        <div className="text-sm font-semibold text-white">🧠 Gemini AI Analysis</div>
        <div className="text-slate-300 text-sm mt-2">
          {content.summary || "No summary provided."}
        </div>

        <div className="mt-2 text-xs text-slate-400">
          Conditions: {(content.possible_conditions || []).join(", ") || "—"}
        </div>

        <div className="mt-2">
          <div className="font-medium text-sm text-white">Suggested Medicines</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {meds.map((m, i) => (
              <span key={i} className="px-2 py-1 text-xs rounded bg-slate-800 text-slate-200">
                {m}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-2">
          <div className="font-medium text-sm text-white">Lifestyle Tips</div>
          <ul className="list-disc pl-6 text-slate-300 text-xs mt-1">
            {(content.lifestyle_tips || []).map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Adaptive ML Section */}
      {ml && ml.ok && (
        <div className="p-3 rounded-xl border border-green-700 bg-[#0e1b10]">
          <div className="text-sm font-semibold text-green-400">
            🤖 ML Recommendation (Adaptive Model)
          </div>

          <div className="text-slate-300 text-sm mt-2">
            <span className="font-medium">Group:</span> {ml.predictedGroup} → {ml.newGroup}
          </div>

          <div className="text-slate-300 text-sm">
            <span className="font-medium">Confidence:</span> {(ml.confidence * 100).toFixed(1)}%
          </div>

          <div className="text-slate-300 text-sm mt-2">
            <span className="font-medium">Recommended Class:</span> {ml.recommendedClass || "—"}
          </div>

          <div className="text-slate-300 text-sm mt-2">
            <span className="font-medium">Top Suggested Brands:</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {mlBrands.map((b, i) => (
              <span
                key={i}
                className="px-2 py-1 text-xs rounded-full bg-green-900 text-green-200 border border-green-700"
              >
                {b}
              </span>
            ))}
          </div>

          {ml.clinicalNote && (
            <div className="text-xs text-slate-400 mt-2">
              Note: {ml.clinicalNote}
            </div>
          )}
        </div>
      )}

      {!ml?.ok && (
        <div className="p-2 text-xs text-slate-400 border border-slate-700 rounded-lg">
          ⚠️ ML Model response unavailable or failed.
        </div>
      )}
    </div>
  );
}

