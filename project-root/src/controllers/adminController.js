const GameRound = require('../models/GameRound');
const { updateConfig } = require('../services/gameLoopService');

exports.updateConfig = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

  const { BETTING_PHASE, RESULT_PHASE, BREAK_PHASE, MAX_BET } = req.body;
  const newCfg = {
    BETTING_PHASE: BETTING_PHASE || Number(process.env.BETTING_PHASE),
    RESULT_PHASE:  RESULT_PHASE  || Number(process.env.RESULT_PHASE),
    BREAK_PHASE:   BREAK_PHASE   || Number(process.env.BREAK_PHASE),
    MAX_BET:       MAX_BET       || Number(process.env.MAX_BET)
  };

  updateConfig(newCfg);
  res.json({ success: true, config: newCfg });
};