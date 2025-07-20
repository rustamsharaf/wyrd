import socketIo from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import { chatMessageHandler, thankGuideHandler } from './socket/handlers.js';
import logger from './logger.js';

let io = null;

export const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: Token is required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Сокет подключен: ${socket.id} для пользователя ${socket.userId}`);

    // Присоединяем к комнате страны
    User.findById(socket.userId)
      .then(user => {
        if (user && user.country) {
          socket.join(user.country);
          logger.debug(`Пользователь ${user.nickname} присоединен к комнате ${user.country}`);
        }
      });

    // Обработчики событий
    socket.on('chatMessage', (data) => chatMessageHandler(socket, data));
    socket.on('thankGuide', (guideId) => thankGuideHandler(socket, guideId));

    socket.on('disconnect', () => {
      logger.info(`Сокет отключен: ${socket.id}`);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
// ... другие импорты ...
import { chatMessageHandler, getChatHistory } from './socket/handlers/chatHandler.js';

// В обработчике подключения
io.on('connection', (socket) => {
  // ... существующий код ...
  
  // Обработчики чата
  socket.on('chatMessage', (data) => chatMessageHandler(socket, data));
  socket.on('getChatHistory', (country) => getChatHistory(socket, country));
});