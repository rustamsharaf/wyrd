import calculationService from './calculationService.js';

// Конфигурация таймингов (в миллисекундах)
const config = {
  BETTING_PHASE: 35000,     // 35 секунд на ставки (30-40 сек)
  RESULT_PHASE: 10000,       // 10 секунд на обработку
  BREAK_PHASE: 17500,        // 17.5 секунд перерыв (15-20 сек)
  TOTAL_ROUND_TIME: 62500    // Общее время раунда (60 сек)
};

let currentRound = null;
let isBettingActive = false;
let gameInterval = null;
let roundCounter = 0;

// Основной игровой цикл
function startGameLoop() {
  console.log('🔄 Игровой цикл запущен');
  runNewRound();
  
  gameInterval = setInterval(() => {
    runNewRound();
  }, config.TOTAL_ROUND_TIME);
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
    status: 'betting'
  };
  
  console.log(`🆕 Раунд ${currentRound.id} начат`);
  isBettingActive = true;
  
  // Фаза приема ставок
  setTimeout(() => {
    isBettingActive = false;
    console.log('⛔ Прием ставок завершен');
    
    // Фаза определения результата
    setTimeout(() => {
      const winningBall = selectWinningBall();
      console.log(`🎱 Выигрышный шар: ${winningBall}`);
      
      // Обработка результатов
      calculationService.calculateResults(currentRound.id, winningBall);
      
      // Фаза перерыва
      setTimeout(() => {
        console.log('⏸️ Перерыв перед следующим раундом');
      }, config.RESULT_PHASE);
    }, 100);
  }, config.BETTING_PHASE);
}

function selectWinningBall() {
  const random = Math.random();
  if (random < 0.05) {  // 5% вероятность joker
    return 'joker';
  }
  return Math.floor(Math.random() * 10); // Числа 0-9
}

// Обновление конфигурации из админки
function updateConfig(newConfig) {
  Object.assign(config, newConfig);
  console.log('⚙️ Конфигурация обновлена:', config);
  
  // Перезапускаем цикл с новыми настройками
  stopGameLoop();
  startGameLoop();
}

export default {
  startGameLoop,
  stopGameLoop,
  updateConfig,
  getCurrentStatus: () => ({
    isBettingActive,
    currentRound,
    timeLeft: getTimeLeft()
  })
};

// Вспомогательная функция для UI
function getTimeLeft() {
  if (!currentRound) return 0;
  const elapsed = Date.now() - currentRound.startTime;
  
  if (elapsed < config.BETTING_PHASE) {
    return Math.round((config.BETTING_PHASE - elapsed) / 1000);
  } 
  if (elapsed < config.BETTING_PHASE + config.RESULT_PHASE) {
    return 0; // Ставки закрыты
  }
  return Math.round((config.TOTAL_ROUND_TIME - elapsed) / 1000);
}