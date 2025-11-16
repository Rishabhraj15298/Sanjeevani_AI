
const { GoogleGenAI } = require('@google/genai');

function rulesFallback(readings, lastThree = []) {
  if (!readings || !readings.length) {
    return {
      summary: 'No readings available.',
      prediction: 'insufficient data',
      trend_explanation: '',
      possible_conditions: [],
      suggested_medicines: [],
      medicine_rationale: [],
      dosage_notes: [],
      lifestyle_tips: ['Record BP daily at the same time'],
      precautions: [],
      urgency_level: 'routine',
      when_to_seek_care: [],
      numerics: {},
      last_three_readings: lastThree
    };
  }

  const avgSys = Math.round(readings.reduce((s, r) => s + (r.systolic || 0), 0) / readings.length);
  const avgDia = Math.round(readings.reduce((s, r) => s + (r.diastolic || 0), 0) / readings.length);
  const stage = (avgSys >= 140 || avgDia >= 90) ? 'Stage 2 Hypertension' : (avgSys >= 130 || avgDia >= 80) ? 'Stage 1 Hypertension' : 'Normal';
  const meds = stage.includes('Stage') ? ['Losartan 50mg', 'Amlodipine 5mg'] : [];

  return {
    summary: `Avg BP ${avgSys}/${avgDia}.`,
    prediction: stage === 'Normal' ? 'Low probability of hypertension' : `Likely ${stage}`,
    trend_explanation: '',
    possible_conditions: [stage],
    suggested_medicines: meds,
    medicine_rationale: meds.map(m => `${m} may reduce BP`),
    dosage_notes: meds.length ? ['Use under physician supervision'] : [],
    lifestyle_tips: ['Reduce salt intake', '30-min walk daily'],
    precautions: [],
    urgency_level: stage === 'Stage 2 Hypertension' ? 'urgent' : 'routine',
    when_to_seek_care: stage === 'Stage 2 Hypertension' ? ['Seek urgent care for BP >= 180/120 or severe symptoms'] : [],
    numerics: {
      avg_systolic: avgSys,
      avg_diastolic: avgDia,
      min_systolic: Math.min(...readings.map(r => r.systolic || 999)),
      max_systolic: Math.max(...readings.map(r => r.systolic || 0)),
      min_diastolic: Math.min(...readings.map(r => r.diastolic || 999)),
      max_diastolic: Math.max(...readings.map(r => r.diastolic || 0)),
    },
    last_three_readings: lastThree
  };
}

async function generateWithGeminiRaw(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in env');
  const ai = new GoogleGenAI({ apiKey });

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const resp = await ai.models.generateContent({
    model,
    contents: prompt
  });

  // SDK shapes differ; try common accessors
  if (resp?.text) return resp.text;
  if (typeof resp === 'string') return resp;
  if (Array.isArray(resp?.output) && resp.output[0]?.content && resp.output[0].content[0]?.text) {
    return resp.output[0].content[0].text;
  }
  // last resort: JSON stringify
  return JSON.stringify(resp);
}

async function generateAIReportFromReadings({ readings = [], extraNotes = '', patientInfo = {}, lastThree = [], conversationId = null }) {
  // build strict JSON prompt
  const prompt = `
You are a cautious clinical assistant. Analyze provided blood pressure readings and patient context and RETURN STRICT JSON only (no explanation).
Output object with EXACT keys:
{
 "summary": string,
 "prediction": string,
 "trend_explanation": string,
 "possible_conditions": [string],
 "suggested_medicines": [string],
 "medicine_rationale": [string],
 "dosage_notes": [string],
 "lifestyle_tips": [string],
 "precautions": [string],
 "urgency_level": string,
 "when_to_seek_care": [string],
 "numerics": { "avg_systolic": number, "avg_diastolic": number, "min_systolic": number, "max_systolic": number, "min_diastolic": number, "max_diastolic": number },
 "last_three_readings": [ { "systolic": number, "diastolic": number, "pulse": number|null, "measuredAt": string } ]
}

Rules:
- Use only provided readings and patientInfo.
- If patientInfo.allergies or pmh contradicts a medicine, do NOT suggest that medicine; prefer safe classes.
- For suggested_medicines include common generic names and an indicative dose only if clearly appropriate (otherwise return an empty array).
- If unsure, return empty arrays for medicines and put "refer to clinician" in dosage_notes.
- Return only JSON; do not include any commentary outside JSON.

PatientInfo: ${JSON.stringify(patientInfo)}
RecentReadings: ${JSON.stringify(readings)}
LastThree: ${JSON.stringify(lastThree)}
ExtraNotes: ${JSON.stringify(extraNotes)}
ConversationId: ${conversationId || 'none'}
`;

  try {
    const raw = await generateWithGeminiRaw(prompt);
    // extract first {...} in response
    const match = String(raw).match(/\{[\s\S]*\}/);
    if (!match) throw new Error('no JSON in response');

    let content = JSON.parse(match[0]);

    // normalize fields
    content.suggested_medicines = Array.isArray(content.suggested_medicines) ? content.suggested_medicines : [];
    content.lifestyle_tips = Array.isArray(content.lifestyle_tips) ? content.lifestyle_tips : [];
    content.precautions = Array.isArray(content.precautions) ? content.precautions : (content.when_to_seek_care || []);
    content.possible_conditions = Array.isArray(content.possible_conditions) ? content.possible_conditions : [];
    content.last_three_readings = Array.isArray(content.last_three_readings) ? content.last_three_readings : lastThree;
    content.numerics = content.numerics || {};
    return { generatedBy: 'gemini', content, inputContext: { windowDays: 14, conversationId, extraNotes } };
  } catch (e) {
    // fallback to rule-based
    const fb = rulesFallback(readings, lastThree);
    return { generatedBy: 'rules', content: fb, inputContext: { windowDays: 14, conversationId, extraNotes } };
  }
}

module.exports = { generateAIReportFromReadings };
