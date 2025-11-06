// // src/services/gemini.js
// const { GoogleGenAI } = require('@google/genai');

// /**
//  * Wrapper for Gemini using @google/genai and the GoogleGenAI client.
//  * Expects process.env.GEMINI_API_KEY to be set.
//  *
//  * The SDK returns a response object; we use .text or .output[0].content[0].text depending on SDK shape.
//  * This function returns parsed JSON (or uses rules fallback).
//  */

// async function generateWithGeminiRaw(prompt) {
//   const apiKey = process.env.GEMINI_API_KEY;
//   if (!apiKey) throw new Error('GEMINI_API_KEY not set');
//   const ai = new GoogleGenAI({ apiKey });

//   // According to the snippet user provided:
//   // const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "..." });
//   // response.text
//   const resp = await ai.models.generateContent({
//     model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
//     contents: prompt
//   });

//   // The SDK sometimes provides `.text` or `.output[0].content[0].text` depending on version.
//   if (resp?.text) return resp.text;
//   // try nested shape
//   if (resp?.output && resp.output[0] && resp.output[0].content && resp.output[0].content[0]) {
//     return resp.output[0].content[0].text || JSON.stringify(resp);
//   }
//   return JSON.stringify(resp);
// }

// // rules fallback (guarantee)
// function rulesFallback(readings) {
//   if (!readings?.length) {
//     return {
//       summary: 'No readings available.',
//       possible_conditions: [],
//       suggested_medicines: [],
//       lifestyle_tips: ['Record BP daily at same time']
//     };
//   }
//   const avgSys = Math.round(readings.reduce((a, r) => a + r.systolic, 0) / readings.length);
//   const avgDia = Math.round(readings.reduce((a, r) => a + r.diastolic, 0) / readings.length);
//   const stage =
//     avgSys >= 140 || avgDia >= 90
//       ? 'Stage 2 Hypertension'
//       : avgSys >= 130 || avgDia >= 80
//       ? 'Stage 1 Hypertension'
//       : 'Normal';
//   const meds = stage.includes('Hypertension') ? ['Losartan 50mg', 'Amlodipine 5mg'] : [];
//   const last = readings[readings.length - 1];
//   return {
//     summary: `Avg BP ${avgSys}/${avgDia}. Last reading ${last.systolic}/${last.diastolic}.`,
//     possible_conditions: [stage],
//     suggested_medicines: meds,
//     lifestyle_tips: ['Reduce salt intake', '30-min brisk walk', 'Hydrate well']
//   };
// }

// async function generateAIReportFromReadings({ readings, extraNotes }) {
//   const recent = readings.slice(-7);
//   const prompt = `You are a cautious medical assistant. Analyze these BP readings and produce STRICT JSON with keys: summary, possible_conditions (array), suggested_medicines (array), lifestyle_tips (array). Be concise and safe.\n\nReadings: ${JSON.stringify(
//     recent
//   )}\nNotes: ${extraNotes || ''}\nReturn ONLY JSON object.`;

//   try {
//     const raw = await generateWithGeminiRaw(prompt);
//     // extract JSON object from raw text
//     const match = String(raw).match(/\{[\s\S]*\}/);
//     if (!match) throw new Error('Gemini did not return parseable JSON');
//     const content = JSON.parse(match[0]);
//     return { generatedBy: 'gemini', content, inputContext: { recentWindowDays: 7, extraNotes } };
//   } catch (e) {
//     // fallback to simple rule
//     const fb = rulesFallback(recent);
//     return { generatedBy: 'rules', content: fb, inputContext: { recentWindowDays: 7, extraNotes } };
//   }
// }

// module.exports = { generateAIReportFromReadings };

// src/services/gemini.js
// const { GoogleGenAI } = require('@google/genai');

