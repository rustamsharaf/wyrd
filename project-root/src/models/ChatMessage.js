import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  country: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 200
  }
}, { 
  timestamps: true,
  versionKey: false 
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;