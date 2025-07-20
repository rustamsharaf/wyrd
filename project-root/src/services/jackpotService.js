const Jackpot = require('../models/Jackpot');
const Bet = require('../models/Bet');

async function addToJackpot(amount) {
  await Jackpot.findOneAndUpdate({}, { $inc: { pool: amount } }, { upsert: true });
}

async function splitJackpot(winners, totalPool) {
  const jackpot = await Jackpot.findOne();
  const prize = (jackpot?.pool || 0) + totalPool;
  await Jackpot.updateOne({}, { $set: { pool: 0 } });
  return prize;
}

module.exports = { addToJackpot, splitJackpot };