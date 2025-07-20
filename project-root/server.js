require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const { startGameLoop } = require('./src/services/gameLoopService');
const { initSocket, setupSocketHandlers } = require('./src/socket');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/game', require('./src/routes/gameRoutes'));
app.use('/api/store', require('./src/routes/storeRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));

// Socket & DB
connectDB();
const io = initSocket(server);
setupSocketHandlers(io);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
  startGameLoop();
});
// ... другие импорты ...
import socialRoutes from './src/routes/socialRoutes.js';

// ... конфигурация ...
app.use('/api/users', socialRoutes);
app.use('/api/admin', require('./src/routes/adminRoutes'));
// В server.js
import storeRoutes from './src/routes/storeRoutes.js';

// ... другие импорты ...
app.use('/api/store', storeRoutes);