const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalName: String,
    mimeType: String,
    fileName: String,       // stored file name on disk
    size: Number,
    url: String,            // served via /uploads/<fileName>
  },
  { timestamps: true }
);

AttachmentSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('Attachment', AttachmentSchema);
