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
import errorHandler from './src/middleware/errorHandler.js';
import logger from './src/logger.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Добавляем логгер в запросы
app.use((req, res, next) => {
  req.logger = logger;
  next();
});

// Подключение к базе данных
connectDB();

// Инициализация Socket.io
initSocket(server);

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);

// Обработчик ошибок
app.use(errorHandler);

// Старт сервера
server.listen(PORT, () => {
  logger.info(`🚀 Сервер запущен на порту ${PORT}`);
  
  // Запускаем обновление таблицы лидеров
  startLeaderboardUpdates();
  
  // Запуск игрового цикла
  if (process.env.ENABLE_GAME_LOOP === 'true') {
    import('./src/services/gameLoopService.js')
      .then(module => {
        module.startGameLoop();
        logger.info('Игровой цикл запущен');
      })
      .catch(err => logger.error('Ошибка запуска игрового цикла:', err));
  }
});