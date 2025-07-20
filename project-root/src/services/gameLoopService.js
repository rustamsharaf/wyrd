import GameRound from '../models/GameRound.js';
import calculationService from './calculationService.js';
import { getIo } from '../socket.js';
import logger from '../logger.js';

// Конфигурация по умолчанию
const config = {
  BETTING_PHASE: parseInt(process.env.BETTING_PHASE) || 35000,
  RESULT_PHASE: parseInt(process.env.RESULT_PHASE) || 10000,
  BREAK_PHASE: parseInt(process.env.BREAK_PHASE) || 17500,
  TOTAL_ROUND_TIME: function() {
    return this.BETTING_PHASE + this.RESULT_PHASE + this.BREAK_PHASE;
  }
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
  
  logger.info(`🆕 Начат новый раунд ${round._id}`);
  return round;
}

// Запуск игрового цикла
function startGameLoop() {
  logger.info('🔄 Игровой цикл запущен');
  runNewRound();
  
  gameInterval = setInterval(() => {
    runNewRound();
  }, config.TOTAL_ROUND_TIME());
}

// Остановка игрового цикла
function stopGameLoop() {
  clearInterval(gameInterval);
  logger.info('⏹️ Игровой цикл остановлен');
}

// Выбор победного шара
function selectWinningBall() {
  const random = Math.random();
  const jokerProb = parseFloat(process.env.JOKER_PROBABILITY) || 0.05;
  return random < jokerProb ? 'joker' : Math.floor(Math.random() * 10);
}

// Запуск нового раунда
async function runNewRound() {
  try {
    roundCounter++;
    logger.debug(`Запуск раунда ${roundCounter}`);
    
    // Создаем новый раунд
    const round = await createRound();
    
    // Фаза приема ставок
    setTimeout(async () => {
      isBettingActive = false;
      logger.info('⛔ Прием ставок завершен');
      
      // Фаза обработки результатов
      setTimeout(async () => {
        const winningBall = selectWinningBall();
        logger.info(`🎱 Выигрышный шар: ${winningBall}`);
        
        // Обновляем раунд
        await GameRound.findByIdAndUpdate(round._id, {
          winningBall,
          status: 'completed'
        });
        
        // Расчет результатов
        await calculationService.calculateResults(round._id, winningBall);
        
        // Фаза перерыва
        setTimeout(() => {
          logger.debug('⏸️ Перерыв перед следующим раундом');
        }, config.RESULT_PHASE);
      }, 100);
    }, config.BETTING_PHASE);
  } catch (err) {
    logger.error(`Ошибка игрового цикла: ${err.message}`);
  }
}

// Обновление конфигурации
function updateConfig(newConfig) {
  Object.assign(config, newConfig);
  logger.info('⚙️ Конфигурация обновлена', { newConfig });
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
  
  const now = new Date();
  const startTime = new Date(currentRound.startTime);
  const elapsed = now - startTime;
  
  let timeLeft = 0;
  let status = 'break';
  
  if (elapsed < config.BETTING_PHASE) {
    timeLeft = Math.floor((config.BETTING_PHASE - elapsed) / 1000);
    status = 'betting';
  } else if (elapsed < config.BETTING_PHASE + config.RESULT_PHASE) {
    timeLeft = 0;
    status = 'processing';
  } else {
    timeLeft = Math.floor((config.TOTAL_ROUND_TIME() - elapsed) / 1000);
    status = 'break';
  }
  
  return {
    isBettingActive: status === 'betting',
    currentRound,
    timeLeft,
    status
  };
}

export default {
  startGameLoop,
  stopGameLoop,
  updateConfig,
  getCurrentStatus
};
const cfg = {
  BETTING: Number(process.env.BETTING_PHASE || 35000),
  PROCESS: Number(process.env.RESULT_PHASE  || 10000),
  BREAK:   Number(process.env.BREAK_PHASE   || 17500)
};