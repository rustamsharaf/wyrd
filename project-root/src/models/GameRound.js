const mongoose = require('mongoose');

const gameRoundSchema = new mongoose.Schema({
  startTime:       { type: Date,   required: true },
  endTime:         { type: Date,   required: true },
  status:          { type: String, enum: ['betting','processing','finished'], default: 'betting' },
  winningBall:     { type: String, enum: ['0','1','2','3','4','5','6','7','8','9','joker'], default: null },
  totalBetAmount:  { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('GameRound', gameRoundSchema);