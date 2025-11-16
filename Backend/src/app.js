


const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

// static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// api

const providerRoutes = require('./routes/providerRoutes');
app.use('/api/providers', providerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);

// health
app.get('/health', (req, res) => res.json({ ok: true }));

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

module.exports = app;