// // rules fallback to guarantee structure
// function rulesFallback(readings, lastThree) {
//   if (!readings?.length) {
//     return {
//       prediction: 'Insufficient data',
//       suggested_medicines: [],
//       dosage_notes: ['Record BP daily at the same time.'],
//       lifestyle_tips: ['Reduce sodium', '30-min brisk walk', 'Stay hydrated'],
//       last_three_readings: lastThree
//     };
//   }
//   const avgSys = Math.round(readings.reduce((a, r) => a + r.systolic, 0) / readings.length);
//   const avgDia = Math.round(readings.reduce((a, r) => a + r.diastolic, 0) / readings.length);
//   const stage =
//     avgSys >= 140 || avgDia >= 90
//       ? 'Likely Stage 2 Hypertension'
//       : avgSys >= 130 || avgDia >= 80
//       ? 'Likely Stage 1 Hypertension'
//       : 'Likely Normal BP trend';
//   const meds = stage.includes('Hypertension') ? ['Losartan 50mg', 'Amlodipine 5mg'] : [];
//   const dosage = meds.length ? ['Losartan 50mg once daily', 'Amlodipine 5mg once daily'] : ['No medication indicated'];
//   return {
//     prediction: stage,
//     suggested_medicines: meds,
//     dosage_notes: dosage,
//     lifestyle_tips: ['Reduce salt intake', '30-min brisk walk', 'Hydrate well'],
//     last_three_readings: lastThree
//   };
// }

// async function generateWithGeminiRaw(contents) {
//   const apiKey = process.env.GEMINI_API_KEY;
//   if (!apiKey) throw new Error('GEMINI_API_KEY not set');
//   const ai = new GoogleGenAI({ apiKey });

//   const resp = await ai.models.generateContent({
//     model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
//     contents
//   });

//   // prefer .text if available, else fallback
//   if (resp?.text) return resp.text;
//   if (resp?.output && resp.output[0]?.content?.[0]?.text) {
//     return resp.output[0].content[0].text;
//   }
//   return JSON.stringify(resp);
// }

// /**
//  * readings: array of last N readings
//  * extraNotes: optional clinician/patient notes
//  * patientInfo: { name, age, gender, weight, pmh, allergies }  // NEW (we’ll send for better personalization)
//  * lastThree: compact 3 readings for echo
//  */
// async function generateAIReportFromReadings({ readings, extraNotes, patientInfo, lastThree }) {
//   const recent = readings.slice(-7);

//   // Build a single string prompt (the SDK param is "contents", we pass a string)
//   const prompt = `
// You are a careful medical assistant. 
// Analyze the patient's BP readings and return STRICT JSON ONLY with these keys:
// - prediction: a concise, single-line risk/condition call (e.g., "Likely Stage 1 Hypertension").
// - suggested_medicines: array of generic drug names best aligned to the readings (e.g., "Losartan 50mg", "Amlodipine 5mg").
// - dosage_notes: array of short regimen hints (e.g., "Losartan 50mg once daily").
// - lifestyle_tips: array of short, safe lifestyle suggestions.
// - last_three_readings: echo the last 3 readings you considered as a compact array of objects [{systolic, diastolic, pulse, measuredAt}].

// STRICT RULES:
// - Output JSON only, no markdown, no prose outside JSON.
// - Keep it concise and clinically cautious.
// - Prefer generic drug names.

// PATIENT INFO:
// ${JSON.stringify(patientInfo || {})}

// READINGS (most recent 7 entries, oldest->newest):
// ${JSON.stringify(recent)}

// NOTES:
// ${extraNotes || ''}

// LAST THREE (already computed, echo these back under "last_three_readings"):
// ${JSON.stringify(lastThree)}
// `;

//   try {
//     const raw = await generateWithGeminiRaw(prompt);
//     const match = String(raw).match(/\{[\s\S]*\}/);
//     if (!match) throw new Error('Gemini did not return parseable JSON');
//     const content = JSON.parse(match[0]);

//     // sanity fill if model omitted anything
//     if (!Array.isArray(content.last_three_readings)) content.last_three_readings = lastThree || [];
//     if (!Array.isArray(content.suggested_medicines)) content.suggested_medicines = [];
//     if (!Array.isArray(content.dosage_notes)) content.dosage_notes = [];
//     if (!Array.isArray(content.lifestyle_tips)) content.lifestyle_tips = [];
//     if (typeof content.prediction !== 'string') content.prediction = 'Not specified';

