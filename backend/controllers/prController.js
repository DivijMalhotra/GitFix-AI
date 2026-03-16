const { Octokit } = require('@octokit/rest');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const DebugSession = require('../models/DebugSession');
const Repository = require('../models/Repository');

// POST /api/pullrequests/create
exports.createPR = async (req, res, next) => {
  try {
    const { sessionId, branchName, prTitle, prBody } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const session = await DebugSession.findOne({ _id: sessionId, userId: req.user._id })
      .populate('repoId');
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!session.patch) return res.status(400).json({ error: 'No patch available for this session' });

    const repo = session.repoId;
    const octokit = new Octokit({ auth: req.user.githubAccessToken });

    // 1. Get the default branch SHA
    const { data: refData } = await octokit.git.getRef({
      owner: repo.owner,
      repo: repo.name,
      ref: `heads/${repo.defaultBranch}`,
    });
    const baseSha = refData.object.sha;

    // 2. Create new branch
    const newBranch = branchName || `ai-fix/${uuidv4().substring(0, 8)}`;
    await octokit.git.createRef({
      owner: repo.owner,
      repo: repo.name,
      ref: `refs/heads/${newBranch}`,
      sha: baseSha,
    });

    // 3. Apply patch — parse unified diff and update files via API
    const patchedFiles = await applyPatchViaAPI(octokit, repo, newBranch, session.patch, baseSha);

    if (patchedFiles.length === 0) {
      return res.status(400).json({ error: 'Patch could not be applied — no files modified' });
    }

    // 4. Open pull request
    const title = prTitle || `fix: ${session.title || session.errorMessage.substring(0, 60)}`;
    const body = prBody || buildPRBody(session);

    const { data: pr } = await octokit.pulls.create({
      owner: repo.owner,
      repo: repo.name,
      title,
      body,
      head: newBranch,
      base: repo.defaultBranch,
    });

    // 5. Update session
    session.pullRequestUrl = pr.html_url;
    session.pullRequestNumber = pr.number;
    session.status = 'pr_created';
    await session.save();

    res.json({
      pullRequestUrl: pr.html_url,
      pullRequestNumber: pr.number,
      branch: newBranch,
      filesChanged: patchedFiles,
    });
  } catch (err) { next(err); }
};

// GET /api/pullrequests/:sessionId
exports.getPRStatus = async (req, res, next) => {
  try {
    const session = await DebugSession.findOne({
      _id: req.params.sessionId, userId: req.user._id
    }).select('pullRequestUrl pullRequestNumber status');
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) { next(err); }
};

// ─── Helpers ──────────────────────────────────────────────

async function applyPatchViaAPI(octokit, repo, branch, patch, baseSha) {
  const modifiedFiles = [];

  // Parse unified diff patch
  const fileSections = patch.split(/^diff --git /m).filter(Boolean);

  for (const section of fileSections) {
    const fileMatch = section.match(/^a\/(.+?) b\/(.+?)$/m);
    if (!fileMatch) continue;
    const filePath = fileMatch[2];

    try {
      // Get current file content
      let currentContent = '';
      let fileSha = null;
      try {
        const { data: fileData } = await octokit.repos.getContent({
          owner: repo.owner,
          repo: repo.name,
          path: filePath,
          ref: branch,
        });
        currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
        fileSha = fileData.sha;
      } catch (e) {
        // New file
      }

      // Apply hunk patches
      const newContent = applyUnifiedDiff(currentContent, section);
      if (newContent === currentContent && currentContent !== '') continue;

      // Update file via GitHub API
      await octokit.repos.createOrUpdateFileContents({
        owner: repo.owner,
        repo: repo.name,
        path: filePath,
        message: `fix: apply AI-generated patch for ${filePath}`,
        content: Buffer.from(newContent).toString('base64'),
        branch,
        ...(fileSha && { sha: fileSha }),
      });

      modifiedFiles.push(filePath);
    } catch (e) {
      console.error(`Failed to apply patch to ${filePath}:`, e.message);
    }
  }

  return modifiedFiles;
}

function applyUnifiedDiff(original, diffSection) {
  const lines = original.split('\n');
  const hunks = diffSection.split(/^@@ /m).slice(1);

  let offset = 0;
  for (const hunk of hunks) {
    const headerMatch = hunk.match(/^-(\d+),?(\d*) \+(\d+),?(\d*) @@/);
    if (!headerMatch) continue;

    const origStart = parseInt(headerMatch[1]) - 1 + offset;
    const origCount = parseInt(headerMatch[2] || '1');

    const hunkLines = hunk.split('\n').slice(1);
    const removals = hunkLines.filter(l => l.startsWith('-')).length;
    const additions = hunkLines.filter(l => l.startsWith('+')).map(l => l.slice(1));
    const context = hunkLines.filter(l => l.startsWith(' ')).length;

    lines.splice(origStart, origCount, ...additions);
    offset += additions.length - origCount;
  }

  return lines.join('\n');
}

function buildPRBody(session) {
  return `## 🤖 AI-Generated Bug Fix

### Error
\`\`\`
${session.errorMessage}
\`\`\`

### Root Cause
${session.analysis?.rootCause || 'See analysis below'}

### Explanation
${session.analysis?.explanation || ''}

### Changes Made
${session.analysis?.suggestedFix || 'See patch diff'}

---
*This PR was automatically generated by [AI GitHub Debugging Assistant](https://github.com)*
`;
}
