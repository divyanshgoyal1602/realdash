const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initSocket } = require('./utils/socket');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Resolve allowed CORS origins
const configuredOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const isDev = process.env.NODE_ENV !== 'production';
const corsOrigins = isDev
  // In development, allow any localhost origin so Vite can pick any port
  ? [/^http:\/\/localhost(:\d+)?$/]
  // In production, stick to the configured origin string
  : [configuredOrigin];

const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  },
});

// Make io accessible in routes/controllers
app.set('io', io);
initSocket(io);

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));

// API Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/offices',    require('./routes/offices'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/aap',        require('./routes/aap'));
app.use('/api/reports',    require('./routes/reports'));
app.use('/api/alerts',     require('./routes/alerts'));
app.use('/api/dashboard',  require('./routes/dashboard'));
app.use('/api/public',     require('./routes/public'));

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// 404
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 RealDash server running on port ${PORT}`));
