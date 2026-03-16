const mongoose = require('mongoose');

const repoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  githubRepoId: { type: Number, required: true },
  owner: { type: String, required: true },
  name: { type: String, required: true },
  fullName: { type: String, required: true },
  description: { type: String },
  language: { type: String },
  defaultBranch: { type: String, default: 'main' },
  isPrivate: { type: Boolean, default: false },
  clonePath: { type: String },
  indexedAt: { type: Date },
  indexStatus: {
    type: String,
    enum: ['pending', 'indexing', 'indexed', 'failed'],
    default: 'pending'
  },
  indexError: { type: String },
  fileCount: { type: Number, default: 0 },
  chunkCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

repoSchema.index({ userId: 1, fullName: 1 }, { unique: true });

module.exports = mongoose.model('Repository', repoSchema);
