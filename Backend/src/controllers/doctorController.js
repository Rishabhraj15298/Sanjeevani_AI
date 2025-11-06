// const AIReport = require('../models/AIReport');
// const ApprovedReport = require('../models/ApprovedReport');
// const { getIO } = require('../socket');

// exports.listPendingReports = async (req, res, next) => {
//   try {
//     const { patientId } = req.query;
//     const filter = { status: 'pending' };
//     if (patientId) filter.patient = patientId;
//     const reports = await AIReport.find(filter)
//       .populate('patient', 'name email age gender')
//       .sort({ createdAt: -1 });
//     res.json({ reports });
//   } catch (e) {
//     next(e);
//   }
// };

// exports.approveReport = async (req, res, next) => {
//   try {
//     const { id } = req.params; // AIReport id
//     const { finalSummary, meds, doctorNotes } = req.body;
//     const aiReport = await AIReport.findById(id);
//     if (!aiReport) return res.status(404).json({ message: 'AI report not found' });

//     aiReport.status = 'reviewed';
//     await aiReport.save();

//     const approved = await ApprovedReport.create({
//       aiReport: aiReport._id,
//       patient: aiReport.patient,
//       doctor: req.user.id,
//       finalSummary: finalSummary || aiReport.content.summary,
//       meds: meds && meds.length ? meds : aiReport.content.suggested_medicines || [],
//       doctorNotes
//     });

//     // Notify patient in realtime
//     try {
//       const io = getIO();
//       io.to(`patient:${aiReport.patient.toString()}`).emit('report:approved', {
//         approvedId: approved._id,
//         patientId: aiReport.patient,
//         finalSummary: approved.finalSummary,
//         meds: approved.meds,
//         doctorNotes: approved.doctorNotes,
//         approvedAt: approved.approvedAt
//       });
//     } catch (_) {}

//     res.json({ approved });
//   } catch (e) {
//     next(e);
//   }
// };

// exports.rejectReport = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const { reason } = req.body;
//     const aiReport = await AIReport.findById(id);
//     if (!aiReport) return res.status(404).json({ message: 'AI report not found' });
//     aiReport.status = 'rejected';
//     await aiReport.save();
//     res.json({ message: 'Report rejected', reason });
//   } catch (e) {
//     next(e);
//   }
// };

// const AIReport = require('../models/AIReport');
// const ApprovedReport = require('../models/ApprovedReport');
// const { getIO } = require('../socket');

// exports.listPendingReports = async (req, res, next) => {
//   try {
//     const { patientId } = req.query;
//     const filter = { status: 'pending' };
//     if (patientId) filter.patient = patientId;
//     const reports = await AIReport.find(filter)
//       .populate('patient', 'name email age gender weight pmh allergies')
//       .sort({ createdAt: -1 });
//     res.json({ reports });
//   } catch (e) {
//     next(e);
//   }
// };

// exports.approveReport = async (req, res, next) => {
//   try {
//     const { id } = req.params; // AIReport id
//     const { finalSummary, meds, doctorNotes } = req.body;
//     const aiReport = await AIReport.findById(id);
//     if (!aiReport) return res.status(404).json({ message: 'AI report not found' });

//     aiReport.status = 'reviewed';
//     await aiReport.save();

//     const approved = await ApprovedReport.create({
//       aiReport: aiReport._id,
//       patient: aiReport.patient,
//       doctor: req.user.id,
//       finalSummary: finalSummary || aiReport.content?.prediction || aiReport.content?.summary || 'Approved',
//       meds: meds && meds.length ? meds : aiReport.content?.suggested_medicines || [],
//       doctorNotes
//     });

//     try {
//       const io = getIO();
//       io.to(`patient:${aiReport.patient.toString()}`).emit('report:approved', {
//         approvedId: approved._id,
//         patientId: aiReport.patient,
//         finalSummary: approved.finalSummary,
//         meds: approved.meds,
//         doctorNotes: approved.doctorNotes,
//         approvedAt: approved.approvedAt
//       });
//     } catch (_) {}

//     res.json({ approved });
//   } catch (e) {
//     next(e);
//   }
// };

// exports.declineReport = async (req, res, next) => {
//   try {
//     const { id } = req.params; // AIReport id
//     const { reason } = req.body;
//     const aiReport = await AIReport.findById(id);
//     if (!aiReport) return res.status(404).json({ message: 'AI report not found' });

//     aiReport.status = 'rejected';
//     await aiReport.save();

//     // realtime notify patient with reason
//     try {
//       const io = getIO();
//       io.to(`patient:${aiReport.patient.toString()}`).emit('report:declined', {
//         aiReportId: aiReport._id,
//         patientId: aiReport.patient,
//         reason: reason || 'No specific reason provided',
//         declinedAt: new Date().toISOString()
//       });
//     } catch (_) {}

//     res.json({ message: 'Report declined', reason });
//   } catch (e) {
//     next(e);
//   }
// };


const AIReport = require('../models/AIReport');
const ApprovedReport = require('../models/ApprovedReport');
const User = require('../models/User');
const { getIO } = require('../socket');

exports.getPendingReports = async (req, res, next) => {
  try {
    const reports = await AIReport.find({ status: 'pending' })
      .populate('patient', 'name age gender weight pmh allergies')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ reports });
  } catch (e) { next(e); }
};

exports.approveReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { finalSummary, meds = [], doctorNotes = '' } = req.body;
    const ai = await AIReport.findById(id);
    if (!ai) return res.status(404).json({ message: 'Not found' });

    ai.status = 'approved';
    await ai.save();

    const approved = await ApprovedReport.create({
      aiReport: ai._id,
      patient: ai.patient,
      doctor: req.user.id,
      finalSummary,
      meds,
      doctorNotes,
      approvedAt: new Date()
    });

    // emit to patient
    try {
      const io = getIO();
      io.to(`user:${ai.patient.toString()}`).emit('report:approved', {
        approvedId: approved._id,
        finalSummary, meds, doctorNotes
      });
    } catch (_) {}

    res.json({ ok: true, approved });
  } catch (e) { next(e); }
};

exports.declineReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Not suitable' } = req.body;
    const ai = await AIReport.findById(id);
    if (!ai) return res.status(404).json({ message: 'Not found' });

    ai.status = 'declined';
    await ai.save();

    try {
      const io = getIO();
      io.to(`user:${ai.patient.toString()}`).emit('report:declined', {
        aiReportId: ai._id,
        reason
      });
    } catch (_) {}

    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.getPatientFiles = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const Attachment = require('../models/Attachment');
    const files = await Attachment.find({ patient: patientId }).sort({ createdAt: -1 });
    res.json({ files });
  } catch (e) { next(e); }
};


exports.getAllFiles = async (req, res, next) => {
  try {
    // limit and sort parameters (optional query)
    const limit = Math.min(200, parseInt(req.query.limit || '100', 10));
    const files = await Attachment.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('patient', 'name age email') // show patient basic info
      .lean();
    res.json({ files });
  } catch (e) {
    next(e);
  }
};