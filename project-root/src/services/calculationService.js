const Bet = require('../models/Bet');
const User = require('../models/User');
const GameRound = require('../models/GameRound');
const { getIo } = require('../socket');

const COMMISSION = 0.10; // 10% комиссия

async function calculateResults(roundId, winningBall) {
  try {
    // Приводим winningBall к строке для сравнения
    const winningBallStr = winningBall.toString();
    
    // Находим все ставки для раунда
    const bets = await Bet.find({ round: roundId }).populate('user');
    const round = await GameRound.findById(roundId);

    // Разделяем ставки на выигрышные и проигрышные
    const winningBets = bets.filter(bet => bet.ballNumber === winningBallStr);
    const losingBets = bets.filter(bet => bet.ballNumber !== winningBallStr);

    // Рассчитываем общую сумму выигрышных ставок
    const totalWinningAmount = winningBets.reduce((sum, bet) => sum + bet.amount, 0);
    
    // Общая сумма всех ставок в раунде
    const totalRoundAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);

    // Выигрышный фонд (вся сумма ставок минус комиссия)
    const prizePool = totalRoundAmount * (1 - COMMISSION);

    // Обработка выигрышных ставок
    for (const bet of winningBets) {
      // Рассчитываем выигрыш по формуле
      const winAmount = totalWinningAmount > 0 
        ? prizePool * (bet.amount / totalWinningAmount)
        : 0;

      // Начисляем выигрыш
      const user = bet.user;
      user.currency += winAmount;
      user.ratingPoints += 10; // +10 очков рейтинга

      // Обновляем ставку
      bet.winAmount = winAmount;
      bet.isWin = true;
      await bet.save();
      await user.save();

      // Отправляем обновление баланса
      const io = getIo();
      if (io) {
        io.to(user._id.toString()).emit('balanceUpdate', { 
          currency: user.currency,
          rating: user.ratingPoints
        });
      }
    }

    // Обработка проигрышных ставок
    for (const bet of losingBets) {
      const user = bet.user;
      
      // Обновляем счетчик проигрышей
      user.consecutiveLosses = (user.consecutiveLosses || 0) + 1;
      
      // Если 3 проигрыша подряд
      if (user.consecutiveLosses >= 3) {
        user.ratingPoints = Math.max(0, user.ratingPoints - 1); // -1 очко рейтинга
        user.consecutiveLosses = 0; // Сброс счетчика
      }
      
      await user.save();
    }

    // Обработка джокера
    if (winningBall === 'joker') {
      // Джекпот = 10% от всех ставок (комиссия)
      const jackpot = totalRoundAmount * COMMISSION;
      
      // Распределяем джекпот между победителями поровну
      if (winningBets.length > 0) {
        const jackpotPerWinner = jackpot / winningBets.length;
        
        for (const bet of winningBets) {
          const user = bet.user;
          user.currency += jackpotPerWinner;
          await user.save();
          
          const io = getIo();
          if (io) {
            io.to(user._id.toString()).emit('balanceUpdate', { 
              currency: user.currency,
              jackpot: jackpotPerWinner
            });
          }
        }
      }
    }

    // Обновляем статус раунда
    round.winningBall = winningBallStr;
    round.status = 'completed';
    await round.save();

    // Оповещаем о результатах раунда
    const io = getIo();
    if (io) {
      io.emit('roundCompleted', { 
        roundId, 
        winningBall: winningBallStr,
        winners: winningBets.map(bet => ({
          userId: bet.user._id,
          amount: bet.winAmount
        }))
      });
    }

    console.log(`✅ Результаты раунда ${roundId} обработаны`);
    
  } catch (err) {
    console.error('Ошибка расчета результатов:', err);
  }
}

module.exports = {
  calculateResults
};