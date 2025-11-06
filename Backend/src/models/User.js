// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const UserSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true, lowercase: true },
//     password: { type: String, required: true },
//     role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
//     age: Number,
//     gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
//     allergies: [String],
//     location: {
//       lat: { type: Number, default: null },
//       lon: { type: Number, default: null }
//     }
//   },
//   { timestamps: true }
// );

// UserSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// UserSchema.methods.comparePassword = async function (candidate) {
//   return bcrypt.compare(candidate, this.password);
// };

// module.exports = mongoose.model('User', UserSchema);

// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const UserSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true, lowercase: true },
//     password: { type: String, required: true },
//     role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },

//     // ✅ Extra clinical fields
//     age: Number,
//     gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
//     weight: Number,                // <--- NEW (kg)
//     pmh: [String],                 // <--- NEW (Past medical history, array of tags)
//     allergies: [String],

//     location: {
//       lat: { type: Number, default: null },
//       lon: { type: Number, default: null }
//     }
//   },
//   { timestamps: true }
// );

// UserSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// UserSchema.methods.comparePassword = async function (candidate) {
//   return bcrypt.compare(candidate, this.password);
// };

// module.exports = mongoose.model('User', UserSchema);


const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient','doctor','admin'], default: 'patient' },
  age: Number,
  gender: String,
  weight: Number,
  pmh: [String],
  allergies: [String],
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function(password) {
  return require('bcryptjs').compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
