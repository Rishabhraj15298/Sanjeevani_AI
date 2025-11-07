// import React, { useEffect, useState } from 'react';
// import Shell from '../../components/Shell';
// import Banner from '../../components/Banner';
// import api from '../../services/api';
// import { ensureSocket } from '../../lib/socket';
// import FileUpload from '../../components/FileUpload';
// import toast from 'react-hot-toast';

// export default function PatientChat() {
//   const [reading, setReading] = useState({ systolic:'', diastolic:'', pulse:'', symptoms: '' });
//   const [nudgeMsg, setNudgeMsg] = useState('');
//   const [files, setFiles] = useState([]);

//   useEffect(() => {
//     const s = ensureSocket();
//     s.on('nudge:keep-going', (payload) => setNudgeMsg(payload?.message || 'Keep going!'));
//     s.on('report:approved', (d) => {
//       toast.success('Doctor approved your report');
//     });
//     s.on('report:declined', (d) => {
//       toast.error('Doctor declined: ' + (d.reason || '—'));
//     });
//     return () => { s.off('nudge:keep-going'); s.off('report:approved'); s.off('report:declined'); };
//   }, []);

//   async function submitReading(e) {
//     e.preventDefault();
//     try {
//       const payload = {
//         systolic: Number(reading.systolic),
//         diastolic: Number(reading.diastolic),
//         pulse: reading.pulse ? Number(reading.pulse) : undefined,
//         symptoms: reading.symptoms ? reading.symptoms.split(',').map(s=>s.trim()) : []
//       };
//       const res = await api.post('/api/patient/reading', payload);
//       setReading({ systolic:'', diastolic:'', pulse:'', symptoms:'' });
//       toast.success('Reading saved. AI will process it and notify doctor.');
//     } catch (e) {
//       toast.error(e?.response?.data?.message || 'Save failed');
//     }
//   }

//   return (
//     <Shell role="patient">
//       <h2 className="text-lg font-semibold mb-3">BP Recording Assistant</h2>
//       <Banner message={nudgeMsg} onClose={() => setNudgeMsg('')} />

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//         <div className="card">
//           <form onSubmit={submitReading} className="space-y-3">
//             <div><label className="label">Upper BP reading</label><input className="input" value={reading.systolic} onChange={e=>setReading({...reading,systolic:e.target.value})} required /></div>
//             <div><label className="label">Lower BP reading</label><input className="input" value={reading.diastolic} onChange={e=>setReading({...reading,diastolic:e.target.value})} required /></div>
//             <div><label className="label">Pulse (optional)</label><input className="input" value={reading.pulse} onChange={e=>setReading({...reading,pulse:e.target.value})} /></div>
//             <div><label className="label">Symptoms (comma separated)</label><input className="input" value={reading.symptoms} onChange={e=>setReading({...reading,symptoms:e.target.value})} /></div>
//             <div className="flex justify-end"><button className="btn btn-ok" type="submit">Save Reading</button></div>
//           </form>
//         </div>

//         <div className="space-y-4">
//           <div className="card">
//             <div className="label mb-1">Uploaded Documents</div>
//             <FileUpload onUploaded={(newFiles)=> setFiles(prev => [...newFiles, ...prev])} />
//             <div className="mt-3 space-y-2">
//               {files.map(f=> (
//                 <a key={f._id} href={f.url} target="_blank" rel="noreferrer" className="block small">{f.originalName}</a>
//               ))}
//             </div>
//           </div>

//           <div className="card">
//             <div className="label">Helpful</div>
//             <div className="small">Take readings in the morning & evening, same arm, seated.</div>
//           </div>
//         </div>
//       </div>
//     </Shell>
//   );
// }


// src/pages/patient/Chatbot.jsx
// import React, { useEffect, useState, useRef } from 'react';
// import Shell from '../../components/Shell';
// import api from '../../services/api';
// import { ensureSocket } from '../../lib/socket';
// import toast from 'react-hot-toast';