//     return { generatedBy: 'gemini', content, inputContext: { recentWindowDays: 7, extraNotes } };
//   } catch (e) {
//     const fb = rulesFallback(recent, lastThree);
//     return { generatedBy: 'rules', content: fb, inputContext: { recentWindowDays: 7, extraNotes } };
//   }
// }

// module.exports = { generateAIReportFromReadings };



// src/services/gemini.js
// src/services/gemini.js
const { GoogleGenAI } = require('@google/genai');

// ---------------- helpers: analytics & last3 ----------------
function computeStats(readings) {
  if (!readings?.length) return { count: 0 };
  const arr = [...readings].sort((a,b) => new Date(a.measuredAt) - new Date(b.measuredAt));
  const sys = arr.map(r => Number(r.systolic));
  const dia = arr.map(r => Number(r.diastolic));
  const mean = a => a.reduce((s,x)=>s+x,0)/a.length;
  const avgSys = Math.round(mean(sys));
  const avgDia = Math.round(mean(dia));
  const minSys = Math.min(...sys), maxSys = Math.max(...sys);
  const minDia = Math.min(...dia), maxDia = Math.max(...dia);

  // slope (simple linear regression on index)
  const x = arr.map((_,i)=>i), ySys = sys, yDia = dia;
  const slope = (xs, ys) => {
    const xm = mean(xs), ym = mean(ys);
    let num=0, den=0;
    for(let i=0;i<xs.length;i++){ num += (xs[i]-xm)*(ys[i]-ym); den += (xs[i]-xm)**2; }
    return den === 0 ? 0 : +(num/den).toFixed(3);
  };
  const slopeSys = slope(x,ySys), slopeDia = slope(x,yDia);
  const std = (arr)=> {
    const m = mean(arr);
    return Math.sqrt(mean(arr.map(v=> (v-m)**2 )));
  };
  const variabilitySys = +std(sys).toFixed(2), variabilityDia = +std(dia).toFixed(2);

  const flags = [];
  const last = arr[arr.length-1];
  if (last && (last.systolic >= 160 || last.diastolic >= 100)) flags.push('very_high_last_reading');
  if (slopeSys > 0.5) flags.push('rising_systolic_trend');
  if (slopeDia > 0.5) flags.push('rising_diastolic_trend');
  if (variabilitySys > 15) flags.push('high_systolic_variability');
  if (variabilityDia > 10) flags.push('high_diastolic_variability');

  return {
    count: arr.length, avgSys, avgDia, minSys, maxSys, minDia, maxDia,
    slopeSys, slopeDia, variabilitySys, variabilityDia, flags
  };
}

function makeLastThree(readings) {
  const r = [...readings].slice(-3).reverse();
  return r.map(x => ({ systolic: x.systolic, diastolic: x.diastolic, pulse: x.pulse ?? null, measuredAt: x.measuredAt }));
}

