import gameLoopService from '../services/gameLoopService.js';
import logger from '../logger.js';

export const updateConfig = async (req, res) => {
  try {
    // Проверка роли
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const { BETTING_PHASE, RESULT_PHASE, BREAK_PHASE, MAX_BET } = req.body;
    const newConfig = {};

    if (BETTING_PHASE) newConfig.BETTING_PHASE = parseInt(BETTING_PHASE);
    if (RESULT_PHASE) newConfig.RESULT_PHASE = parseInt(RESULT_PHASE);
    if (BREAK_PHASE) newConfig.BREAK_PHASE = parseInt(BREAK_PHASE);
    
    // Обновляем игровой цикл
    if (Object.keys(newConfig).length > 0) {
      gameLoopService.updateConfig(newConfig);
    }

    // Обновляем MAX_BET
    if (MAX_BET) {
      process.env.MAX_BET = MAX_BET;
    }

    logger.info('Конфигурация обновлена', { newConfig, admin: req.user._id });
    res.json({ success: true, message: 'Конфигурация обновлена' });
  } catch (err) {
    logger.error(`Ошибка обновления конфига: ${err.message}`, { admin: req.user?._id });
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};