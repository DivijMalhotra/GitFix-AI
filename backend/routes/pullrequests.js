const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const prController = require('../controllers/prController');

router.post('/create', authenticate, prController.createPR);
router.get('/:sessionId', authenticate, prController.getPRStatus);

module.exports = router;
