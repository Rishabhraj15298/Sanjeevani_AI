const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const AIReport = require('./models/AIReport');
const User = require('./models/User');

let io;

function init(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || '*',
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 15000,
    pingInterval: 12000
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('No token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: decoded.id, role: decoded.role };
      return next();
    } catch (e) {
      return next(new Error('Auth failed'));
    }
  });

  io.on('connection', async (socket) => {
    const { id, role } = socket.user || {};
    // rooms
    socket.join(`user:${id}`);
    if (role === 'doctor' || role === 'admin') socket.join('doctors');

    // on-connect: quick sync for doctors -> send latest 10 pending reports
    if (role === 'doctor' || role === 'admin') {
      try {
        const reports = await AIReport.find({ status: 'pending' })
          .populate('patient', 'name age gender weight pmh allergies')
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();
        socket.emit('doctor:init', { reports });
      } catch (e) {
        socket.emit('doctor:init', { reports: [] });
      }
    }

    // client can request resync anytime
    socket.on('doctor:sync', async (ack) => {
      try {
        const reports = await AIReport.find({ status: 'pending' })
          .populate('patient', 'name age gender weight pmh allergies')
          .sort({ createdAt: -1 })
          .limit(20)
          .lean();
        ack && ack({ ok: true, reports });
      } catch (e) {
        ack && ack({ ok: false, error: e.message });
      }
    });

    socket.on('disconnect', () => {});
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('io not initialized');
  return io;
}

module.exports = { init, getIO };
