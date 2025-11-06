const { validationResult } = require('express-validator');
const User = require('../models/User');
const BPReading = require('../models/BPReading');
const AIReport = require('../models/AIReport');
const ApprovedReport = require('../models/ApprovedReport');
const Attachment = require('../models/Attachment');
const { getIO } = require('../socket');
const { generateAIReportFromReadings } = require('../services/gemini');

// exports.addReading = async (req, res, next) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

//     const { systolic, diastolic, pulse, symptoms, measuredAt, notes } = req.body;
//     const reading = await BPReading.create({
//       patient: req.user.id,
//       systolic,
//       diastolic,
//       pulse,
//       symptoms,
//       measuredAt: measuredAt ? new Date(measuredAt) : Date.now()
//     });

//     // Emit to doctors immediately
//     try {
//       const io = getIO();
//       io.to('doctors').emit('reading:created', {
//         readingId: reading._id,
//         patientId: req.user.id,
//         systolic: reading.systolic,
//         diastolic: reading.diastolic,
//         pulse: reading.pulse,
//         symptoms: reading.symptoms,
//         measuredAt: reading.measuredAt
//       });
//     } catch (_) {}

//     // Kick off async AI report generation (no blocking)
//     (async () => {
//       const since = new Date();
//       since.setDate(since.getDate() - 7);
//       const recent = await BPReading.find({ patient: req.user.id, measuredAt: { $gte: since } }).sort({ measuredAt: 1 });
//       const aiRes = await generateAIReportFromReadings({ readings: recent, extraNotes: notes });

//       const aiReport = await AIReport.create({
//         patient: req.user.id,
//         generatedBy: aiRes.generatedBy,
//         inputContext: aiRes.inputContext,
//         content: aiRes.content,
//         status: 'pending'
//       });

//       try {
//         const io = getIO();
//         io.to('doctors').emit('ai_report:generated', {
//           aiReportId: aiReport._id,
//           patientId: req.user.id,
//           content: aiReport.content,
//           generatedBy: aiReport.generatedBy,
//           createdAt: aiReport.createdAt
//         });
//       } catch (_) {}
//     })();

//     // Return quickly
//     res.status(201).json({ reading, aiStatus: 'processing' });
//   } catch (e) {
//     next(e);
//   }
// };

// exports.getReadings = async (req, res, next) => {
//   try {
//     const { from, to } = req.query;
//     const filter = { patient: req.user.id };
//     if (from || to) {
//       filter.measuredAt = {};
//       if (from) filter.measuredAt.$gte = new Date(from);
//       if (to) filter.measuredAt.$lte = new Date(to);
//     }
//     const readings = await BPReading.find(filter).sort({ measuredAt: -1 });
//     res.json({ readings });
//   } catch (e) {
//     next(e);
//   }
// };

// exports.getAIReports = async (req, res, next) => {
//   try {
//     const reports = await AIReport.find({ patient: req.user.id }).sort({ createdAt: -1 });
//     res.json({ reports });
//   } catch (e) {
//     next(e);
//   }
// };

// exports.getApprovedReports = async (req, res, next) => {
//   try {
//     const approved = await ApprovedReport.find({ patient: req.user.id })
//       .populate('doctor', 'name email')
//       .sort({ approvedAt: -1 });
//     res.json({ approved });
//   } catch (e) {
//     next(e);
//   }
// };

// const { validationResult } = require('express-validator');
// const BPReading = require('../models/BPReading');
// const AIReport = require('../models/AIReport');
// const ApprovedReport = require('../models/ApprovedReport');
// const User = require('../models/User');
// const { getIO } = require('../socket');
// const { generateAIReportFromReadings } = require('../services/gemini');

// exports.addReading = async (req, res, next) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

//     const { systolic, diastolic, pulse, symptoms, measuredAt, notes } = req.body;

//     // 1) Save reading
//     const reading = await BPReading.create({
//       patient: req.user.id,
//       systolic,
//       diastolic,
//       pulse,
//       symptoms,
//       measuredAt: measuredAt ? new Date(measuredAt) : Date.now()
//     });
     
//     // after creating 'reading'
// try {
//   const sinceWeek = new Date();
//   sinceWeek.setDate(sinceWeek.getDate() - 7);
//   const count = await BPReading.countDocuments({ patient: req.user.id, measuredAt: { $gte: sinceWeek } });

//   const io = getIO();
//   // nudge patient (and optionally email later)
//   if (count < 5) {
//     io.to(`user:${req.user.id}`).emit('nudge:keep-going', {
//       target: 5,
//       current: count,
//       message: `Great! ${count}/5 readings this week. Add ${5 - count} more for a better assessment.`
//     });
//   }
// } catch (e) {
//   console.error('nudge emit failed', e?.message || e);
// }

//     // 2) Emit reading to doctors right away
//     try {
//       const io = getIO();
//       io.to('doctors').emit('reading:created', {
//         readingId: reading._id,
//         patientId: req.user.id,
//         systolic: reading.systolic,
//         diastolic: reading.diastolic,
//         pulse: reading.pulse,
//         symptoms: reading.symptoms,
//         measuredAt: reading.measuredAt
//       });
//     } catch (emitErr) {
//       console.error('Socket emit reading:created failed', emitErr?.message || emitErr);
//     }

