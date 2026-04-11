const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  point: { type: String, default: null }
});

const noteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const userStorySchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  status: {
    type: String,
    enum: ['pending', 'voting', 'revealed', 'done'],
    default: 'pending'
  },
  votes: [voteSchema],
  finalPoint: { type: String, default: null },
  owner: {
    userId: { type: String, default: null },
    userName: { type: String, default: null }
  },
  notes: [noteSchema],
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserStory', userStorySchema);