// const SYMPTOMS = [
//   { key: 'swelling', label: 'Swelling (pair)' },
//   { key: 'headache', label: 'Headache' },
//   { key: 'blurred', label: 'Blurred vision' },
//   { key: 'dizziness', label: 'Dizziness' },
//   { key: 'chestPain', label: 'Chest pain' }
// ];

// function ChatBubble({ m }) {
//   const ts = new Date(m.createdAt || m.createdAt).toLocaleString();
//   if (m.type === 'report') {
//     const r = m.content || {};
//     return (
//       <div className="card">
//         <div className="text-sm text-sub">Doctor (approved)</div>
//         <div className="mt-2">
//           <div className="font-semibold">{r.finalSummary || 'Clinical advice'}</div>
//           <div className="small mt-1 text-sub">Meds: {(r.meds || []).join(', ') || 'None'}</div>
//           <div className="mt-2 small text-sub">{r.doctorNotes || ''}</div>
//         </div>
//         <div className="small text-sub mt-2">{ts}</div>
//       </div>
//     );
//   }

//   if (m.type === 'reading') {
//     const re = m.content || {};
//     return (
//       <div className="card">
//         <div className="small text-sub">You submitted reading</div>
//         <div className="mt-1 font-semibold">{re.systolic}/{re.diastolic} mmHg • Pulse: {re.pulse || '—'}</div>
//         <div className="small text-sub mt-1">Symptoms: {(re.symptoms||[]).join(', ') || '—'}</div>
//         <div className="small text-sub mt-2">{ts}</div>
//       </div>
//     );
//   }

//   return (
//     <div className={`card ${m.sender === 'doctor' ? '' : ''}`}>
//       <div className="small text-sub">{m.sender === 'user' ? 'You' : (m.sender || 'System')}</div>
//       <div className="mt-1">{m.content?.text || ''}</div>
//       <div className="small text-sub mt-2">{ts}</div>
//     </div>
//   );
// }

// export default function PatientChat() {
//   const [stage, setStage] = useState('idle'); // idle | systolic | diastolic | pulse | symptoms | confirm
//   const [form, setForm] = useState({ systolic:'', diastolic:'', pulse:'', symptoms: [] });
//   const [messages, setMessages] = useState([]);
//   const [nudge, setNudge] = useState('');
//   const [loading, setLoading] = useState(false);
//   const endRef = useRef(null);

//   useEffect(() => {
//     (async () => {
//       try {
//         const res = await api.get('/api/patient/chat');
//         setMessages(res.data.messages || []);
//       } catch (e) {
//         console.warn('fetch chat failed', e);
//       }
//     })();
//     const s = ensureSocket();
//     s.on('nudge:keep-going', (payload) => setNudge(payload?.message || 'Keep going!'));
//     s.on('chat:message', ({ message }) => {
//       // server sends the saved ChatMessage as { message: <doc> }
//       setMessages(prev => [...prev, message]);
//       toast('New message from doctor');
//     });
//     s.on('report:approved', (payload) => {
//       // report:approved also triggers chat:message above, but we keep this for compatibility
//       toast.success('Report approved by doctor');
//     });
//     s.on('report:declined', (payload) => {
//       toast.error('Report declined by doctor: ' + (payload?.reason || '—'));
//     });

//     return () => {
//       s.off('nudge:keep-going'); s.off('chat:message'); s.off('report:approved'); s.off('report:declined');
//     };
//   }, []);

//   useEffect(() => {
//     endRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   // Helpers to save chat messages to server
//   async function saveChatMessage(payload) {
//     try {
//       await api.post('/api/patient/chat', payload);
//     } catch (e) { console.warn('save chat failed', e); }
//   }

