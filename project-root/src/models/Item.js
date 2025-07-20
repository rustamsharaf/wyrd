import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  ratingRequired: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['backgrounds', 'effects', 'frames', 'bonuses']
  },
  iconUrl: {
    type: String,
    required: true
  },
  effect: {
    type: String,
    enum: ['currency', 'rating', 'feature'],
    default: 'feature'
  },
  effectValue: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number, // В минутах, 0 = вечный
    default: 0
  }
}, { timestamps: true });

export default mongoose.model('Item', itemSchema);