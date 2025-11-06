// const mongoose = require('mongoose');

// const AIReportSchema = new mongoose.Schema(
//   {
//     patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     generatedBy: { type: String, enum: ['gemini', 'rules'], default: 'gemini' },
//     inputContext: {
//       recentWindowDays: Number,
//       extraNotes: String
//     },
//     content: {
//       summary: String,
//       possible_conditions: [String],
//       suggested_medicines: [String],
//       lifestyle_tips: [String]
//     },
//     status: { type: String, enum: ['pending', 'reviewed', 'rejected'], default: 'pending' }
//   },
//   { timestamps: true }
// );

// AIReportSchema.index({ patient: 1, createdAt: -1 });

// module.exports = mongoose.model('AIReport', AIReportSchema);


const mongoose = require('mongoose');

const AIReportSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  generatedBy: { type: String, default: 'gemini' },
  inputContext: { type: Object },
  content: { type: Object, default: {} }, // structured JSON from Gemini (or fallback)
  status: { type: String, enum: ['pending','approved','declined'], default: 'pending' }
}, { timestamps: true });

AIReportSchema.index({ patient: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('AIReport', AIReportSchema);

