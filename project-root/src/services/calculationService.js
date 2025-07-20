import Bet from '../models/Bet.js';
import User from '../models/User.js';
import GameRound from '../models/GameRound.js';
import Jackpot from '../models/Jackpot.js';
import { getIo } from '../socket.js';
import logger from '../logger.js';

const COMMISSION = parseFloat(process.env.CASINO_COMMISSION) || 0.10;

async function calculateResults(roundId, winningBall) {
  try {
    const winningBallStr = winningBall.toString();
    
    // Находим все ставки для раунда
    const bets = await Bet.find({ round: roundId }).populate('user');
    const round = await GameRound.findById(roundId);

    // Получаем джекпот
    let jackpot = await Jackpot.findOne();
    if (!jackpot) {
      jackpot = await Jackpot.create({ amount: 0 });
    }

    // Разделяем ставки
    const winningBets = bets.filter(bet => bet.ballNumber === winningBallStr);
    const losingBets = bets.filter(bet => bet.ballNumber !== winningBallStr);

    // Общая сумма всех ставок
    const totalRoundAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
    const prizePool = totalRoundAmount * (1 - COMMISSION);

    // Обработка джокера
    if (winningBall === 'joker') {
      // Распределение джекпота + призового пула
      const totalJokerBets = winningBets.reduce((sum, bet) => sum + bet.amount, 0);
      
      for (const bet of winningBets) {
        const winShare = totalJokerBets > 0 ? (bet.amount / totalJokerBets) : 0;
        const winAmount = prizePool * winShare + jackpot.amount * winShare;

        const user = bet.user;
        user.currency += winAmount;
        user.ratingPoints += 10;

        bet.winAmount = winAmount;
        bet.isWin = true;
        
        await bet.save();
        await user.save();

        // Отправка обновления баланса
        const io = getIo();
        io.to(user._id.toString()).emit('balanceUpdate', {
          currency: user.currency,
          rating: user.ratingPoints
        });
      }

      // Сбрасываем джекпот
      jackpot.amount = 0;
      await jackpot.save();
    } else {
      // Начисление выигрышей по обычному шару
      const totalWinningAmount = winningBets.reduce((sum, bet) => sum + bet.amount, 0);
      
      for (const bet of winningBets) {
        const winShare = totalWinningAmount > 0 ? (bet.amount / totalWinningAmount) : 0;
        const winAmount = prizePool * winShare;

        const user = bet.user;
        user.currency += winAmount;
        user.ratingPoints += 10;

        bet.winAmount = winAmount;
        bet.isWin = true;
        
        await bet.save();
        await user.save();

        // Отправка обновления баланса
        const io = getIo();
        io.to(user._id.toString()).emit('balanceUpdate', {
          currency: user.currency,
          rating: user.ratingPoints
        });
      }

      // Добавляем ставки на joker в джекпот
      const jokerBets = bets.filter(bet => bet.ballNumber === 'joker');
      const jokerAmount = jokerBets.reduce((sum, bet) => sum + bet.amount, 0);
      jackpot.amount += jokerAmount;
      await jackpot.save();
    }

    // Обработка проигрышных ставок
    for (const bet of losingBets) {
      const user = bet.user;
      user.consecutiveLosses = (user.consecutiveLosses || 0) + 1;
      
      if (user.consecutiveLosses >= 3) {
        user.ratingPoints = Math.max(0, user.ratingPoints - 1);
        user.consecutiveLosses = 0;
      }
      
      await user.save();
    }

    // Обновление раунда
    round.winningBall = winningBallStr;
    round.status = 'completed';
    await round.save();

    // Отправка результата раунда
    const io = getIo();
    io.emit('roundResult', {
      roundId,
      winningBall: winningBallStr,
      winners: winningBets.map(bet => ({
        userId: bet.user._id,
        amount: bet.winAmount
      }))
    });

    logger.info(`Результаты раунда ${roundId} обработаны`);
    
  } catch (err) {
    logger.error(`Ошибка расчета результатов: ${err.message}`, { roundId });
  }
}

export default {
  calculateResults
};