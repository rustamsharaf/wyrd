import Joi from 'joi';
import mongoose from 'mongoose';
import Bet from '../models/Bet.js';
import User from '../models/User.js';
import GameRound from '../models/GameRound.js';
import { getIo } from '../socket.js';
import gameLoopService from '../services/gameLoopService.js';
import logger from '../logger.js';

const betSchema = Joi.object({
  ballNumber: Joi.string().valid('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'joker').required(),
  amount: Joi.number().integer().min(1).required(),
  isSeriesBet: Joi.boolean().default(false),
  seriesId: Joi.when('isSeriesBet', {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.string().optional()
  })
});

export const placeBet = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const user = req.user;
    const { error, value } = betSchema.validate(req.body);
    
    if (error) {
      throw new Error(error.details[0].message);
    }

    const { ballNumber, amount, isSeriesBet, seriesId } = value;

    // Проверка лимита ставки
    if (amount > parseInt(process.env.MAX_BET)) {
      throw new Error(`Максимальная сумма ставки ${process.env.MAX_BET}`);
    }

    // Получаем актуального пользователя в сессии
    const freshUser = await User.findById(user._id).session(session);
    if (!freshUser) {
      throw new Error('Пользователь не найден');
    }

    if (freshUser.currency < amount) {
      throw new Error('Недостаточно средств');
    }

    // Поиск активного раунда
    const currentRound = await GameRound.findOne({ status: 'betting' }).session(session);
    if (!currentRound) {
      throw new Error('Прием ставок завершен');
    }

    // Создаем ставку
    const bet = new Bet({
      user: freshUser._id,
      round: currentRound._id,
      ballNumber,
      amount,
      isSeriesBet,
      seriesId
    });

    // Списание средств
    freshUser.currency -= amount;
    await freshUser.save({ session });

    // Сохраняем ставку
    await bet.save({ session });

    // Обновляем общую сумму ставок в раунде
    currentRound.totalBetAmount = (currentRound.totalBetAmount || 0) + amount;
    
    // Обновляем сумму ставок по конкретному шару
    const betsByBall = currentRound.betsByBall || new Map();
    const currentBallAmount = betsByBall.get(ballNumber) || 0;
    betsByBall.set(ballNumber, currentBallAmount + amount);
    currentRound.betsByBall = betsByBall;
    
    await currentRound.save({ session });

    // Фиксируем транзакцию
    await session.commitTransaction();
    session.endSession();

    // Рассчитываем распределение ставок в процентах
    const distribution = {};
    for (const [ball, ballAmount] of betsByBall.entries()) {
      distribution[ball] = parseFloat(((ballAmount / currentRound.totalBetAmount) * 100).toFixed(2));
    }

    // Отправляем обновление через сокет
    const io = getIo();
    io.emit('betUpdate', {
      roundId: currentRound._id,
      totalBetAmount: currentRound.totalBetAmount,
      betsDistribution: distribution
    });

    // Отправляем обновление баланса конкретному пользователю
    io.to(freshUser._id.toString()).emit('balanceUpdate', {
      currency: freshUser.currency
    });

    res.status(200).json({
      success: true,
      betId: bet._id,
      newBalance: freshUser.currency
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    logger.error(`Ошибка ставки: ${err.message}`, { userId: req.user?._id });
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

export const getTimeStatus = async (req, res) => {
  try {
    const status = gameLoopService.getCurrentStatus();
    
    res.json({
      timeLeft: status.timeLeft,
      status: status.isBettingActive ? 'betting' : 'break'
    });
  } catch (err) {
    logger.error(`Ошибка получения времени: ${err.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка получения статуса игры' 
    });
  }
};