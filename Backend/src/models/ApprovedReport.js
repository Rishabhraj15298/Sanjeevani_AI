// const mongoose = require('mongoose');

// const ApprovedReportSchema = new mongoose.Schema(
//   {
//     aiReport: { type: mongoose.Schema.Types.ObjectId, ref: 'AIReport', required: true },
//     patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     finalSummary: String,
//     meds: [String],
//     doctorNotes: String,
//     approvedAt: { type: Date, default: Date.now }
//   },
//   { timestamps: true }
// );

// ApprovedReportSchema.index({ patient: 1, approvedAt: -1 });

// module.exports = mongoose.model('ApprovedReport', ApprovedReportSchema);

const mongoose = require('mongoose');

const ApprovedReportSchema = new mongoose.Schema({
  aiReport: { type: mongoose.Schema.Types.ObjectId, ref: 'AIReport' },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  finalSummary: String,
  meds: [String],
  doctorNotes: String,
  approvedAt: { type: Date, default: Date.now }
}, { timestamps: true });

ApprovedReportSchema.index({ patient: 1, doctor: 1, approvedAt: -1 });

module.exports = mongoose.model('ApprovedReport', ApprovedReportSchema);
