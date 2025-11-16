
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const AIReport = require('./models/AIReport');

let io;

function init(server) {
  if (io) return io;
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || '*',
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 10000
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || (socket.handshake.headers?.authorization || '').split(' ')[1];
      if (!token) {
        console.warn('[socket] no token provided');
        return next(new Error('Auth token required'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: decoded.id, role: decoded.role };
      return next();
    } catch (err) {
      console.warn('[socket] auth failed', err?.message || err);
      return next(new Error('Auth failed'));
    }
  });

  io.on('connection', async (socket) => {
    try {
      console.log(`[socket] connected: id=${socket.id} userId=${socket.user?.id} role=${socket.user?.role}`);
      // join rooms
      socket.join(`user:${socket.user.id}`);
      if (socket.user.role === 'doctor' || socket.user.role === 'admin') socket.join('doctors');

      // send an ack to client
      socket.emit('socket:connected', { socketId: socket.id, user: socket.user });

      // if doctor: send pending AIReports on connect
      if (socket.user.role === 'doctor') {
        try {
          const reports = await AIReport.find({ status: 'pending' })
            .populate('patient', 'name age gender weight pmh allergies')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
          socket.emit('doctor:init', { reports });
        } catch (e) {
          console.error('[socket] doctor:init fetch failed', e.message || e);
        }
      }

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

      socket.on('disconnect', (reason) => {
        console.log(`[socket] disconnect: id=${socket.id} reason=${reason}`);
      });
    } catch (e) {
      console.error('[socket] connection handler error', e);
    }
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized. Call init(server) first.');
  return io;
}

module.exports = { init, getIO };
