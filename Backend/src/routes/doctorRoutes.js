// const router = require('express').Router();
// const auth = require('../middleware/auth');
// const permit = require('../middleware/roles');
// const ctrl = require('../controllers/doctorController');

// router.use(auth, permit('doctor', 'admin'));

// router.get('/pending', ctrl.listPendingReports);
// router.post('/approve/:id', ctrl.approveReport);
// router.post('/reject/:id', ctrl.rejectReport);

// module.exports = router;


// const router = require('express').Router();
// const auth = require('../middleware/auth');
// const permit = require('../middleware/roles');
// const ctrl = require('../controllers/doctorController');

// router.use(auth, permit('doctor', 'admin'));

// router.get('/pending', ctrl.listPendingReports);
// router.post('/approve/:id', ctrl.approveReport);
// router.post('/decline/:id', ctrl.declineReport); // ✅ NEW

// module.exports = router;


const router = require('express').Router();
const auth = require('../middleware/auth');
const permit = require('../middleware/roles');
const ctrl = require('../controllers/doctorController');

router.use(auth, permit(['doctor','admin']));

router.get('/pending', ctrl.getPendingReports);                  // list pending AI reports
router.post('/approve/:id', ctrl.approveReport);                 // approve AIReport (creates ApprovedReport)
router.post('/decline/:id', ctrl.declineReport);                 // decline with reason (emit to patient)
router.get('/patient-files/:patientId', ctrl.getPatientFiles);
router.get('/files', ctrl.getAllFiles);   // fetch files for a patient

module.exports = router;

