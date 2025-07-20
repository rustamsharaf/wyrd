const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    nickname: {
      type: String,
      required: [true, 'Никнейм обязателен'],
      unique: true,
      minlength: [4, 'Минимум 4 символа'],
      maxlength: [16, 'Максимум 16 символов'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email обязателен'],
      unique: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Укажите корректный email'],
    },
    passwordHash: {
      type: String,
      required: true,
    },
    currency: {
      type: Number,
      default: 100,
    },
    ratingPoints: {
      type: Number,
      default: 0,
    },
    country: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// --- индексы для быстрого поиска и уникальности
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ nickname: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);