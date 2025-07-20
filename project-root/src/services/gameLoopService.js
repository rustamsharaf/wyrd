import GameRound from '../models/GameRound.js';
import calculationService from './calculationService.js';
import { getIo } from '../socket.js';

const config = {
  BETTING_PHASE: 35000,
  RESULT_PHASE: 10000,
  BREAK_PHASE: 17500,
  TOTAL_ROUND_TIME: 62500
};

let currentRound = null;
let isBettingActive = false;
let gameInterval = null;
let roundCounter = 0;

// Создание нового раунда
async function createRound() {
  const now = new Date();
  const endBettingTime = new Date(now.getTime() + config.BETTING_PHASE);
  
  const round = await GameRound.create({
    startTime: now,
    endTime: endBettingTime,
    status: 'betting',
    totalBetAmount: 0,
    betsByBall: {}
  });
  
  currentRound = round;
  isBettingActive = true;
  
  // Отправляем событие о новом раунде
  const io = getIo();
  io.emit('newRound', {
    roundId: round._id,
    startTime: round.startTime,
    endTime: round.endTime,
    status: round.status
  });
  
  return round;
}

// Запуск игрового цикла
function startGameLoop() {
  console.log('🔄 Game loop started');
  runNewRound();
  
  gameInterval = setInterval(() => {
    runNewRound();
  }, config.TOTAL_ROUND_TIME);
}

// Остановка игрового цикла
function stopGameLoop() {
  clearInterval(gameInterval);
  console.log('⏹️ Game loop stopped');
}

// Выбор победного шара
function selectWinningBall() {
  const random = Math.random();
  return random < 0.05 ? 'joker' : Math.floor(Math.random() * 10);
}

// Запуск нового раунда
async function runNewRound() {
  try {
    roundCounter++;
    console.log(`🆕 Starting round ${roundCounter}`);
    
    // Создаем новый раунд
    const round = await createRound();
    
    // Фаза приема ставок
    setTimeout(async () => {
      isBettingActive = false;
      console.log('⛔ Betting phase ended');
      
      // Фаза обработки результатов
      setTimeout(async () => {
        const winningBall = selectWinningBall();
        console.log(`🎱 Winning ball: ${winningBall}`);
        
        // Обновляем раунд
        await GameRound.findByIdAndUpdate(round._id, {
          winningBall,
          status: 'completed'
        });
        
        // Расчет результатов
        await calculationService.calculateResults(round._id, winningBall);
        
        // Фаза перерыва
        setTimeout(() => {
          console.log('⏸️ Break before next round');
        }, config.RESULT_PHASE);
      }, 100);
    }, config.BETTING_PHASE);
  } catch (err) {
    console.error('Game loop error:', err);
  }
}

// Обновление конфигурации
function updateConfig(newConfig) {
  Object.assign(config, newConfig);
  console.log('⚙️ Config updated:', config);
  stopGameLoop();
  startGameLoop();
}

// Получение текущего статуса
function getCurrentStatus() {
  if (!currentRound) {
    return {
      isBettingActive: false,
      currentRound: null,
      timeLeft: 0
    };
  }
  
  const elapsed = Date.now() - currentRound.startTime;
  let timeLeft = 0;
  
  if (elapsed < config.BETTING_PHASE) {
    timeLeft = Math.round((config.BETTING_PHASE - elapsed) / 1000);
  } else if (elapsed < config.BETTING_PHASE + config.RESULT_PHASE) {
    timeLeft = 0;
  } else {
    timeLeft = Math.round((config.TOTAL_ROUND_TIME - elapsed) / 1000);
  }
  
  return {
    isBettingActive,
    currentRound,
    timeLeft
  };
}

export default {
  startGameLoop,
  stopGameLoop,
  updateConfig,
  getCurrentStatus
};