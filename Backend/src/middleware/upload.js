const path = require('path');
const fs = require('fs');
const multer = require('multer');

// ensure uploads dir exists
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// allowed types
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // unique: <timestamp>-<random>-<safeName>
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safe}`;
    cb(null, unique);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error('Only PNG, JPG, JPEG, or PDF allowed'), false);
  }
  cb(null, true);
}

// 10 MB per file (adjust as needed)
const limits = { fileSize: 10 * 1024 * 1024 };

module.exports = multer({ storage, fileFilter, limits });
