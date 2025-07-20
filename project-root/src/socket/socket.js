import socketIo from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

let io = null;

// Инициализация Socket.io
export const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "*", // Настройте под свой домен в продакшене
      methods: ["GET", "POST"]
    }
  });

  // Аутентификация подключений
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Требуется аутентификация'));
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Недействительный токен'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`⚡️ Сокет подключен: ${socket.id} (Пользователь: ${socket.userId})`);
    
    // Присоединяем пользователя к своей комнате
    socket.join(socket.userId);
    
    socket.on('disconnect', () => {
      console.log(`🔌 Сокет отключен: ${socket.id}`);
    });
  });

  return io;
};

// Получение экземпляра Socket.io
export const getIo = () => {
  if (!io) throw new Error('Socket.io не инициализирован');
  return io;
};