const express = require('express');
const router = express.Router();
const { createSession, getSession, joinSession } = require('../controllers/sessionController');

router.post('/', createSession);
router.get('/:code', getSession);
router.post('/:code/join', joinSession);

module.exports = router;
