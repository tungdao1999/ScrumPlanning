const UserStory = require('../models/UserStory');

const addUserStory = async (req, res) => {
  try {
    const { sessionId, title, description } = req.body;
    if (!sessionId || !title) {
      return res.status(400).json({ message: 'sessionId and title are required' });
    }
    const count = await UserStory.countDocuments({ sessionId });
    const story = new UserStory({ sessionId, title, description, order: count });
    await story.save();
    res.status(201).json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserStories = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const stories = await UserStory.find({ sessionId }).sort('order');
    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUserStory = async (req, res) => {
  try {
    const { id } = req.params;
    const story = await UserStory.findByIdAndUpdate(id, req.body, { new: true });
    if (!story) return res.status(404).json({ message: 'User story not found' });
    res.json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUserStory = async (req, res) => {
  try {
    const { id } = req.params;
    await UserStory.findByIdAndDelete(id);
    res.json({ message: 'User story deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addUserStory, getUserStories, updateUserStory, deleteUserStory };
