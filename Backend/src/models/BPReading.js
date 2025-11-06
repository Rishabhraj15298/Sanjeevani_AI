// const mongoose = require('mongoose');

// const BPReadingSchema = new mongoose.Schema(
//   {
//     patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     systolic: { type: Number, required: true },
//     diastolic: { type: Number, required: true },
//     pulse: { type: Number },
//     symptoms: [String],
//     measuredAt: { type: Date, default: Date.now }
//   },
//   { timestamps: true }
// );

// BPReadingSchema.index({ patient: 1, measuredAt: -1 });

// module.exports = mongoose.model('BPReading', BPReadingSchema);


const mongoose = require('mongoose');

const BPReadingSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  systolic: { type: Number, required: true },
  diastolic: { type: Number, required: true },
  pulse: { type: Number },
  symptoms: [String],
  notes: String,
  measuredAt: { type: Date, default: Date.now }
}, { timestamps: true });

BPReadingSchema.index({ patient: 1, measuredAt: -1 });

module.exports = mongoose.model('BPReading', BPReadingSchema);
