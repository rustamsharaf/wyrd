const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/authMiddleware');
const { updateConfig } = require('../controllers/adminController');

router.put(
  '/config',
  auth,
  [
    body('BETTING_PHASE').optional().isInt({ min: 1000 }),
    body('RESULT_PHASE').optional().isInt({ min: 1000 }),
    body('BREAK_PHASE').optional().isInt({ min: 1000 }),
    body('MAX_BET').optional().isInt({ min: 1 })
  ],
  updateConfig
);

module.exports = router;