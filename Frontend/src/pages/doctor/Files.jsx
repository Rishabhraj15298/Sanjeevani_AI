// import React, { useEffect, useState } from 'react';
// import Shell from '../../components/Shell';
// import api from '../../services/api';

// export default function DoctorFiles() {
//   const [files, setFiles] = useState([]);
//   useEffect(()=>{ /* fetch recent files across patients if you want; backend endpoint needed */ },[]);
//   return (
//     <Shell role="doctor">
//       <h2 className="text-lg font-semibold mb-3">Files</h2>
//       <div className="card">
//         <div className="small">Doctor files viewer — select a patient from queue to view their files (implemented in DoctorQueue card).</div>
//       </div>
//     </Shell>
//   );
// }

// src/pages/doctor/Files.jsx
import React, { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import api from '../../services/api';

function FileCard({ f, onPreview }) {
  const isImage = f.mimeType && f.mimeType.startsWith('image/');
  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <div style={{width:84, height:84, borderRadius:8, overflow:'hidden', background:'rgba(255,255,255,0.02)', display:'flex', alignItems:'center', justifyContent:'center'}}>
          {isImage ? (
            <img src={f.url} alt={f.originalName} style={{width:'100%', height:'100%', objectFit:'cover'}} />
          ) : (
            <div style={{textAlign:'center'}}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="font-medium text-text">{f.originalName}</div>
          <div className="small text-sub">{f.patient?.name || 'Unknown patient'} • {f.patient?.age ? `${f.patient.age}y` : ''} • {new Date(f.createdAt).toLocaleString()}</div>
          <div className="mt-2 flex gap-2">
            <button onClick={() => onPreview(f)} className="btn btn-ghost small">Preview</button>
            <a className="btn btn-ghost small" href={f.url} target="_blank" rel="noreferrer">Open</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DoctorFiles() {
  const [files, setFiles] = useState([]);
  const [q, setQ] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/api/doctor/files');
      setFiles(res.data.files || []);
    } catch (e) {
      console.error('Failed to load files', e);
      alert('Failed to load files');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const list = files.filter(f => {
    if (!q) return true;
    const name = (f.patient?.name || '') + ' ' + (f.originalName || '');
    return name.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <Shell role="doctor">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Files</h2>
        <div className="flex items-center gap-2">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search patient or file..." className="input small" />
          <button onClick={load} className="btn btn-ghost small">{loading ? 'Loading…' : 'Refresh'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(f => <FileCard key={f._id} f={f} onPreview={(file)=> setPreview(file)} />)}
        {!list.length && <div className="small text-sub">No files yet.</div>}
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(2,6,23,0.6)'}}>
          <div className="max-w-4xl w-full mx-4 rounded-xl overflow-hidden" style={{background:'var(--panel)'}}>
            <div className="p-3 flex items-center justify-between border-b" style={{borderColor:'var(--line)'}}>
              <div className="font-medium">{preview.originalName} — {preview.patient?.name || 'Unknown'}</div>
              <div>
                <button className="btn btn-ghost small" onClick={()=> setPreview(null)}>Close</button>
                <a className="btn btn-ghost small" href={preview.url} target="_blank" rel="noreferrer" style={{marginLeft:8}}>Open in new tab</a>
              </div>
            </div>

            <div style={{height: '70vh', background:'#071025'}} className="flex items-center justify-center">
              {preview.mimeType && preview.mimeType.startsWith('image/') ? (
                <img src={preview.url} alt={preview.originalName} style={{maxHeight:'100%', maxWidth:'100%'}} />
              ) : (
                <iframe src={preview.url} title={preview.originalName} style={{width:'100%', height:'100%', border:0}} />
              )}
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

