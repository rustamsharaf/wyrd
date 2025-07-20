import express from 'express';
import rateLimit from 'express-rate-limit';
import { placeBet, getTimeStatus } from '../controllers/gameController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Лимитер для ставок: 20 запросов в минуту
const betLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 20,
  message: 'Слишком много запросов на ставки. Попробуйте позже.',
  skip: (req) => {
    // Админы не ограничены
    return req.user && req.user.role === 'admin';
  }
});

router.post('/bet', auth, betLimiter, placeBet);
router.get('/time', getTimeStatus);

export default router;