const { v4: uuidv4 } = require('uuid');
const Session = require('../models/Session');
const UserStory = require('../models/UserStory');

const createSession = async (req, res) => {
  try {
    const { name, adminName, role } = req.body;
    if (!name || !adminName) {
      return res.status(400).json({ message: 'Session name and admin name are required' });
    }
    const userId = uuidv4();
    const participantRole = role === 'sm' ? 'sm' : 'dev';
    const session = new Session({
      name,
      participants: [{ userId, name: adminName, isAdmin: true, role: participantRole }]
    });
    await session.save();
    res.status(201).json({ session, userId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSession = async (req, res) => {
  try {
    const { code } = req.params;
    const session = await Session.findOne({ code: code.toUpperCase() });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    const stories = await UserStory.find({ sessionId: session._id }).sort('order');
    res.json({ session, stories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const joinSession = async (req, res) => {
  try {
    const { code } = req.params;
    const { name, role } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const session = await Session.findOne({ code: code.toUpperCase() });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const userId = uuidv4();
    const participantRole = role === 'sm' ? 'sm' : 'dev';
    session.participants.push({ userId, name, isAdmin: false, role: participantRole });
    await session.save();

    const stories = await UserStory.find({ sessionId: session._id }).sort('order');
    res.json({ session, userId, stories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createSession, getSession, joinSession };
