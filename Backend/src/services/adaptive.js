
const axios = require('axios');

const ADAPTIVE_URL = process.env.ADAPTIVE_URL || 'http://127.0.0.1:8001/adaptive';
const TIMEOUT = Number(process.env.ADAPTIVE_TIMEOUT_MS || 4000);

async function callAdaptiveModel({ systolic, diastolic, current_med = '', response = '' }) {
  try {
    const payload = { systolic, diastolic, current_med, response };
    const r = await axios.post(ADAPTIVE_URL, payload, { timeout: TIMEOUT });
    if (r?.data?.success && r.data.result) {
      const res = r.data.result;
      return {
        ok: true,
        predictedGroup: res.Predicted_Group,
        newGroup: res.New_Group,
        confidence: res.Confidence,
        recommendedClass: res.Recommended_Class,
        suggestedBrands: res.Suggested_Brands,
        clinicalNote: res.Clinical_Note || null,
        raw: res
      };
    }
    return { ok: false, error: 'no_result', raw: r?.data || null };
  } catch (err) {
    return { ok: false, error: err?.message || 'request_failed', raw: err?.response?.data || null };
  }
}

module.exports = { callAdaptiveModel };
