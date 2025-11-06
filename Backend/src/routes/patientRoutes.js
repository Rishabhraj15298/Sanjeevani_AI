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


const router = require('express').Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const ctrl = require('../controllers/patientController');
const upload = require('../middleware/upload');

// all patient routes require patient role
router.use(auth, roles('patient'));

router.post('/reading', ctrl.addReading);               // POST reading
router.get('/readings', ctrl.getReadings);              // GET readings
router.get('/ai-reports', ctrl.getAIReports);           // get AI reports
router.get('/approved-reports', ctrl.getApprovedReports);
router.post('/profile', ctrl.updateProfile);            // update profile
router.post('/upload', upload.array('files', 6), ctrl.uploadFiles);
router.get('/files', ctrl.listFiles);

module.exports = router;

