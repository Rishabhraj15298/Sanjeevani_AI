// backend/src/utils/parseBPFromTextServer.js
// CommonJS - backend use

function toNum(s) {
  const n = parseInt(String(s || '').replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

function clamp(v, min, max) {
  if (v == null) return null;
  return v < min || v > max ? null : v;
}

/**
 * Parse BP & pulse from OCR text. Returns { systolic, diastolic, pulse, raw, matches }.
 */
function parseBPFromTextServer(rawText = '') {
  const text = String(rawText || '').replace(/\r/g, '\n');
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);

  let systolic = null, diastolic = null, pulse = null;
  const matches = [];

  // 1) find slash patterns like 120/80
  const slashRegex = /(\d{2,3})\s*\/\s*(\d{2,3})/g;
  let m;
  while ((m = slashRegex.exec(text)) !== null) {
    const s = toNum(m[1]), d = toNum(m[2]);
    matches.push({ type: 'slash', s, d, snippet: m[0] });
  }
  if (matches.length) {
    const pick = matches.find(mm => mm.s >= 80 && mm.s <= 220 && mm.d >= 40 && mm.d <= 140) || matches[0];
    systolic = clamp(pick.s, 60, 260);
    diastolic = clamp(pick.d, 30, 200);
  }

  // 2) labeled patterns
  if (!systolic || !diastolic) {
    const sysMatch = text.match(/(?:systolic|sys|s)[\s:.-]*?(\d{2,3})/i);
    const diaMatch = text.match(/(?:diastolic|dia|d)[\s:.-]*?(\d{2,3})/i);
    if (sysMatch) systolic = clamp(toNum(sysMatch[1]), 60, 260);
    if (diaMatch) diastolic = clamp(toNum(diaMatch[1]), 30, 200);
  }

  // 3) first-two-numbers fallback
  if ((!systolic || !diastolic) && lines.length) {
    for (const line of lines) {
      const nums = Array.from(line.matchAll(/(\d{2,3})/g)).map(x => toNum(x[1]));
      if (nums.length >= 2) {
        const s = nums[0], d = nums[1];
        if (s >= 60 && s <= 260 && d >= 30 && d <= 200) {
          systolic = systolic || s;
          diastolic = diastolic || d;
          break;
        }
      }
    }
  }

  // 4) try pulse
  const pulseMatch = text.match(/(?:pulse|bpm|pul|p)[\s:.-]*?(\d{2,3})/i);
  if (pulseMatch) pulse = clamp(toNum(pulseMatch[1]), 20, 240);

  // 5) leftover numeric candidate for pulse
  if (!pulse) {
    const allNums = Array.from(text.matchAll(/(\d{2,3})/g)).map(m => toNum(m[1]));
    const leftover = allNums.filter(n => n !== systolic && n !== diastolic);
    const cand = leftover.find(n => n >= 30 && n <= 200);
    if (cand) pulse = cand;
  }

  // swap if reversed
  if (systolic && diastolic && systolic < diastolic) {
    [systolic, diastolic] = [diastolic, systolic];
  }

  return {
    systolic: systolic || null,
    diastolic: diastolic || null,
    pulse: pulse || null,
    raw: rawText,
    matches
  };
}

module.exports = { parseBPFromTextServer };
