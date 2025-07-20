import mongoose from 'mongoose';

const gameRoundSchema = new mongoose.Schema({
  startTime: { 
    type: Date, 
    required: true 
  },
  endTime: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['betting', 'processing', 'completed'], 
    default: 'betting'
  },
  winningBall: { 
    type: String 
  },
  totalBetAmount: { 
    type: Number, 
    default: 0 
  },
  betsByBall: {
    type: Map,
    of: Number,
    default: {}
  }
}, { 
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      // Преобразование Map в объект для JSON
      if (ret.betsByBall instanceof Map) {
        ret.betsByBall = Object.fromEntries(ret.betsByBall);
      } else if (ret.betsByBall && typeof ret.betsByBall === 'object') {
        // Уже объект, ничего не делаем
      } else {
        ret.betsByBall = {};
      }
      return ret;
    }
  }
});

const GameRound = mongoose.model('GameRound', gameRoundSchema);

export default GameRound;