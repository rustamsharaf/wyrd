// src/controllers/gameController.js
import Joi from 'joi';
import Bet from '../models/Bet.js';
import User from '../models/User.js';
import GameRound from '../models/GameRound.js';
import { getIo } from '../socket.js';

// Схема валидации для ставки
const betSchema = Joi.object({
  ballNumber: Joi.string().valid('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'joker').required(),
  amount: Joi.number().integer().min(1).max(50000).required(),
  isSeriesBet: Joi.boolean().default(false),
  seriesId: Joi.when('isSeriesBet', {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.string().optional()
  })
});

// Максимальный лимит ставки
const MAX_BET_AMOUNT = 50000;

export const placeBet = async (req, res) => {
  try {
    const userId = req.user.id; // Предполагается, что в мидлваре auth мы сохранили user в req.user
    const { error, value } = betSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: error.details[0].message 
      });
    }

    const { ballNumber, amount, isSeriesBet, seriesId } = value;

    // Проверка максимального лимита
    if (amount > MAX_BET_AMOUNT) {
      return res.status(400).json({
        success: false,
        message: `Максимальная сумма ставки ${MAX_BET_AMOUNT}`
      });
    }

    // Получаем пользователя с актуальным балансом
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Проверяем баланс
    if (user.currency < amount) {
      return res.status(400).json({
        success: false,
        message: 'Недостаточно средств'
      });
    }

    // Получаем активный раунд
    const currentRound = await GameRound.findOne({ status: 'betting' });
    if (!currentRound) {
      return res.status(400).json({
        success: false,
        message: 'Прием ставок завершен'
      });
    }

    // Создаем ставку
    const bet = new Bet({
      user: userId,
      round: currentRound._id,
      ballNumber,
      amount,
      isSeriesBet,
      seriesId
    });

    // Списание средств
    user.currency -= amount;
    await user.save();
    
    // Сохраняем ставку
    await bet.save();

    // Обновляем общую сумму ставок в раунде
    currentRound.totalBetAmount = (currentRound.totalBetAmount || 0) + amount;
    
    // Обновляем сумму ставок по конкретному шару
    const betsByBall = currentRound.betsByBall || new Map();
    const currentBallAmount = betsByBall.get(ballNumber) || 0;
    betsByBall.set(ballNumber, currentBallAmount + amount);
    currentRound.betsByBall = betsByBall;
    
    await currentRound.save();

    // Рассчитываем распределение ставок в процентах
    const distribution = {};
    for (const [ball, ballAmount] of betsByBall.entries()) {
      distribution[ball] = parseFloat(((ballAmount / currentRound.totalBetAmount) * 100).toFixed(2));
    }

    // Отправляем обновление через сокет
    const io = getIo();
    if (io) {
      io.emit('betUpdate', {
        roundId: currentRound._id,
        totalBetAmount: currentRound.totalBetAmount,
        betsDistribution: distribution
      });
    }

    // Отправляем ответ
    res.status(200).json({
      success: true,
      betId: bet._id,
      newBalance: user.currency
    });

  } catch (err) {
    console.error('Ошибка при размещении ставки:', err);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};