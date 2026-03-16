const axios = require('axios');
const { Octokit } = require('@octokit/rest');
const DebugSession = require('../models/DebugSession');
const Repository = require('../models/Repository');
const aiService = require('../services/aiService');

// POST /api/debug/analyze
exports.analyzeBug = async (req, res, next) => {
  try {
    const { repoId, errorMessage, stackTrace, githubIssueUrl, logs } = req.body;
    if (!repoId || !errorMessage) {
      return res.status(400).json({ error: 'repoId and errorMessage are required' });
    }

    const repo = await Repository.findOne({ _id: repoId, userId: req.user._id });
    if (!repo) return res.status(404).json({ error: 'Repository not found' });
    if (repo.indexStatus !== 'indexed') {
      return res.status(400).json({ error: 'Repository must be indexed before debugging' });
    }

    // Create session
    const session = await DebugSession.create({
      userId: req.user._id,
      repoId: repo._id,
      title: errorMessage.substring(0, 80),
      errorMessage,
      stackTrace,
      githubIssueUrl,
      logs,
      status: 'analyzing',
    });

    // Fire-and-forget analysis
    aiService.analyzeBug({
      sessionId: session._id.toString(),
      repoId: repo._id.toString(),
      errorMessage,
      stackTrace,
      logs,
    }).then(async (result) => {
      session.analysis = result.analysis;
      session.patch = result.patch;
      session.relevantChunks = result.relevantChunks;
      session.status = 'analyzed';
      session.messages.push({
        role: 'assistant',
        content: `**Root Cause:** ${result.analysis.rootCause}\n\n${result.analysis.explanation}`,
      });
      await session.save();
    }).catch(async (err) => {
      session.status = 'failed';
      await session.save();
    });

    res.json({ sessionId: session._id, status: 'analyzing' });
  } catch (err) { next(err); }
};

// POST /api/debug/chat
exports.chat = async (req, res, next) => {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    const session = await DebugSession.findOne({ _id: sessionId, userId: req.user._id })
      .populate('repoId');
    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.messages.push({ role: 'user', content: message });

    const result = await aiService.chat({
      repoId: session.repoId._id.toString(),
      messages: session.messages.map(m => ({ role: m.role, content: m.content })),
      context: {
        errorMessage: session.errorMessage,
        analysis: session.analysis,
        patch: session.patch,
      },
    });

    session.messages.push({ role: 'assistant', content: result.response });
    await session.save();

    res.json({ response: result.response, sessionId });
  } catch (err) { next(err); }
};

// GET /api/debug/sessions
exports.listSessions = async (req, res, next) => {
  try {
    const sessions = await DebugSession.find({ userId: req.user._id })
      .populate('repoId', 'fullName owner name')
      .select('-messages -relevantChunks -patch')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(sessions);
  } catch (err) { next(err); }
};

// GET /api/debug/sessions/:sessionId
exports.getSession = async (req, res, next) => {
  try {
    const session = await DebugSession.findOne({
      _id: req.params.sessionId, userId: req.user._id
    }).populate('repoId', 'fullName owner name defaultBranch');
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) { next(err); }
};

// DELETE /api/debug/sessions/:sessionId
exports.deleteSession = async (req, res, next) => {
  try {
    await DebugSession.findOneAndDelete({ _id: req.params.sessionId, userId: req.user._id });
    res.json({ message: 'Session deleted' });
  } catch (err) { next(err); }
};

// POST /api/debug/issue — analyze from GitHub issue URL
exports.analyzeIssue = async (req, res, next) => {
  try {
    const { repoId, issueUrl } = req.body;
    if (!repoId || !issueUrl) {
      return res.status(400).json({ error: 'repoId and issueUrl are required' });
    }

    const repo = await Repository.findOne({ _id: repoId, userId: req.user._id });
    if (!repo) return res.status(404).json({ error: 'Repository not found' });

    // Parse issue URL: https://github.com/owner/repo/issues/123
    const match = issueUrl.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
    if (!match) return res.status(400).json({ error: 'Invalid GitHub issue URL' });

    const [, owner, repoName, issueNumber] = match;
    const octokit = new Octokit({ auth: req.user.githubAccessToken });
    const { data: issue } = await octokit.issues.get({
      owner, repo: repoName, issue_number: parseInt(issueNumber)
    });

    // Combine issue title + body as the error message
    const errorMessage = `${issue.title}\n\n${issue.body || ''}`;

    req.body = { repoId, errorMessage, githubIssueUrl: issueUrl };
    return exports.analyzeBug(req, res, next);
  } catch (err) { next(err); }
};
