import mongoose from 'mongoose';

const jackpotSchema = new mongoose.Schema({
  amount: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true,
  versionKey: false 
});

const Jackpot = mongoose.model('Jackpot', jackpotSchema);

export default Jackpot;