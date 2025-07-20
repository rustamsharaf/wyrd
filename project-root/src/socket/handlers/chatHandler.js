// src/socket/handlers/chatHandler.js
import ChatMessage from '../../models/ChatMessage.js';
import User from '../../models/User.js';
import logger from '../../logger.js';

export const chatMessageHandler = async (socket, data) => {
  try {
    const user = await User.findById(socket.userId);
    if (!user || !user.countries) return;

    // Проверяем, что пользователь подписан на эту страну
    if (!user.countries.includes(data.country)) {
      logger.warn(`User ${user._id} tried to send message to unsubscribed country ${data.country}`);
      return;
    }

    // Сохраняем сообщение
    const message = new ChatMessage({
      user: user._id,
      country: data.country,
      text: data.text
    });
    await message.save();

    // Отправляем сообщение в комнату страны
    const io = socket.broadcast.to(`country_${data.country}`);
    io.emit('countryMessage', {
      id: message._id,
      userId: user._id,
      nickname: user.nickname,
      country: data.country,
      text: data.text,
      createdAt: new Date()
    });

    logger.info(`Chat message from ${user.nickname} in ${data.country}`);
  } catch (err) {
    logger.error(`Chat message error: ${err.message}`);
  }
};

export const getChatHistory = async (socket, country) => {
  try {
    const user = await User.findById(socket.userId);
    if (!user || !user.countries.includes(country)) return;

    const messages = await ChatMessage.find({ country })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('user', 'nickname')
      .lean();

    socket.emit('chatHistory', {
      country,
      messages: messages.reverse() // Самые новые внизу
    });
  } catch (err) {
    logger.error(`Get chat history error: ${err.message}`);
  }
};