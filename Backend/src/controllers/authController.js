// const jwt = require('jsonwebtoken');
// const { validationResult } = require('express-validator');
// const User = require('../models/User');

// function signToken(user) {
//   return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRES_IN || '7d'
//   });
// }

// // exports.register = async (req, res, next) => {
// //   try {
// //     const errors = validationResult(req);
// //     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

// //     const { name, email, password, role, age, gender, allergies, location } = req.body;
// //     const exists = await User.findOne({ email });
// //     if (exists) return res.status(400).json({ message: 'Email already registered' });

// //     const user = await User.create({ name, email, password, role, age, gender, allergies, location });
// //     const token = signToken(user);
// //     res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
// //   } catch (e) {
// //     next(e);
// //   }
// // };


// exports.register = async (req, res, next) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

//     const { name, email, password, role, age, gender, allergies, location, weight, pmh } = req.body;
//     const exists = await User.findOne({ email });
//     if (exists) return res.status(400).json({ message: 'Email already registered' });

//     const user = await User.create({ name, email, password, role, age, gender, allergies, location, weight, pmh });
//     const token = signToken(user);
//     res.status(201).json({
//       user: { id: user._id, name: user.name, email: user.email, role: user.role },
//       token
//     });
//   } catch (e) {
//     next(e);
//   }
// };

// exports.login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: 'Invalid credentials' });
//     const ok = await user.comparePassword(password);
//     if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
//     const token = signToken(user);
//     res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
//   } catch (e) {
//     next(e);
//   }
// };


const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role='patient', age, gender, weight, pmh = [], allergies = [] } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    let u = await User.findOne({ email });
    if (u) return res.status(400).json({ message: 'Email exists' });
    u = await User.create({ name, email, password, role, age, gender, weight, pmh, allergies });
    const token = jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const safeUser = { _id: u._id, name: u.name, email: u.email, role: u.role, age: u.age, gender: u.gender, weight: u.weight, pmh: u.pmh, allergies: u.allergies };
    res.json({ token, user: safeUser });
  } catch (e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const u = await User.findOne({ email });
    if (!u) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await u.comparePassword(password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const safeUser = { _id: u._id, name: u.name, email: u.email, role: u.role, age: u.age, gender: u.gender, weight: u.weight, pmh: u.pmh, allergies: u.allergies };
    res.json({ token, user: safeUser });
  } catch (e) { next(e); }
};
