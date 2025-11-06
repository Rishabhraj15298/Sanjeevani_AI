import React, { useState } from 'react';
const DEFAULT_TAGS = ['hypertension','diabetes','thyroid','asthma','ckd','cad','hyperlipidemia','stroke','migraine'];

export default function PMHSelector({ value = [], onChange }) {
  const [custom, setCustom] = useState('');
  function toggle(tag) {
    const set = new Set(value);
    if (set.has(tag)) set.delete(tag);
    else set.add(tag);
    onChange(Array.from(set));
  }
  function addCustom(e) {
    e.preventDefault();
    const t = custom.trim().toLowerCase();
    if (!t) return;
    if (!value.includes(t)) onChange([...value, t]);
    setCustom('');
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {DEFAULT_TAGS.map(tag => (
          <button key={tag} type="button" onClick={() => toggle(tag)}
            className={`px-2 py-1 rounded-full text-xs border ${value.includes(tag) ? 'bg-brand/20 text-text' : 'bg-panel text-sub border-line'}`}>
            {tag}
          </button>
        ))}
      </div>
      <form onSubmit={addCustom} className="flex gap-2">
        <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="Add custom PMH tag" className="input" />
        <button className="btn btn-ghost">Add</button>
      </form>
      {value.length > 0 && <div className="mt-2 flex gap-2">{value.map(tag => <div key={tag} className="pill">{tag}</div>)}</div>}
    </div>
  );
}