//   async function handleSubmitReading() {
//     // validate
//     if (!form.systolic || !form.diastolic) return alert('Enter systolic and diastolic');
//     setLoading(true);
//     try {
//       // 1) Save reading record via existing endpoint (also triggers AI pipeline)
//       const readingRes = await api.post('/api/patient/reading', {
//         systolic: Number(form.systolic),
//         diastolic: Number(form.diastolic),
//         pulse: form.pulse ? Number(form.pulse) : undefined,
//         symptoms: form.symptoms
//       });

//       // 2) Save a chat message of type reading (so it appears in chat history)
//       const chatPayload = {
//         sender: 'user',
//         type: 'reading',
//         content: {
//           systolic: Number(form.systolic),
//           diastolic: Number(form.diastolic),
//           pulse: form.pulse ? Number(form.pulse) : null,
//           symptoms: form.symptoms
//         }
//       };
//       await saveChatMessage(chatPayload);
//       // optimistically push message locally (server will also send chat:message if saved)
//       setMessages(prev => [...prev, { ...chatPayload, patient: null, createdAt: new Date().toISOString() }]);

//       toast.success('Reading saved — AI processing & doctor will review.');
//       setStage('idle');
//       setForm({ systolic:'', diastolic:'', pulse:'', symptoms: [] });
//     } catch (e) {
//       console.error('submit reading failed', e);
//       toast.error('Failed to submit reading');
//     } finally { setLoading(false); }
//   }

//   // Multi-step UI handlers
//   function startFlow() { setStage('systolic'); }
//   function onSystolic(val) { setForm(f=> ({...f, systolic: val})); setStage('diastolic'); }
//   function onDiastolic(val) { setForm(f=> ({...f, diastolic: val})); setStage('pulse'); }
//   function onPulse(val) { setForm(f=> ({...f, pulse: val})); setStage('symptoms'); }
//   function toggleSymptom(k) {
//     setForm(f => {
//       const s = new Set(f.symptoms || []);
//       if (s.has(k)) s.delete(k); else s.add(k);
//       return {...f, symptoms: Array.from(s)};
//     });
//   }

//   return (
//     <Shell role="patient">
//       <h2 className="text-lg font-semibold mb-3">Chat Assistant</h2>
//       {nudge && <div className="card mb-3" style={{borderLeft:'4px solid var(--brand)'}}>{nudge}</div>}

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//         <div className="lg:col-span-2 space-y-3">
//           <div className="card">
//             <div className="small text-sub">Instructions: follow prompts to add a reading. Doctor-approved responses will appear here.</div>
//           </div>

//           <div className="space-y-3">
//             {/* chat messages */}
//             {messages.map((m, idx) => <ChatBubble key={idx} m={m} />)}
//             <div ref={endRef} />
//           </div>
//         </div>

//         <div className="space-y-3">
//           <div className="card">
//             <div className="label mb-2">Quick Chat Flow</div>

//             {stage === 'idle' && (
//               <div>
//                 <div className="small mb-2">Start by adding a BP reading or use "Quick Suggest".</div>
//                 <div className="flex gap-2">
//                   <button onClick={startFlow} className="btn btn-ok">Add Reading</button>
//                   <button onClick={() => {
//                     // random demo values
//                     setForm({ systolic: 134, diastolic: 82, pulse: 74, symptoms: [] });
//                     setStage('confirm');
//                   }} className="btn btn-ghost">Quick Suggest</button>
//                 </div>
//               </div>
//             )}

//             {stage === 'systolic' && (
//               <div>
//                 <div className="label">Enter systolic (top)</div>
//                 <input className="input" type="number" value={form.systolic} onChange={e=>setForm({...form, systolic:e.target.value})} />
//                 <div className="flex gap-2 mt-3">
//                   <button onClick={() => onSystolic(form.systolic)} className="btn btn-ok">Next</button>
//                   <button onClick={() => setStage('idle')} className="btn btn-ghost">Cancel</button>
//                 </div>
//               </div>
//             )}

