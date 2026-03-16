const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const debugSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  repoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository', required: true },
  title: { type: String },
  errorMessage: { type: String },
  stackTrace: { type: String },
  githubIssueUrl: { type: String },
  logs: { type: String },
  analysis: {
    rootCause: { type: String },
    explanation: { type: String },
    suggestedFix: { type: String },
    affectedFiles: [{ type: String }],
    confidence: { type: Number },
  },
  patch: { type: String },
  relevantChunks: [{
    filePath: { type: String },
    content: { type: String },
    score: { type: Number },
  }],
  messages: [messageSchema],
  pullRequestUrl: { type: String },
  pullRequestNumber: { type: Number },
  status: {
    type: String,
    enum: ['pending', 'analyzing', 'analyzed', 'pr_created', 'failed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('DebugSession', debugSessionSchema);