// ---------------- deterministic fallback with full schema ----------------
function rulesFallback(readings, patientInfo, lastThree, stats) {
  const avgSys = stats?.avgSys ?? null, avgDia = stats?.avgDia ?? null;
  const stage = (avgSys === null) ? 'Insufficient data'
    : (avgSys >= 140 || avgDia >= 90) ? 'Likely Stage 2 Hypertension'
    : (avgSys >= 130 || avgDia >= 80) ? 'Likely Stage 1 Hypertension'
    : 'Likely Normal BP trend';

  const suggested_medicines = stage.includes('Hypertension') ? ['Losartan 50mg', 'Amlodipine 5mg'] : [];
  const med_priority = suggested_medicines.map((m, i) => ({ name: m, priority: i+1, rationale: `${m}: suggested based on readings` }));

  return {
    prediction: stage,
    trend_explanation: `Average ${avgSys || '-'} / ${avgDia || '-'} across ${stats?.count || 0} readings. Trend slope Sys ${stats?.slopeSys ?? 0}, Dia ${stats?.slopeDia ?? 0}. Flags: ${(stats?.flags||[]).join(', ') || 'none'}.`,
    suggested_medicines,
    medicine_rationale: med_priority.map(p=> `${p.name}: ${p.rationale}`),
    medication_priority: med_priority,
    dosage_notes: suggested_medicines.length ? ['Losartan 50mg once daily', 'Amlodipine 5mg once daily'] : ['No medication indicated; monitor'],
    lifestyle_tips: ['Reduce salt intake', '30-min brisk walk daily', 'Manage stress', 'Limit alcohol'],
    contraindications: [],
    urgency_level: stats?.flags?.includes('very_high_last_reading') ? 'high' : 'routine',
    when_to_seek_care: 'Seek emergency care for BP ≥ 180/120 or chest pain / neurological symptoms.',
    monitoring_plan: 'Measure BP twice daily, keep a log; repeat in 1 week if stable.',
    follow_up_days: suggested_medicines.length ? 14 : 7,
    confidence: 0.5,
    numerics: {
      avg_systolic: stats?.avgSys, avg_diastolic: stats?.avgDia,
      min_systolic: stats?.minSys, max_systolic: stats?.maxSys,
      min_diastolic: stats?.minDia, max_diastolic: stats?.maxDia,
      slope_systolic: stats?.slopeSys, slope_diastolic: stats?.slopeDia,
      variability_systolic: stats?.variabilitySys, variability_diastolic: stats?.variabilityDia
    },
    reference_readings: lastThree,
    last_three_readings: lastThree
  };
}

