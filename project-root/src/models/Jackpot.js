const mongoose = require('mongoose');

const jackpotSchema = new mongoose.Schema({
  pool: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Jackpot', jackpotSchema);