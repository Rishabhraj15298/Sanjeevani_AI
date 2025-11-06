// const router = require('express').Router();
// const { body } = require('express-validator');
// const ctrl = require('../controllers/authController');

// router.post(
//   '/register',
//   [
//     body('name').notEmpty(),
//     body('email').isEmail(),
//     body('password').isLength({ min: 6 }),
//     body('role').optional().isIn(['patient', 'doctor', 'admin'])
//   ],
//   ctrl.register
// );

// router.post('/login', ctrl.login);

// module.exports = router;


// const router = require('express').Router();
// const { body } = require('express-validator');
// const ctrl = require('../controllers/authController');

// router.post(
//   '/register',
//   [
//     body('name').notEmpty(),
//     body('email').isEmail(),
//     body('password').isLength({ min: 6 }),
//     body('role').optional().isIn(['patient', 'doctor', 'admin']),
//     body('age').optional().isNumeric(),
//     body('gender').optional().isIn(['male', 'female', 'other']),
//     body('weight').optional().isNumeric(),
//     body('pmh').optional().isArray(),
//     body('allergies').optional().isArray()
//   ],
//   ctrl.register
// );

// router.post('/login', ctrl.login);

// module.exports = router;


const router = require('express').Router();
const ctrl = require('../controllers/authController');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);

module.exports = router;
