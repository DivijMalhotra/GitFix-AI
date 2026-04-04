'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { reposApi, debugApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Bug, Link2, FileText, Terminal, ChevronDown, Loader2 } from 'lucide-react';

type Mode = 'error' | 'issue';

export default function NewDebugPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('error');
  const [repoId, setRepoId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [stackTrace, setStackTrace] = useState('');
  const [logs, setLogs] = useState('');
  const [issueUrl, setIssueUrl] = useState('');

  const { data: repos = [] } = useQuery({
    queryKey: ['repos'],
    queryFn: reposApi.list,
  });

  const indexedRepos = repos.filter((r: any) => r.indexStatus === 'indexed');

  const analyzeMutation = useMutation({
    mutationFn: () => {
      if (mode === 'issue') {
        return debugApi.analyzeIssue(repoId, issueUrl);
      }
      return debugApi.analyze({ repoId, errorMessage, stackTrace, logs });
    },
    onSuccess: (data) => {
      toast.success('Analysis started!');
      router.push(`/dashboard/debug/${data.sessionId}`);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Analysis failed'),
  });

  const canSubmit = repoId && (mode === 'issue' ? issueUrl : errorMessage);

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">New Debug Session</h1>
        <p className="text-sm text-[#8b949e] mt-1">Submit a bug for AI-powered root cause analysis</p>
      </div>

      {/* Repo selector */}
      <div className="card p-5 space-y-3">
        <label className="text-sm font-medium text-[#e6edf3] flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#3fb950]" /> Repository
        </label>
        {indexedRepos.length === 0 ? (
          <div className="text-sm text-[#f85149] bg-[#3d1f1f] border border-[#b62324] rounded-md px-3 py-2">
            No indexed repositories. Go to{' '}
            <a href="/dashboard/repos" className="underline">Repositories</a> to connect and index one first.
          </div>
        ) : (
          <div className="relative">
            <select
              className="input appearance-none pr-8 bg-[#0d1117] text-[#e6edf3] w-full"
              value={repoId}
              onChange={e => setRepoId(e.target.value)}
            >
              <option value="" className="bg-[#0d1117] text-[#e6edf3]">Select a repository…</option>
              {indexedRepos.map((r: any) => (
                <option key={r._id} value={r._id} className="bg-[#0d1117] text-[#e6edf3]">{r.fullName}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e7681] pointer-events-none" />
          </div>
        )}
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-[#0d1117] border border-[#30363d] rounded-lg w-full sm:w-fit overflow-x-auto">
        {[
          { id: 'error', icon: Terminal, label: 'Error / Stack Trace' },
          { id: 'issue', icon: Link2,    label: 'GitHub Issue URL' },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setMode(id as Mode)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm transition-all whitespace-nowrap ${
              mode === id
                ? 'bg-[#21262d] text-[#e6edf3] font-medium'
                : 'text-[#8b949e] hover:text-[#e6edf3]'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {mode === 'error' ? (
        <div className="space-y-4">
          <div className="card p-4 sm:p-5 space-y-3">
            <label className="text-sm font-medium text-[#e6edf3]">
              Error Message <span className="text-[#f85149]">*</span>
            </label>
            <textarea
              className="input min-h-[80px] font-mono text-xs resize-y"
              placeholder="TypeError: Cannot read properties of undefined (reading 'id')"
              value={errorMessage}
              onChange={e => setErrorMessage(e.target.value)}
            />
          </div>

          <div className="card p-4 sm:p-5 space-y-3">
            <label className="text-sm font-medium text-[#e6edf3]">Stack Trace</label>
            <textarea
              className="input min-h-[160px] font-mono text-xs resize-y"
              placeholder={`at Object.<anonymous> (/app/api/users.js:42:18)\nat Module._compile (node:internal/modules/cjs/loader:1364:14)\n...`}
              value={stackTrace}
              onChange={e => setStackTrace(e.target.value)}
            />
          </div>

          <div className="card p-4 sm:p-5 space-y-3">
            <label className="text-sm font-medium text-[#e6edf3]">Logs <span className="text-[#6e7681] font-normal">(optional)</span></label>
            <textarea
              className="input min-h-[100px] font-mono text-xs resize-y"
              placeholder="Paste relevant log output here…"
              value={logs}
              onChange={e => setLogs(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="card p-4 sm:p-5 space-y-3">
          <label className="text-sm font-medium text-[#e6edf3]">
            GitHub Issue URL <span className="text-[#f85149]">*</span>
          </label>
          <input
            className="input w-full"
            placeholder="https://github.com/owner/repo/issues/123"
            value={issueUrl}
            onChange={e => setIssueUrl(e.target.value)}
          />
          <p className="text-xs text-[#6e7681]">
            The AI will fetch the issue title and body to analyze the bug.
          </p>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 mt-6 pt-4 border-t border-white/5">
        <a href="/dashboard/debug" className="btn-secondary w-full sm:w-auto justify-center">Cancel</a>
        <button
          className="btn-primary px-6 w-full sm:w-auto justify-center"
          disabled={!canSubmit || analyzeMutation.isPending}
          onClick={() => analyzeMutation.mutate()}
        >
          {analyzeMutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
          ) : (
            <><Bug className="w-4 h-4" /> Analyze Bug</>
          )}
        </button>
      </div>
    </div>
  );
}
