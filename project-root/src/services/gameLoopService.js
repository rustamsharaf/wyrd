const calculationService = require('./calculationService');
const { io } = require('../socket');   // подключаемся позже

const config = {
  BETTING_PHASE: 35_000,
  RESULT_PHASE:  10_000,
  BREAK_PHASE:   17_500,
  TOTAL_ROUND_TIME: 62_500,
};

let currentRound   = null;
let isBettingActive = false;
let gameInterval   = null;
let roundCounter   = 0;

function selectWinningBall() {
  return Math.random() < 0.05 ? 'joker' : String(Math.floor(Math.random() * 10));
}

function startGameLoop() {
  console.log('🔄 Игровой цикл запущен');
  runNewRound();
  gameInterval = setInterval(runNewRound, config.TOTAL_ROUND_TIME);
}

function stopGameLoop() {
  clearInterval(gameInterval);
  console.log('⏹️ Игровой цикл остановлен');
}

function runNewRound() {
  roundCounter++;
  currentRound = {
    id: `round-${Date.now()}-${roundCounter}`,
    startTime: new Date(),
    status: 'betting',
  };
  console.log(`🆕 Раунд ${currentRound.id} начат`);
  isBettingActive = true;

  setTimeout(() => {
    isBettingActive = false;
    console.log('⛔ Прием ставок завершен');

    setTimeout(() => {
      const winningBall = selectWinningBall();
      console.log(`🎱 Выигрышный шар: ${winningBall}`);
      calculationService.calculateResults(currentRound.id, winningBall);

      setTimeout(() => {
        console.log('⏸️ Перерыв перед следующим раундом');
      }, config.RESULT_PHASE);
    }, 100);
  }, config.BETTING_PHASE);
}

function updateConfig(newConfig) {
  Object.assign(config, newConfig);
  console.log('⚙️ Конфигурация обновлена:', config);
  stopGameLoop();
  startGameLoop();
}

function getTimeLeft() {
  if (!currentRound) return 0;
  const elapsed = Date.now() - currentRound.startTime;

  if (elapsed < config.BETTING_PHASE) {
    return Math.round((config.BETTING_PHASE - elapsed) / 1000);
  }
  if (elapsed < config.BETTING_PHASE + config.RESULT_PHASE) {
    return 0;
  }
  return Math.round((config.TOTAL_ROUND_TIME - elapsed) / 1000);
}

module.exports = {
  startGameLoop,
  stopGameLoop,
  updateConfig,
  getCurrentStatus: () => ({
    isBettingActive,
    currentRound,
    timeLeft: getTimeLeft(),
  }),
};