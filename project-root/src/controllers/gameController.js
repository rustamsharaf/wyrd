const mongoose = require('mongoose');
const Bet = require('../models/Bet');
const User = require('../models/User');
const GameRound = require('../models/GameRound');
const { io } = require('../socket');

async function getBetStats(roundId) {
  const bets = await Bet.find({ roundId, status: 'active' });
  const stats = {};
  bets.forEach(b => (stats[b.selectedBall] = (stats[b.selectedBall] || 0) + b.amount));
  return stats;
}

// --- ставка ---
exports.placeBet = async (req, res) => {
  const { ballNumber, amount, isSeriesBet = false, seriesId = null } = req.body;
  const maxBet = Number(process.env.MAX_BET || 50000);
  if (amount > maxBet) return res.status(400).json({ success: false, message: `Максимум ${maxBet}` });

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const user = await User.findById(req.user.id).session(session);
      if (!user || user.currency < amount) throw new Error('Недостаточно средств');

      const round = await GameRound.findOne({ status: 'betting' }).session(session);
      if (!round) throw new Error('Раунд не активен');

      const existing = await Bet.findOne({ userId: user._id, roundId: round._id }).session(session);
      if (existing) throw new Error('Вы уже поставили в этом раунде');

      await User.findByIdAndUpdate(user._id, { $inc: { currency: -amount } }).session(session);
      await Bet.create([{
        roundId: round._id,
        userId: user._id,
        selectedBall: ballNumber,
        amount,
        isSeriesBet,
        seriesId,
        status: 'active'
      }], { session });

      await GameRound.findByIdAndUpdate(round._id, { $inc: { totalBetAmount: amount } }).session(session);
      io.emit('betUpdate', await getBetStats(round._id));

      res.json({ success: true, betId: existing._id, newBalance: user.currency - amount });
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

// --- отмена ставки ---
exports.cancelBet = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const bet = await Bet.findById(req.params.id).session(session);
      if (!bet || bet.userId.toString() !== req.user.id) throw new Error('Ставка не найдена');
      if (bet.status !== 'active') throw new Error('Ставка уже отменена');

      const round = await GameRound.findById(bet.roundId).session(session);
      if (!round || round.status !== 'betting') throw new Error('Раунд закрыт');

      await User.findByIdAndUpdate(req.user.id, { $inc: { currency: bet.amount } }).session(session);
      await Bet.findByIdAndUpdate(bet._id, { status: 'canceled' }).session(session);
      await GameRound.findByIdAndUpdate(round._id, { $inc: { totalBetAmount: -bet.amount } }).session(session);

      io.emit('betUpdate', await getBetStats(round._id));
      res.json({ success: true, refundedAmount: bet.amount });
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};