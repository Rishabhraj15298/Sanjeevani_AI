// const router = require('express').Router();
// const { body } = require('express-validator');
// const auth = require('../middleware/auth');
// const permit = require('../middleware/roles');
// const ctrl = require('../controllers/patientController');

// router.use(auth, permit('patient'));

// router.post(
//   '/reading',
//   [
//     body('systolic').isNumeric(),
//     body('diastolic').isNumeric(),
//     body('pulse').optional().isNumeric(),
//     body('symptoms').optional().isArray(),
//     body('measuredAt').optional().isISO8601(),
//     body('notes').optional().isString()
//   ],
//   ctrl.addReading
// );

// router.get('/readings', ctrl.getReadings);
// router.get('/ai-reports', ctrl.getAIReports);
// router.get('/approved-reports', ctrl.getApprovedReports);

// module.exports = router;


// const router = require('express').Router();
// const auth = require('../middleware/auth');
// const roles = require('../middleware/roles');
// const ctrl = require('../controllers/patientController');
// const upload = require('../middleware/upload');

// // all patient routes require patient role
// router.use(auth, roles('patient'));

// router.post('/reading', ctrl.addReading);               // POST reading
// router.get('/readings', ctrl.getReadings);              // GET readings
// router.get('/ai-reports', ctrl.getAIReports);           // get AI reports
// router.get('/approved-reports', ctrl.getApprovedReports);
// router.post('/profile', ctrl.updateProfile);            // update profile
// router.post('/upload', upload.array('files', 6), ctrl.uploadFiles);
// router.get('/files', ctrl.listFiles);

// module.exports = router;

// add temporarily at TOP of src/routes/patientRoutes.js (then remove after testing)
const ctrl = require('../controllers/patientController');
const upload = require('../middleware/upload');
console.log('[patientRoutes] typeof ctrl.uploadFiles =', typeof ctrl.uploadFiles);
console.log('[patientRoutes] typeof upload =', typeof upload);


const router = require('express').Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

const chatCtrl = require('../controllers/chatController');
// all patient routes require patient role
router.use(auth, roles('patient'));

const historyCtrl = require('../controllers/historyController');
router.get('/history/reports', historyCtrl.getApprovedReportsHistory);
// create a reading

const imageCtrl = require('../controllers/imageController');
router.post('/upload-bp-image', auth, imageCtrl.uploadBPImage);

router.post('/reading', ctrl.addReading);

// list readings
router.get('/readings', ctrl.getReadings);

// AI reports (optional view)
router.get('/ai-reports', ctrl.getAIReports);

// approved reports
router.get('/approved-reports', ctrl.getApprovedReports);

// profile update
router.post('/profile', ctrl.updateProfile);

// file upload (multer) — THIS was likely throwing (undefined handler)
router.post('/upload', upload.array('files', 6), ctrl.uploadFiles);

// list my files
router.get('/files', ctrl.listFiles);
router.get('/chat', chatCtrl.getChat);
router.post('/chat', chatCtrl.postChat);

module.exports = router;


