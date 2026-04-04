'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reposApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { GitBranch, Plus, RefreshCw, Trash2, Database, Lock, Globe, Search } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConnectRepoModal } from '@/components/debug/ConnectRepoModal';
import { formatDistanceToNow } from 'date-fns';

export default function ReposPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: repos = [], isLoading } = useQuery({
    queryKey: ['repos'],
    queryFn: reposApi.list,
    refetchInterval: 5000, // poll for index status
  });

  const indexMutation = useMutation({
    mutationFn: (id: string) => reposApi.index(id),
    onSuccess: (_, id) => {
      toast.success('Indexing started');
      qc.invalidateQueries({ queryKey: ['repos'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to start indexing'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reposApi.delete(id),
    onSuccess: () => { toast.success('Repository disconnected'); qc.invalidateQueries({ queryKey: ['repos'] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to delete'),
  });

  const filtered = repos.filter((r: any) =>
    r.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Repositories</h1>
          <p className="text-sm text-[#8b949e] mt-1">Connect and index GitHub repositories for AI debugging</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4" /> Connect Repo
        </button>
      </div>

      {/* Search */}
      {repos.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e7681]" />
          <input
            className="input pl-9 w-full"
            placeholder="Filter repositories…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="card p-4 animate-pulse h-20 bg-[#161b22]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center">
          <GitBranch className="w-10 h-10 text-[#6e7681] mx-auto mb-4" />
          <h3 className="font-medium mb-2">No repositories connected</h3>
          <p className="text-sm text-[#6e7681] mb-4">Connect a GitHub repository to start AI debugging</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">
            <Plus className="w-4 h-4" /> Connect Repository
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((repo: any) => (
            <div key={repo._id} className="card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[#58a6ff] transition-colors">
              <div className="flex items-center gap-4 w-full sm:flex-1 overflow-hidden">
                <div className="w-9 h-9 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center shrink-0">
                  {repo.isPrivate ? <Lock className="w-4 h-4 text-[#6e7681]" /> : <Globe className="w-4 h-4 text-[#6e7681]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm text-[#58a6ff] truncate">{repo.fullName}</span>
                    {repo.language && (
                      <span className="badge-gray text-xs">{repo.language}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[#6e7681]">
                    <StatusBadge status={repo.indexStatus} />
                    {repo.indexedAt && (
                      <span>Indexed {formatDistanceToNow(new Date(repo.indexedAt), { addSuffix: true })}</span>
                    )}
                    {repo.fileCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        {repo.fileCount} files · {repo.chunkCount} chunks
                      </span>
                    )}
                    {repo.indexError && (
                      <span className="text-[#f85149]">{repo.indexError}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end mt-2 sm:mt-0 pt-3 border-t border-white/5 sm:border-t-0 sm:pt-0">
                <button
                  onClick={() => indexMutation.mutate(repo._id)}
                  disabled={repo.indexStatus === 'indexing' || indexMutation.isPending}
                  className="btn-secondary text-xs flex-1 sm:flex-none justify-center"
                  title="Re-index repository"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${repo.indexStatus === 'indexing' ? 'animate-spin' : ''}`} />
                  {repo.indexStatus === 'indexing' ? 'Indexing…' : repo.indexStatus === 'indexed' ? 'Re-index' : 'Index'}
                </button>
                <button
                  onClick={() => {
                    if (confirm('Disconnect this repository?')) deleteMutation.mutate(repo._id);
                  }}
                  className="btn-ghost text-[#f85149] hover:bg-[#3d1f1f] p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <ConnectRepoModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
