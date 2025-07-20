const gameRoundSchema = new mongoose.Schema({
  // ... существующие поля
  winningBall: {
    type: String
  }
}, { timestamps: true });