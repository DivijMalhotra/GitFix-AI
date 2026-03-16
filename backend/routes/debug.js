const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const debugController = require('../controllers/debugController');

router.post('/analyze', authenticate, debugController.analyzeBug);
router.post('/chat', authenticate, debugController.chat);
router.get('/sessions', authenticate, debugController.listSessions);
router.get('/sessions/:sessionId', authenticate, debugController.getSession);
router.delete('/sessions/:sessionId', authenticate, debugController.deleteSession);
router.post('/issue', authenticate, debugController.analyzeIssue);

module.exports = router;
