import React, { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import Banner from '../../components/Banner';
import api from '../../services/api';
import { ensureSocket } from '../../lib/socket';
import FileUpload from '../../components/FileUpload';
import toast from 'react-hot-toast';

export default function PatientChat() {
  const [reading, setReading] = useState({ systolic:'', diastolic:'', pulse:'', symptoms: '' });
  const [nudgeMsg, setNudgeMsg] = useState('');
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const s = ensureSocket();
    s.on('nudge:keep-going', (payload) => setNudgeMsg(payload?.message || 'Keep going!'));
    s.on('report:approved', (d) => {
      toast.success('Doctor approved your report');
    });
    s.on('report:declined', (d) => {
      toast.error('Doctor declined: ' + (d.reason || '—'));
    });
    return () => { s.off('nudge:keep-going'); s.off('report:approved'); s.off('report:declined'); };
  }, []);

  async function submitReading(e) {
    e.preventDefault();
    try {
      const payload = {
        systolic: Number(reading.systolic),
        diastolic: Number(reading.diastolic),
        pulse: reading.pulse ? Number(reading.pulse) : undefined,
        symptoms: reading.symptoms ? reading.symptoms.split(',').map(s=>s.trim()) : []
      };
      const res = await api.post('/api/patient/reading', payload);
      setReading({ systolic:'', diastolic:'', pulse:'', symptoms:'' });
      toast.success('Reading saved. AI will process it and notify doctor.');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Save failed');
    }
  }

  return (
    <Shell role="patient">
      <h2 className="text-lg font-semibold mb-3">BP Recording Assistant</h2>
      <Banner message={nudgeMsg} onClose={() => setNudgeMsg('')} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <form onSubmit={submitReading} className="space-y-3">
            <div><label className="label">Systolic</label><input className="input" value={reading.systolic} onChange={e=>setReading({...reading,systolic:e.target.value})} required /></div>
            <div><label className="label">Diastolic</label><input className="input" value={reading.diastolic} onChange={e=>setReading({...reading,diastolic:e.target.value})} required /></div>
            <div><label className="label">Pulse (optional)</label><input className="input" value={reading.pulse} onChange={e=>setReading({...reading,pulse:e.target.value})} /></div>
            <div><label className="label">Symptoms (comma separated)</label><input className="input" value={reading.symptoms} onChange={e=>setReading({...reading,symptoms:e.target.value})} /></div>
            <div className="flex justify-end"><button className="btn btn-ok" type="submit">Save Reading</button></div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="label mb-1">Uploaded Documents</div>
            <FileUpload onUploaded={(newFiles)=> setFiles(prev => [...newFiles, ...prev])} />
            <div className="mt-3 space-y-2">
              {files.map(f=> (
                <a key={f._id} href={f.url} target="_blank" rel="noreferrer" className="block small">{f.originalName}</a>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="label">Helpful</div>
            <div className="small">Take readings in the morning & evening, same arm, seated.</div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