// ---------------- low-level Gemini call ----------------
async function callGemini(contents, generationConfig = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');
  const ai = new GoogleGenAI({ apiKey });
  const cfg = Object.assign({ temperature: 0.2, topP: 0.9, maxOutputTokens: 1400 }, generationConfig);
  const resp = await ai.models.generateContent({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash', contents, generationConfig: cfg });
  if (resp?.text) return resp.text;
  if (resp?.output && resp.output[0]?.content?.[0]?.text) return resp.output[0].content[0].text;
  return JSON.stringify(resp);
}

// ---------------- robust extractor (balanced braces) ----------------
function extractJsonFromText(raw) {
  if (!raw || typeof raw !== 'string') return null;
  // try direct parse
  try { const j = JSON.parse(raw); if (j && typeof j === 'object') return j; } catch(e){}
  // locate first '{'
  const s = raw.indexOf('{'); if (s === -1) return null;
  let depth = 0;
  for (let i=s;i<raw.length;i++){
    const ch = raw[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (depth === 0) {
      const cand = raw.slice(s, i+1);
      try { return JSON.parse(cand); } catch(e) { break; }
    }
  }
  return null;
}

// ---------------- validation ----------------
function validateReport(obj) {
  if (!obj || typeof obj !== 'object') return false;
  const required = ['prediction','trend_explanation','suggested_medicines','dosage_notes','lifestyle_tips','numerics','last_three_readings'];
  for (const k of required) {
    if (!(k in obj)) return false;
  }
  // short text check (trend_explanation should be reasonably long)
  if (!obj.trend_explanation || String(obj.trend_explanation).trim().length < 20) return false;
  // numerics must include avg values
  if (!obj.numerics || (obj.numerics.avg_systolic === undefined && obj.numerics.avg_systolic !== 0)) return false;
  return true;
}

// ---------------- main generator with retry/repair ----------------
async function generateAIReportFromReadings({ readings = [], extraNotes = '', patientInfo = {}, lastThree = [] }) {
  const recent = Array.isArray(readings) ? readings.slice(-7) : [];
  const stats = computeStats(recent);
  const echoLastThree = (Array.isArray(lastThree) && lastThree.length) ? lastThree : makeLastThree(recent);

  const schemaNote = `
Return ONLY a JSON object. REQUIRED keys:
prediction, trend_explanation, suggested_medicines (array), medicine_rationale (array),
medication_priority (array of {name, priority, rationale}), dosage_notes (array),
lifestyle_tips (array), contraindications (array), urgency_level (high/moderate/routine),
when_to_seek_care, monitoring_plan, follow_up_days (int), confidence (0-1 numeric),
numerics (object with avg_systolic, avg_diastolic, min/max, slope, variability),
reference_readings (array), last_three_readings (array).
Trend explanation MUST reference specific numeric values (eg: "avg X/Y; last reading Z/W; slope S").
`;

  const fewShot = `EXAMPLE:
STATS: avg 138/86, min 120/80, max 150/92, slopeSys 0.6
LAST3: [145/92, 142/90, 140/88]
OUTPUT:
{
  "prediction":"Likely Stage 1 Hypertension",
  "trend_explanation":"Average 138/86 across 7 readings. Systolic shows upward slope ~0.6; last reading 145/92 is higher than prior values, indicating a rising trend.",
  ...
}
`;

  const basePrompt = `
You are a careful clinical assistant. ${schemaNote}
PATIENT: ${JSON.stringify(patientInfo)}
STATS: ${JSON.stringify(stats)}
RECENT_READINGS (oldest->newest): ${JSON.stringify(recent)}
LAST_THREE (echo): ${JSON.stringify(echoLastThree)}
NOTES: ${extraNotes || ''}
${fewShot}
`;

  // Attempt 1: normal token budget
  try {
    let raw = await callGemini(basePrompt, { temperature: 0.2, maxOutputTokens: 1400 });
    console.log('[Gemini RAW attempt1]', raw?.slice(0,1200));
    let parsed = extractJsonFromText(raw);
    if (parsed && validateReport(parsed)) {
      // normalize arrays
      parsed.suggested_medicines = Array.isArray(parsed.suggested_medicines) ? parsed.suggested_medicines : [];
      parsed.last_three_readings = Array.isArray(parsed.last_three_readings) ? parsed.last_three_readings : echoLastThree;
      return { generatedBy: 'gemini', content: parsed, inputContext: { recentWindowDays: 7, extraNotes } };
    }

    // If parsed but invalid/short or not parsed -> attempt repair (Attempt 2)
    // Attempt 2: ask model to strictly output JSON only and ensure fields present (higher tokens)
    const repairPrompt = `
The previous response either was truncated or missed required fields. You must return ONLY valid JSON that matches the required keys listed below. Do NOT include any commentary.

${schemaNote}

PREVIOUS RAW RESPONSE:
${raw}

Now return a corrected, complete JSON object that includes all required fields and uses numbers from the "STATS" and "LAST_THREE" sections. If a field is unknown, provide a conservative default (e.g., confidence: 0.5).
`;
    let raw2 = await callGemini(repairPrompt, { temperature: 0.0, maxOutputTokens: 2200 });
    console.log('[Gemini RAW attempt2]', raw2?.slice(0,2200));
    let parsed2 = extractJsonFromText(raw2);
    if (parsed2 && validateReport(parsed2)) {
      parsed2.suggested_medicines = Array.isArray(parsed2.suggested_medicines) ? parsed2.suggested_medicines : [];
      parsed2.last_three_readings = Array.isArray(parsed2.last_three_readings) ? parsed2.last_three_readings : echoLastThree;
      return { generatedBy: 'gemini', content: parsed2, inputContext: { recentWindowDays: 7, extraNotes } };
    }

    // If still invalid, log and fallback
    console.warn('Gemini produced invalid JSON after 2 attempts; using deterministic fallback.');
    const fb = rulesFallback(recent, patientInfo, echoLastThree, stats);
    return { generatedBy: 'rules', content: fb, inputContext: { recentWindowDays: 7, extraNotes } };

  } catch (err) {
    console.error('generateAIReportFromReadings error:', err?.message || err);
    const fb = rulesFallback(recent, patientInfo, echoLastThree, stats);
    return { generatedBy: 'rules', content: fb, inputContext: { recentWindowDays: 7, extraNotes } };
  }
}

module.exports = { generateAIReportFromReadings };