//             {stage === 'diastolic' && (
//               <div>
//                 <div className="label">Enter diastolic (bottom)</div>
//                 <input className="input" type="number" value={form.diastolic} onChange={e=>setForm({...form, diastolic:e.target.value})} />
//                 <div className="flex gap-2 mt-3">
//                   <button onClick={() => onDiastolic(form.diastolic)} className="btn btn-ok">Next</button>
//                   <button onClick={() => setStage('systolic')} className="btn btn-ghost">Back</button>
//                 </div>
//               </div>
//             )}

//             {stage === 'pulse' && (
//               <div>
//                 <div className="label">Pulse (optional)</div>
//                 <input className="input" type="number" value={form.pulse} onChange={e=>setForm({...form, pulse:e.target.value})} />
//                 <div className="flex gap-2 mt-3">
//                   <button onClick={() => onPulse(form.pulse)} className="btn btn-ok">Next</button>
//                   <button onClick={() => setStage('diastolic')} className="btn btn-ghost">Back</button>
//                 </div>
//               </div>
//             )}

//             {stage === 'symptoms' && (
//               <div>
//                 <div className="label mb-2">Any symptoms? (tap)</div>
//                 <div className="flex flex-wrap gap-2">
//                   {SYMPTOMS.map(s => (
//                     <button key={s.key} type="button" onClick={() => toggleSymptom(s.key)}
//                       className={`px-2 py-1 rounded-full text-xs ${form.symptoms.includes(s.key) ? 'bg-brand/20 text-text' : 'bg-panel text-sub border border-line'}`}>{s.label}</button>
//                   ))}
//                 </div>
//                 <div className="flex gap-2 mt-3">
//                   <button onClick={() => setStage('confirm')} className="btn btn-ok">Confirm</button>
//                   <button onClick={() => setStage('pulse')} className="btn btn-ghost">Back</button>
//                 </div>
//               </div>
//             )}

//             {stage === 'confirm' && (
//               <div>
//                 <div className="label">Confirm reading</div>
//                 <div className="mt-2 font-semibold">{form.systolic}/{form.diastolic} mmHg</div>
//                 <div className="small text-sub">Pulse: {form.pulse || '—'} • Symptoms: {(form.symptoms||[]).join(', ') || '—'}</div>
//                 <div className="flex gap-2 mt-3">
//                   <button onClick={handleSubmitReading} disabled={loading} className="btn btn-ok">{loading ? 'Saving…' : 'Save & Send'}</button>
//                   <button onClick={() => setStage('symptoms')} className="btn btn-ghost">Back</button>
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="card">
//             <div className="label mb-2">Tips</div>
//             <div className="small">Take 5 readings across different times to improve AI accuracy. Doctor will review and respond.</div>
//           </div>
//         </div>
//       </div>
//     </Shell>
//   );
// }

// src/pages/patient/Chatbot.jsx
import React, { useEffect, useRef, useState } from 'react';
import Shell from '../../components/Shell';
import api from '../../services/api';
import { ensureSocket } from '../../lib/socket';
import toast from 'react-hot-toast';
import AIPlan from '../../components/AIPlan';
import ImageUploader from '../../components/ImageUploader';

// symptom options
const SYMPTOM_OPTIONS = [
  { key: 'headache', label: 'Headache' },
  { key: 'swelling', label: 'Swelling (legs/feet)' },
  { key: 'blurred', label: 'Blurred vision' },
  { key: 'dizziness', label: 'Dizziness' },
  { key: 'chestPain', label: 'Chest pain' }
];

const nowISO = () => new Date().toISOString();

function newConversationId() {
  // simple conv id; you may swap for uuid lib
  return 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8);
}

// normalize arrays safely
const toArray = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'object') {
    const vals = v.items || v.list || v.value || Object.values(v);
    if (Array.isArray(vals)) return vals;
    return [JSON.stringify(v)];
  }
  return [String(v)];
}

