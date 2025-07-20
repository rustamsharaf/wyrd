const betSchema = new mongoose.Schema({
  // ... существующие поля
  isWin: {
    type: Boolean,
    default: false
  },
  winAmount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });