import socketIo from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

let io = null;

// Инициализация Socket.io
export const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Middleware аутентификации
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: Token is required'));
      }

      // Верификация токена
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Поиск пользователя в БД
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Добавляем ID пользователя в сокет
      socket.userId = user._id.toString();
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Обработка подключений
  io.on('connection', (socket) => {
    console.log(`⚡️ New socket connection: ${socket.id} for user ${socket.userId}`);

    // Присоединяем сокет к комнате пользователя
    socket.join(socket.userId);

    // Обработка отключения
    socket.on('disconnect', () => {
      console.log(`🔥 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Получение экземпляра Socket.io
export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};