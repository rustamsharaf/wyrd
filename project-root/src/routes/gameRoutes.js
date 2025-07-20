const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { placeBet, cancelBet } = require('../controllers/gameController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();
const betLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });

router.post(
  '/bet',
  auth,
  [
    body('ballNumber').isIn(['0','1','2','3','4','5','6','7','8','9','joker']),
    body('amount').isInt({ min: 1 })
  ],
  betLimiter,
  placeBet
);

router.delete('/bet/:id', auth, cancelBet);

module.exports = router;