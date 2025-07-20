import User from '../models/User.js';
import { getIo } from '../socket.js';

// Обновление таблицы лидеров
export const updateLeaderboard = async () => {
  try {
    // Получение топ-100 игроков
    const topPlayers = await User.find()
      .sort({ ratingPoints: -1 })
      .limit(100)
      .select('nickname ratingPoints country currency');
    
    // Отправка обновления
    const io = getIo();
    io.emit('leaderboardUpdate', topPlayers);
    
    console.log('🏆 Leaderboard updated');
  } catch (err) {
    console.error('Leaderboard update error:', err);
  }
};

// Запуск периодического обновления
export const startLeaderboardUpdates = () => {
  // Обновление каждые 5 минут
  setInterval(updateLeaderboard, 5 * 60 * 1000);
  
  // Первоначальное обновление
  updateLeaderboard();
};