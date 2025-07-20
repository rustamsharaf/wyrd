import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initSocket } from './src/socket.js';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import gameRoutes from './src/routes/gameRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import { startLeaderboardUpdates } from './src/services/leaderboardService.js';

// Загрузка переменных окружения
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Подключение к базе данных
connectDB();

// Инициализация Socket.io
initSocket(server);

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);

// Старт сервера
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Запускаем обновление таблицы лидеров
  startLeaderboardUpdates();
  
  // Опционально: запуск игрового цикла
  if (process.env.ENABLE_GAME_LOOP === 'true') {
    import('./src/services/gameLoopService.js')
      .then(module => module.startGameLoop())
      .catch(err => console.error('Failed to start game loop:', err));
  }
});