//     // 3) Async AI generation (no blocking) with robust logging and fallback
//     (async () => {
//       try {
//         // fetch last 7 (oldest -> newest)
//         const since = new Date();
//         since.setDate(since.getDate() - 7);
//         const recent = await BPReading.find({
//           patient: req.user.id,
//           measuredAt: { $gte: since }
//         }).sort({ measuredAt: 1 });

//         // compute lastThree (newest -> oldest for UI)
//         const lastThree = [...recent].slice(-3).reverse().map(r => ({
//           systolic: r.systolic,
//           diastolic: r.diastolic,
//           pulse: r.pulse ?? null,
//           measuredAt: r.measuredAt
//         }));

//         // patient info for right panel
//         const p = await User.findById(req.user.id).lean();
//         const patientInfo = p
//           ? {
//               name: p.name,
//               age: p.age ?? null,
//               gender: p.gender ?? null,
//               weight: p.weight ?? null,
//               pmh: p.pmh ?? [],
//               allergies: p.allergies ?? []
//             }
//           : {};

//         // call Gemini (robust service should handle parsing/fallback)
//         let aiRes;
//         try {
//           aiRes = await generateAIReportFromReadings({
//             readings: recent,
//             extraNotes: notes,
//             patientInfo,
//             lastThree
//           });
//         } catch (aiErr) {
//           console.error('generateAIReportFromReadings threw:', aiErr?.message || aiErr);
//           // ensure deterministic fallback shape if service throws
//           aiRes = { generatedBy: 'rules', content: { prediction: 'Insufficient data', last_three_readings: lastThree } };
//         }

//         // debug log (keep small)
//         try {
//           console.log('[AIReport preview] generatedBy=', aiRes.generatedBy, ' contentKeys=', Object.keys(aiRes.content || {}).slice(0,20));
//         } catch (e) {}

//         // persist AI report (ensure content is object)
//         const aiReport = await AIReport.create({
//           patient: req.user.id,
//           generatedBy: aiRes.generatedBy || 'rules',
//           inputContext: aiRes.inputContext || {},
//           content: aiRes.content && typeof aiRes.content === 'object' ? aiRes.content : {},
//           status: 'pending'
//         });

//         // 4) Emit enriched payload to doctors (left pane + right pane info)
//         try {
//           const io = getIO();
//           io.to('doctors').emit('ai_report:generated', {
//             aiReportId: aiReport._id,
//             patientId: req.user.id,
//             content: aiReport.content, // structured object (guaranteed by service/fallback)
//             patientDetails: patientInfo, // { name, age, gender, weight, pmh, allergies }
//             createdAt: aiReport.createdAt
//           });
//         } catch (emitErr2) {
//           console.error('Socket emit ai_report:generated failed', emitErr2?.message || emitErr2);
//         }
//       } catch (err) {
//         // catch any unexpected error inside the async worker so it doesn't crash server
//         console.error('Async AI generation error:', err?.message || err);
//       }
//     })();

//     // 5) Respond fast
//     res.status(201).json({ reading, aiStatus: 'processing' });
//   } catch (e) {
//     next(e);
//   }
// };

// exports.getReadings = async (req, res, next) => {
//   try {
//     const { from, to } = req.query;
//     const filter = { patient: req.user.id };
//     if (from || to) {
//       filter.measuredAt = {};
//       if (from) filter.measuredAt.$gte = new Date(from);
//       if (to) filter.measuredAt.$lte = new Date(to);
//     }
//     const readings = await BPReading.find(filter).sort({ measuredAt: -1 });
//     res.json({ readings });
//   } catch (e) {
//     next(e);
//   }
// };

// exports.getAIReports = async (req, res, next) => {
//   try {
//     const reports = await AIReport.find({ patient: req.user.id }).sort({ createdAt: -1 });
//     res.json({ reports });
//   } catch (e) {
//     next(e);
//   }
// };

// exports.getApprovedReports = async (req, res, next) => {
//   try {
//     const approved = await ApprovedReport.find({ patient: req.user.id })
//       .populate('doctor', 'name email')
//       .sort({ approvedAt: -1 });
//     res.json({ approved });
//   } catch (e) {
//     next(e);
//   }
// };


const path = require('path');

// POST /api/patient/upload  (multer handles req.files)
exports.uploadFiles = async (req, res, next) => {
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const saved = await Promise.all(req.files.map(f => {
      return Attachment.create({
        patient: req.user.id,
        originalName: f.originalname,
        mimeType: f.mimetype,
        fileName: f.filename,
        size: f.size,
        url: `${baseUrl}/uploads/${f.filename}`,
      });
    }));

    return res.status(201).json({ files: saved });
  } catch (e) { next(e); }
};

// GET /api/patient/files
exports.listFiles = async (req, res, next) => {
  try {
    const files = await Attachment.find({ patient: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ files });
  } catch (e) { next(e); }
};

// (optional) Update profile (used by frontend Profile page)
// POST /api/patient/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { age, gender, weight, pmh, allergies } = req.body;
    const update = {};
    if (age !== undefined) update.age = age;
    if (gender !== undefined) update.gender = gender;
    if (weight !== undefined) update.weight = weight;
    if (pmh !== undefined) update.pmh = pmh;
    if (allergies !== undefined) update.allergies = allergies;

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');
    res.json({ user });
  } catch (e) { next(e); }
};
