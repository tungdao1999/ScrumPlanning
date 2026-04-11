const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const participantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: true },
  // role: 'sm' = Scrum Master (manage stories/points, cannot vote)
  //        'dev' = Developer (can vote, no management by default)
  role: { type: String, enum: ['sm', 'dev'], default: 'dev' },
  // Granular permissions: 'create_story' | 'delete_story'
  permissions: { type: [String], default: [] }
});

const sessionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: {
    type: String,
    unique: true,
    default: () => uuidv4().slice(0, 6).toUpperCase()
  },
  participants: [participantSchema],
  currentStoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserStory',
    default: null
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'finished'],
    default: 'waiting'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', sessionSchema);
