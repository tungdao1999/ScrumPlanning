const express = require('express');
const router = express.Router();
const {
  addUserStory,
  getUserStories,
  updateUserStory,
  deleteUserStory
} = require('../controllers/userStoryController');

router.post('/', addUserStory);
router.get('/session/:sessionId', getUserStories);
router.put('/:id', updateUserStory);
router.delete('/:id', deleteUserStory);

module.exports = router;
