const { Octokit } = require('@octokit/rest');
const Repository = require('../models/Repository');
const aiService = require('../services/aiService');

const getOctokit = (user) => new Octokit({ auth: user.githubAccessToken });

// GET /api/repos — list connected repos for user
exports.listUserRepos = async (req, res, next) => {
  try {
    const repos = await Repository.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.json(repos);
  } catch (err) { next(err); }
};

// GET /api/repos/github — list all GitHub repos for user
exports.listGithubRepos = async (req, res, next) => {
  try {
    const octokit = getOctokit(req.user);
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated', per_page: 100, affiliation: 'owner,collaborator'
    });
    res.json(data.map(r => ({
      githubRepoId: r.id,
      owner: r.owner.login,
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      language: r.language,
      defaultBranch: r.default_branch,
      isPrivate: r.private,
      stars: r.stargazers_count,
      updatedAt: r.updated_at,
    })));
  } catch (err) { next(err); }
};

// POST /api/repos/connect
exports.connectRepo = async (req, res, next) => {
  try {
    const { owner, name } = req.body;
    if (!owner || !name) return res.status(400).json({ error: 'owner and name are required' });

    const octokit = getOctokit(req.user);
    const { data: ghRepo } = await octokit.repos.get({ owner, repo: name });

    const repo = await Repository.findOneAndUpdate(
      { userId: req.user._id, fullName: ghRepo.full_name },
      {
        userId: req.user._id,
        githubRepoId: ghRepo.id,
        owner: ghRepo.owner.login,
        name: ghRepo.name,
        fullName: ghRepo.full_name,
        description: ghRepo.description,
        language: ghRepo.language,
        defaultBranch: ghRepo.default_branch,
        isPrivate: ghRepo.private,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json(repo);
  } catch (err) { next(err); }
};

// GET /api/repos/:repoId
exports.getRepo = async (req, res, next) => {
  try {
    const repo = await Repository.findOne({ _id: req.params.repoId, userId: req.user._id });
    if (!repo) return res.status(404).json({ error: 'Repository not found' });
    res.json(repo);
  } catch (err) { next(err); }
};

// POST /api/repos/:repoId/index — clone & index repo
exports.indexRepo = async (req, res, next) => {
  try {
    const repo = await Repository.findOne({ _id: req.params.repoId, userId: req.user._id });
    if (!repo) return res.status(404).json({ error: 'Repository not found' });

    // Mark as indexing immediately
    repo.indexStatus = 'indexing';
    await repo.save();

    // Fire-and-forget async indexing
    aiService.indexRepository({
      repoId: repo._id.toString(),
      owner: repo.owner,
      name: repo.name,
      githubToken: req.user.githubAccessToken,
      defaultBranch: repo.defaultBranch,
    }).then(async (result) => {
      repo.indexStatus = 'indexed';
      repo.indexedAt = new Date();
      repo.fileCount = result.fileCount || 0;
      repo.chunkCount = result.chunkCount || 0;
      repo.clonePath = result.clonePath || '';
      await repo.save();
    }).catch(async (err) => {
      repo.indexStatus = 'failed';
      repo.indexError = err.message;
      await repo.save();
    });

    res.json({ message: 'Indexing started', status: 'indexing', repoId: repo._id });
  } catch (err) { next(err); }
};

// GET /api/repos/:repoId/status
exports.getIndexStatus = async (req, res, next) => {
  try {
    const repo = await Repository.findOne({ _id: req.params.repoId, userId: req.user._id })
      .select('indexStatus indexedAt indexError fileCount chunkCount');
    if (!repo) return res.status(404).json({ error: 'Repository not found' });
    res.json(repo);
  } catch (err) { next(err); }
};

// DELETE /api/repos/:repoId
exports.deleteRepo = async (req, res, next) => {
  try {
    const repo = await Repository.findOneAndDelete({ _id: req.params.repoId, userId: req.user._id });
    if (!repo) return res.status(404).json({ error: 'Repository not found' });
    // Optionally clean up vector DB
    await aiService.deleteRepoIndex(repo._id.toString()).catch(() => {});
    res.json({ message: 'Repository disconnected' });
  } catch (err) { next(err); }
};
