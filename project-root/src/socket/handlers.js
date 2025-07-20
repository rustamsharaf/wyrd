import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';
import logger from '../logger.js';

export const chatMessageHandler = async (socket, data) => {
  try {
    const user = await User.findById(socket.userId);
    if (!user || !user.country) return;

    // Сохраняем сообщение
    const message = new ChatMessage({
      user: user._id,
      country: user.country,
      text: data.text
    });
    await message.save();

    // Отправляем только пользователям из той же страны
    const io = socket.broadcast.to(user.country);
    io.emit('chatMessage', {
      userId: user._id,
      nickname: user.nickname,
      country: user.country,
      text: data.text,
      createdAt: new Date()
    });

    logger.info(`Чат сообщение от ${user.nickname} в ${user.country}`);
  } catch (err) {
    logger.error(`Ошибка обработки сообщения: ${err.message}`, { userId: socket.userId });
  }
};

export const thankGuideHandler = async (socket, guideId) => {
  try {
    const user = await User.findById(socket.userId);
    const guide = await User.findById(guideId);
    
    if (!user || !guide) return;
    
    // Начисляем бонус гиду
    guide.ratingPoints += 5;
    await guide.save();
    
    // Отправляем уведомление гиду
    socket.to(guideId).emit('guideThanked', {
      userId: user._id,
      nickname: user.nickname,
      amount: 5
    });

    logger.info(`Гид ${guide.nickname} получил благодарность от ${user.nickname}`);
  } catch (err) {
    logger.error(`Ошибка благодарности гиду: ${err.message}`, { userId: socket.userId });
  }
};
const { io } = require('./index');
const User = require('../models/User');
const logger = require('../utils/logger');

module.exports = function setupSocketHandlers() {
  io.on('connection', socket => {
    logger.info(`Socket connected: ${socket.id}`);

    // Чат по странам
    socket.on('chatMessage', async ({ message, country }) => {
      const user = await User.findById(socket.userId);
      if (!user || user.country !== country) return;

      io.to(country).emit('chatMessage', {
        nickname: user.nickname,
        message,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => logger.info(`Socket ${socket.id} disconnected`));
  });
};