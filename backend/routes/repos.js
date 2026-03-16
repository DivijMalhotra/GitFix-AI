const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const repoController = require('../controllers/repoController');

router.get('/', authenticate, repoController.listUserRepos);
router.get('/github', authenticate, repoController.listGithubRepos);
router.post('/connect', authenticate, repoController.connectRepo);
router.get('/:repoId', authenticate, repoController.getRepo);
router.post('/:repoId/index', authenticate, repoController.indexRepo);
router.get('/:repoId/status', authenticate, repoController.getIndexStatus);
router.delete('/:repoId', authenticate, repoController.deleteRepo);

module.exports = router;
