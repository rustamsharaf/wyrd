// models/GameRound.js
import mongoose from 'mongoose';

const gameRoundSchema = new mongoose.Schema({
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['betting', 'processing', 'completed'], 
    default: 'betting'
  },
  winningBall: { type: String },
  totalBetAmount: { type: Number, default: 0 },
  betsByBall: {
    type: Map,
    of: Number,
    default: {}
  }
}, { timestamps: true });

export default mongoose.model('GameRound', gameRoundSchema);