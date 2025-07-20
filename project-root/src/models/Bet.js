const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  roundId:      { type: mongoose.Schema.Types.ObjectId, ref: 'GameRound', required: true },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  selectedBall: { type: String, required: true },
  amount:       { type: Number, required: true, min: 1 },
  isSeriesBet:  { type: Boolean, default: false },
  seriesId:     String,
  status:       { type: String, enum: ['active', 'canceled'], default: 'active' }
}, { timestamps: true });

// одна ставка на игрока в раунде
betSchema.index({ userId: 1, roundId: 1 }, { unique: true });

module.exports = mongoose.model('Bet', betSchema);