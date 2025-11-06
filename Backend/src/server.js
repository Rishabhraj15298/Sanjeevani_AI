// require('dotenv').config();
// const http = require('http');
// const app = require('./app');
// const connectDB = require('./config/db');
// // const { initSocket } = require('./socket');
// const { init,getIO } = require('./socket'); 


// const PORT = process.env.PORT || 4000;

// (async () => {
//   await connectDB(process.env.MONGO_URI);
//   const server = http.createServer(app);
//   init(server);
//   const io = getIO();
// //   const io = initSocket(server); // returns io instance and sets up auth
//   server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
// })();


require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const { init } = require('./socket');

const PORT = process.env.PORT || 4000;

// Basic required env validation to provide a clear error early
function assertEnv(name) {
  if (!process.env[name]) {
    console.error(`❌ Missing required environment variable: ${name}`);
    process.exit(1);
  }
}

assertEnv('MONGO_URI');
assertEnv('JWT_SECRET');
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not set — AI features will fall back to deterministic rules');
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection at:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ MongoDB connected');

    const server = http.createServer(app);
    const io = init(server); // socket init
    server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  } catch (err) {
    console.error('Server startup error:', err?.message || err);
    process.exit(1);
  }
}

start();
