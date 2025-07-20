const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nickname: { type: String, unique: true, required: true, minlength: 4, maxlength: 16 },
  email:    { type: String, unique: true, required: true, lowercase: true },
  passwordHash: String,
  currency: { type: Number, default: 100 },
  ratingPoints: { type: Number, default: 0 },
  country: String
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);