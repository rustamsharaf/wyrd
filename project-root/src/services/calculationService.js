import Bet from '../models/Bet.js';
import User from '../models/User.js';
import GameRound from '../models/GameRound.js';
import { getIo } from '../socket.js';

const COMMISSION = 0.10; // 10% комиссия

async function calculateResults(roundId, winningBall) {
  try {
    const winningBallStr = winningBall.toString();
    
    // Поиск ставок для раунда
    const bets = await Bet.find({ round: roundId }).populate('user');
    const round = await GameRound.findById(roundId);

    // Разделение ставок
    const winningBets = bets.filter(bet => bet.ballNumber === winningBallStr);
    const losingBets = bets.filter(bet => bet.ballNumber !== winningBallStr);

    // Расчет сумм
    const totalWinningAmount = winningBets.reduce((sum, bet) => sum + bet.amount, 0);
    const totalRoundAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
    const prizePool = totalRoundAmount * (1 - COMMISSION);

    // Обработка выигрышных ставок
    for (const bet of winningBets) {
      const winAmount = totalWinningAmount > 0 
        ? prizePool * (bet.amount / totalWinningAmount)
        : 0;

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

    // Обработка джокера
    if (winningBall === 'joker') {
      const jackpot = totalRoundAmount * COMMISSION;
      
      if (winningBets.length > 0) {
        const jackpotPerWinner = jackpot / winningBets.length;
        
        for (const bet of winningBets) {
          const user = bet.user;
          user.currency += jackpotPerWinner;
          await user.save();
          
          const io = getIo();
          io.to(user._id.toString()).emit('balanceUpdate', {
            currency: user.currency,
            jackpot: jackpotPerWinner
          });
        }
      }
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

    console.log(`✅ Round ${roundId} results calculated`);
    
  } catch (err) {
    console.error('Calculation error:', err);
  }
}

export default {
  calculateResults
};