const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Bet = require('../models/Bet');
const User = require('../models/User');
const GameRound = require('../models/GameRound');
const { io } = require('../socket');
const jackpotService = require('../services/jackpotService');

exports.placeBet = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

  const { ballNumber, amount, isSeriesBet = false, seriesId = null } = req.body;
  const maxBet = Number(process.env.MAX_BET || 50000);

  if (amount > maxBet) return res.status(400).json({ success: false, message: `Максимальная ставка: ${maxBet}` });

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const user = await User.findById(req.user.id).session(session);
      if (!user) throw new Error('Пользователь не найден');
      if (user.currency < amount) throw new Error('Недостаточно средств');

      const round = await GameRound.findOne({ status: 'betting' }).session(session);
      if (!round) throw new Error('Раунд не активен');

      await User.findByIdAndUpdate(req.user.id, { $inc: { currency: -amount } }).session(session);
      const bet = await Bet.create([{
        roundId: round._id,
        userId: user._id,
        selectedBall: ballNumber,
        amount,
        isSeriesBet,
        seriesId
      }], { session });

      await GameRound.findByIdAndUpdate(round._id, { $inc: { totalBetAmount: amount } }).session(session);

      // Джекпот
      if (ballNumber === 'joker') await jackpotService.addToJackpot(amount);

      // WebSocket-обновление
      io.emit('betUpdate', await getBetStats(round._id));

      res.json({ success: true, betId: bet[0]._id, newBalance: user.currency - amount });
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

// вспомогательная
async function getBetStats(roundId) {
  const bets = await Bet.find({ roundId });
  const stats = {};
  bets.forEach(b => {
    stats[b.selectedBall] = (stats[b.selectedBall] || 0) + b.amount;
  });
  return stats;
}