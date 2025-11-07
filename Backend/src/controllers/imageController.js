// backend/src/controllers/imageController.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const vision = require('@google-cloud/vision');
const { parseBPFromTextServer } = require('../utils/parseBPFromTextServer');

const upload = multer({
  dest: path.join(__dirname, '../../tmp/uploads'),
  limits: { fileSize: 6 * 1024 * 1024 } // 6MB
});

const client = new vision.ImageAnnotatorClient(); // uses GOOGLE_APPLICATION_CREDENTIALS

exports.uploadBPImage = [
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ ok: false, error: 'no_file' });
      const filePath = req.file.path;

      let text = '';
      try {
        const [result] = await client.textDetection(filePath);
        const detections = result.textAnnotations;
        text = (detections && detections[0] && detections[0].description) || '';
      } catch (visionErr) {
        console.error('Vision OCR error', visionErr);
        // fallback to reading raw buffer (very basic)
        text = '';
      }

      const parsed = parseBPFromTextServer(text || '');

      // cleanup file
      fs.unlink(filePath, () => { /* ignore errors */ });

      return res.json({ ok: true, parsed, text });
    } catch (e) {
      next(e);
    }
  }
];