/* Chat bubble - left for system/doctor, right for patient */
function ChatBubble({ m }) {
  const ts = new Date(m.createdAt || Date.now()).toLocaleString();

  const isUser = m.sender === 'user';

  // Simple layout switch: left (assistant/doctor) vs right (user)
  const alignClass = isUser ? 'justify-end' : 'justify-start';
  const bubbleBg = isUser ? 'bg-[#071327] text-white border border-[#2b3a47]' : 'bg-[#0b1723] text-white border border-[#253042]';

  // Approved report rendering
  if (m.type === 'report' || m.content?.type === 'approved_report') {
    const raw = m.content?.aiContent || m.content || {};
    const finalSummary = m.content?.finalSummary || raw.prediction || raw.summary || 'Clinical summary';
    const meds = toArray(m.content?.meds || raw.suggested_medicines);
    const lifestyle = toArray(raw.lifestyle_tips || raw.lifestyle);
    const precautions = toArray(raw.precautions || raw.when_to_seek_care);
    const causes = toArray(raw.possible_conditions || raw.causes);
    const numerics = raw.numerics || null;
    const trend = raw.trend_explanation || '';

    return (
      <div className={`w-full flex ${alignClass} px-2 my-2`}>
        <div className={`max-w-[86%] p-4 rounded-lg ${bubbleBg} shadow-sm`}>
          <div className="text-xs text-slate-300">Doctor (approved)</div>
          <div className="mt-2 font-semibold text-white">{finalSummary}</div>
          {!!trend && <div className="small text-slate-300 mt-2">{trend}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div className="p-3 rounded-md border border-slate-700">
              <div className="font-medium text-sm">Suggested Medicines</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {meds.length ? meds.map((m,i) => <span key={i} className="px-2 py-1 rounded-full bg-slate-800 text-xs">{m}</span>) : <div className="text-xs text-slate-400">None</div>}
              </div>
            </div>

            <div className="p-3 rounded-md border border-slate-700">
              <div className="font-medium text-sm">Key Numbers</div>
              <div className="text-xs text-slate-400 mt-2">
                {numerics ? [
                  numerics.avg_systolic && `Avg Sys: ${numerics.avg_systolic}`,
                  numerics.avg_diastolic && `Avg Dia: ${numerics.avg_diastolic}`,
                  numerics.min_systolic && `Min Sys: ${numerics.min_systolic}`,
                ].filter(Boolean).join(' • ') : '—'}
              </div>
            </div>

            <div className="p-3 rounded-md border border-slate-700 md:col-span-2">
              <div className="font-medium text-sm">Lifestyle / Tips</div>
              {lifestyle.length ? <ul className="list-disc pl-6 text-sm mt-2">{lifestyle.map((l,i)=>(<li key={i}>{l}</li>))}</ul> : <div className="text-xs text-slate-400 mt-2">—</div>}
            </div>

            <div className="p-3 rounded-md border border-slate-700 md:col-span-2">
              <div className="font-medium text-sm">Precautions / When to seek care</div>
              {precautions.length ? <ul className="list-disc pl-6 text-sm mt-2">{precautions.map((p,i)=>(<li key={i}>{p}</li>))}</ul> : <div className="text-xs text-slate-400 mt-2">—</div>}
            </div>

            <div className="p-3 rounded-md border border-slate-700 md:col-span-2">
              <div className="font-medium text-sm">Possible Conditions</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {causes.length ? causes.map((c,i)=>(<span key={i} className="px-2 py-1 rounded bg-slate-800 text-xs">{c}</span>)) : <div className="text-xs text-slate-400">—</div>}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 mt-3">{ts}</div>
        </div>
      </div>
    );
  }

  // User reading bubble
  if (m.type === 'reading') {
    const r = m.content || {};
    return (
      <div className={`w-full flex ${alignClass} px-2 my-2`}>
        <div className={`max-w-[70%] p-4 rounded-lg ${isUser ? 'bg-[#02203b] border border-[#1f344b]' : 'bg-[#0b2a3d] border border-[#1f2d3c]'}`}>
          <div className="text-xs text-slate-300">You</div>
          <div className="mt-1 font-semibold">{r.systolic}/{r.diastolic} mmHg</div>
          <div className="text-xs text-slate-300 mt-1">Pulse: {r.pulse ?? '—'}</div>
          <div className="text-sm text-slate-300 mt-2">Symptoms: {(Array.isArray(r.symptoms)?r.symptoms:[]).join(', ') || 'None'}</div>
          <div className="text-xs text-slate-400 mt-2">{ts}</div>
        </div>
      </div>
    );
  }

  // generic text or assistant
  return (
    <div className={`w-full flex ${alignClass} px-2 my-2`}>
      <div className={`max-w-[80%] p-3 rounded-lg ${isUser ? 'bg-[#02203b] border border-[#1f344b]' : 'bg-[#0b2a3d] border border-[#1f2d3c]'}`}>
        <div className="text-xs text-slate-300">{isUser ? 'You' : 'Assistant'}</div>
        <div className="mt-1 text-sm">{m.content?.text || ''}</div>
        <div className="text-xs text-slate-400 mt-2">{ts}</div>
      </div>
    </div>
  );
}

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSymptomsPanel, setShowSymptomsPanel] = useState(false);
  const [symptomsState, setSymptomsState] = useState([]);
  const stepRef = useRef('systolic'); // 'systolic'|'diastolic'|'pulse'|'symptoms'|'confirm'
  const formRef = useRef({ systolic:'', diastolic:'', pulse:'', symptoms: [] });
  const endRef = useRef(null);

  // scroll helper
  const scrollDown = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });

  // helper to push message to UI and optionally persist to backend
  async function pushMessage(msg, persist=false) {
    setMessages(prev => [...prev, msg]);
    if (persist) {
      try {
        await api.post('/api/patient/chat', { ...msg, conversationId });
      } catch (e) { console.warn('persist chat failed', e); }
    }
    setTimeout(scrollDown, 30);
  }

  // init conversation id + load session messages
  useEffect(() => {
    let conv = localStorage.getItem('chat_conversation_id');
    if (!conv) {
      conv = newConversationId();
      localStorage.setItem('chat_conversation_id', conv);
    }
    setConversationId(conv);

    (async () => {
      try {
        const res = await api.get('/api/patient/chat', { params: { conversationId: conv }});
        const msgs = res.data.messages || [];
        setMessages(msgs);
        if (!msgs.length) {
          // push initial assistant prompt (persist)
          const starter = { sender:'system', type:'text', content:{ text: "Hello! Let's record your BP. What's your systolic (top) value?" }, createdAt: nowISO(), conversationId: conv };
          setMessages([starter]);
          try { await api.post('/api/patient/chat', starter); } catch (e) {}
        } else {
          // determine next step (simple heuristic)
          stepRef.current = 'systolic';
        }
      } catch (e) {
        console.error('load chat failed', e);
      }
    })();

    // sockets
    const s = ensureSocket();
    s.on('chat:message', ({ message }) => {
      const current = localStorage.getItem('chat_conversation_id');
      if (!message.conversationId || message.conversationId === current) {
        setMessages(prev => [...prev, message]);
        scrollDown();
      } else {
        console.log('ignoring message for old conversation', message.conversationId);
      }
    });
    s.on('nudge:keep-going', (p) => {
      toast(p?.message || 'Keep going!');
    });

    return () => {
      s.off('chat:message');
      s.off('nudge:keep-going');
    };
    // eslint-disable-next-line
  }, []);

  // clear (start new session)
  const clearChat = async () => {
    const newId = newConversationId();
    localStorage.setItem('chat_conversation_id', newId);
    setConversationId(newId);
    setMessages([]);
    formRef.current = { systolic:'', diastolic:'', pulse:'', symptoms: [] };
    stepRef.current = 'systolic';
    setShowSymptomsPanel(false);
    setSymptomsState([]);
    // persist starter
    const starter = { sender:'system', type:'text', content:{ text: "Okay — new session. What's your systolic pressure?" }, createdAt: nowISO(), conversationId: newId };
    setMessages([starter]);
    try { await api.post('/api/patient/chat', starter); } catch (e) {}
  };

  // submit the reading to backend (reads formRef)
  const submitReading = async () => {
    const f = formRef.current;
    if (!f.systolic || !f.diastolic) {
      toast.error('Systolic and diastolic required');
      return;
    }
    setLoading(true);
    try {
      // 1) create reading (AI pipeline uses conversationId)
      await api.post('/api/patient/reading', {
        systolic: Number(f.systolic),
        diastolic: Number(f.diastolic),
        pulse: f.pulse ? Number(f.pulse) : undefined,
        symptoms: f.symptoms || [],
        conversationId
      });

      // 2) create chat reading message (persist)
      const msg = {
        patient: null,
        sender: 'user',
        type: 'reading',
        content: { systolic: Number(f.systolic), diastolic: Number(f.diastolic), pulse: f.pulse || null, symptoms: f.symptoms || [] },
        createdAt: nowISO(),
        conversationId
      };
      await api.post('/api/patient/chat', msg);

      // local UI append
      setMessages(prev => [...prev, msg]);
      toast.success('Reading saved. Doctor will review and approve.');
      // reset flow for new reading but keep session
      formRef.current = { systolic:'', diastolic:'', pulse:'', symptoms: [] };
      setSymptomsState([]);
      stepRef.current = 'systolic';
      setShowSymptomsPanel(false);
      setInput('');
      scrollDown();
    } catch (e) {
      console.error(e);
      toast.error('Failed to submit reading');
    } finally {
      setLoading(false);
    }
  };

  // handle input send - handles numeric steps and simple commands
  const handleSend = async () => {
    const text = (input || '').trim();
    if (!text) return;
    setInput('');

    // allow commands
    if (text === '/clear') {
      await clearChat();
      return;
    }
    if (text === '/quick') {
      const sys = 110 + Math.floor(Math.random()*50);
      const dia = 70 + Math.floor(Math.random()*30);
      const pulse = 60 + Math.floor(Math.random()*30);
      formRef.current.systolic = sys;
      formRef.current.diastolic = dia;
      formRef.current.pulse = pulse;
      setMessages(prev => [...prev, { sender:'system', type:'text', content:{ text:`Preview: ${sys}/${dia} mmHg, pulse ${pulse}. Now choose symptoms below.` }, createdAt: nowISO() }]);
      setShowSymptomsPanel(true);
      setSymptomsState([]);
      return;
    }

    const step = stepRef.current;

    // Systolic step
    if (step === 'systolic') {
      const v = parseInt(text,10);
      if (Number.isNaN(v) || v < 60 || v > 260) {
        await pushMessage({ sender:'system', type:'text', content:{ text:'Enter a valid systolic value (e.g., 120).' }, createdAt: nowISO() }, true);
        return;
      }
      formRef.current.systolic = v;
      stepRef.current = 'diastolic';
      await pushMessage({ sender:'system', type:'text', content:{ text:'Got it. Now enter diastolic (bottom number).' }, createdAt: nowISO() }, true);
      return;
    }

    // Diastolic step
    if (step === 'diastolic') {
      const v = parseInt(text,10);
      if (Number.isNaN(v) || v < 30 || v > 200) {
        await pushMessage({ sender:'system', type:'text', content:{ text:'Enter a valid diastolic value (e.g., 80).' }, createdAt: nowISO() }, true);
        return;
      }
      formRef.current.diastolic = v;
      stepRef.current = 'pulse';
      await pushMessage({ sender:'system', type:'text', content:{ text:'Pulse (beats per minute). Type number or "skip".' }, createdAt: nowISO() }, true);
      return;
    }

    // Pulse step
    if (step === 'pulse') {
      if (!/^skip$/i.test(text)) {
        const v = parseInt(text,10);
        if (Number.isNaN(v) || v < 20 || v > 240) {
          await pushMessage({ sender:'system', type:'text', content:{ text:'Enter a valid pulse or type skip.' }, createdAt: nowISO() }, true);
          return;
        }
        formRef.current.pulse = v;
      } else {
        formRef.current.pulse = null;
      }
      // Now move to symptoms checkbox UI
      stepRef.current = 'symptoms';
      setShowSymptomsPanel(true);
      await pushMessage({ sender:'system', type:'text', content:{ text:'Select relevant symptoms (tap below) and press Submit.' }, createdAt: nowISO() }, true);
      return;
    }

    // Fallback: treat other inputs as free-text chat messages (persist)
    const userMsg = { sender:'user', type:'text', content:{ text }, createdAt: nowISO(), conversationId };
    setMessages(prev => [...prev, userMsg]);
    try { await api.post('/api/patient/chat', userMsg); } catch (e) { console.warn(e); }
  };

  // toggle symptom in panel
  const toggleSymptom = (k) => {
    setSymptomsState(prev => {
      if (prev.includes(k)) return prev.filter(x => x !== k);
      return [...prev, k];
    });
  };

  // submit from symptoms panel -> finalize reading
  const onSubmitSymptoms = async () => {
    formRef.current.symptoms = symptomsState;
    await submitReading();
  };

  // UI
  return (
    <Shell role="patient">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">BP Recording Assistant</h2>
          <div className="text-sm text-slate-400">I'll guide you through recording your blood pressure and symptoms</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost small" onClick={clearChat}>Clear</button>
        </div>
      </div>

      {/* chat area */}
      <div className="rounded-lg border border-slate-700 p-4 mb-3" style={{minHeight: '58vh'}}>
        <div className="space-y-2">
          {messages.map((m, i) => <ChatBubble key={i} m={m} />)}
          <div ref={endRef} />
        </div>
      </div>

      {/* symptoms panel (checkboxes) */}
      {showSymptomsPanel && (
        <div className="rounded-md border border-slate-700 p-3 mb-3">
          <div className="font-medium mb-2">Select symptoms</div>
          <div className="flex flex-wrap gap-2">
            {SYMPTOM_OPTIONS.map(opt => (
              <button key={opt.key}
                className={`px-3 py-1 rounded-full text-sm ${symptomsState.includes(opt.key) ? 'bg-green-700 text-white' : 'bg-slate-800 text-slate-200'}`}
                onClick={() => toggleSymptom(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button className="btn btn-ok" onClick={onSubmitSymptoms} disabled={loading}>{loading ? 'Saving…' : 'Submit'}</button>
            <button className="btn btn-ghost" onClick={() => { setShowSymptomsPanel(false); setSymptomsState([]); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* input area */}
      <div className="flex gap-2 items-center">
        <input
          className="input flex-1"
          placeholder="Type your response... (commands: /clear, /quick)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
        />
        <button className="btn btn-ok" onClick={handleSend} disabled={loading}>{loading ? '...' : 'Send'}</button>
      </div>
      <ImageUploader onDetected={(res) => {
  if (res?.error) {
    pushMessage({ sender: 'system', type:'text', content:{ text: 'Image OCR failed. Enter values manually.' }, createdAt: nowISO() }, true);
    return;
  }
  const parsed = res.parsed;
  pushMessage({ sender:'system', type:'text', content:{ text: `Detected: ${parsed.systolic || '—'}/${parsed.diastolic || '—'} mmHg, pulse ${parsed.pulse || '—'}. Confirm to submit.` }, createdAt: nowISO() }, true);
  // prefill your formRef
  formRef.current.systolic = parsed.systolic || '';
  formRef.current.diastolic = parsed.diastolic || '';
  formRef.current.pulse = parsed.pulse || null;
  setShowSymptomsPanel(true);
}}/>

    </Shell>
  );
}
