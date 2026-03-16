'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { prApi } from '@/lib/api';
import { X, GitPullRequest, Loader2, GitBranch } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  sessionId: string;
  repoFullName: string;
  onClose: () => void;
  onSuccess: (url: string) => void;
}

export function CreatePRModal({ sessionId, repoFullName, onClose, onSuccess }: Props) {
  const [branchName, setBranchName] = useState(`ai-fix/${Date.now().toString(36)}`);
  const [prTitle, setPrTitle] = useState('');
  const [prBody, setPrBody] = useState('');

  const createMutation = useMutation({
    mutationFn: () => prApi.create({ sessionId, branchName, prTitle: prTitle || undefined, prBody: prBody || undefined }),
    onSuccess: (data) => onSuccess(data.pullRequestUrl),
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to create PR'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-lg mx-4 animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
          <h2 className="font-semibold flex items-center gap-2">
            <GitPullRequest className="w-4 h-4 text-[#3fb950]" /> Create Pull Request
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-[#1f3d5a] border border-[#1f6feb] rounded-md px-3 py-2 text-xs text-[#58a6ff]">
            Opening PR against <strong>{repoFullName}</strong>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[#6e7681]" /> Branch Name
            </label>
            <input
              className="input font-mono text-sm"
              value={branchName}
              onChange={e => setBranchName(e.target.value)}
              placeholder="ai-fix/my-branch"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">PR Title <span className="text-[#6e7681] font-normal">(optional)</span></label>
            <input
              className="input"
              value={prTitle}
              onChange={e => setPrTitle(e.target.value)}
              placeholder="fix: auto-generated AI patch"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">PR Description <span className="text-[#6e7681] font-normal">(optional)</span></label>
            <textarea
              className="input min-h-[100px] resize-y text-sm"
              value={prBody}
              onChange={e => setPrBody(e.target.value)}
              placeholder="Leave blank to use AI-generated description…"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-[#30363d]">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!branchName || createMutation.isPending}
            className="btn-primary"
          >
            {createMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
              : <><GitPullRequest className="w-4 h-4" /> Create Pull Request</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
