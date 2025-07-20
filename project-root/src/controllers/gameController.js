import Joi from 'joi';
import Bet from '../models/Bet.js';
import User from '../models/User.js';
import GameRound from '../models/GameRound.js';
import { getIo } from '../socket.js';

// Схема валидации
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

// Максимальная ставка
const MAX_BET_AMOUNT = 50000;

export const placeBet = async (req, res) => {
  try {
    const user = req.user;
    const { error, value } = betSchema.validate(req.body);
    
    // Валидация
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: error.details[0].message 
      });
    }

    const { ballNumber, amount, isSeriesBet, seriesId } = value;

    // Проверка лимита
    if (amount > MAX_BET_AMOUNT) {
      return res.status(400).json({
        success: false,
        message: `Maximum bet amount is ${MAX_BET_AMOUNT}`
      });
    }

    // Проверка баланса
    if (user.currency < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient funds'
      });
    }

    // Поиск активного раунда
    const currentRound = await GameRound.findOne({ status: 'betting' });
    if (!currentRound) {
      return res.status(400).json({
        success: false,
        message: 'Betting is closed for current round'
      });
    }

    // Создание ставки
    const bet = new Bet({
      user: user._id,
      round: currentRound._id,
      ballNumber,
      amount,
      isSeriesBet,
      seriesId
    });

    // Списание средств
    user.currency -= amount;
    await user.save();
    await bet.save();

    // Обновление данных раунда
    currentRound.totalBetAmount = (currentRound.totalBetAmount || 0) + amount;
    
    // Обновление ставок по шарам
    const betsByBall = currentRound.betsByBall || {};
    betsByBall[ballNumber] = (betsByBall[ballNumber] || 0) + amount;
    currentRound.betsByBall = betsByBall;
    
    await currentRound.save();

    // Расчет распределения ставок
    const distribution = {};
    Object.entries(betsByBall).forEach(([ball, ballAmount]) => {
      distribution[ball] = parseFloat(
        ((ballAmount / currentRound.totalBetAmount) * 100).toFixed(2)
    });

    // Отправка события обновления ставок
    const io = getIo();
    io.emit('betUpdate', {
      roundId: currentRound._id,
      totalBetAmount: currentRound.totalBetAmount,
      betsDistribution: distribution
    });

    // Отправка обновления баланса пользователю
    io.to(user._id.toString()).emit('balanceUpdate', {
      currency: user.currency
    });

    // Ответ клиенту
    res.status(200).json({
      success: true,
      betId: bet._id,
      newBalance: user.currency
    });

  } catch (err) {
    console.error('Bet placement error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};