const axios = require('axios');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: AI_ENGINE_URL,
  timeout: 120000, // 2 min for heavy ops
});

exports.indexRepository = async ({ repoId, owner, name, githubToken, defaultBranch }) => {
  const { data } = await client.post('/index', {
    repo_id: repoId,
    owner,
    name,
    github_token: githubToken,
    default_branch: defaultBranch,
  });
  return data;
};

exports.analyzeBug = async ({ sessionId, repoId, errorMessage, stackTrace, logs }) => {
  const { data } = await client.post('/analyze', {
    session_id: sessionId,
    repo_id: repoId,
    error_message: errorMessage,
    stack_trace: stackTrace,
    logs,
  });
  return data;
};

exports.chat = async ({ repoId, messages, context }) => {
  const { data } = await client.post('/chat', {
    repo_id: repoId,
    messages,
    context,
  });
  return data;
};

exports.deleteRepoIndex = async (repoId) => {
  const { data } = await client.delete(`/index/${repoId}`);
  return data;
};
