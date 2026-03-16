'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reposApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Search, GitBranch, Lock, Globe, RefreshCw, Check } from 'lucide-react';

interface Props { onClose: () => void; }

export function ConnectRepoModal({ onClose }: Props) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [connecting, setConnecting] = useState<string | null>(null);

  const { data: githubRepos = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['github-repos'],
    queryFn: reposApi.listGithub,
  });

  const { data: connectedRepos = [] } = useQuery({
    queryKey: ['repos'],
    queryFn: reposApi.list,
  });

  const connectedNames = new Set(connectedRepos.map((r: any) => r.fullName));

  const connectMutation = useMutation({
    mutationFn: ({ owner, name }: { owner: string; name: string }) =>
      reposApi.connect(owner, name),
    onSuccess: (_, { owner, name }) => {
      toast.success(`${owner}/${name} connected!`);
      qc.invalidateQueries({ queryKey: ['repos'] });
      setConnecting(null);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.error || 'Failed to connect');
      setConnecting(null);
    },
  });

  const filtered = githubRepos.filter((r: any) =>
    r.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-lg mx-4 flex flex-col max-h-[80vh] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
          <h2 className="font-semibold">Connect Repository</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[#30363d]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e7681]" />
            <input
              className="input pl-9"
              placeholder="Search your repositories…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-5 h-5 animate-spin text-[#6e7681]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-[#6e7681]">No repositories found</div>
          ) : (
            filtered.map((repo: any) => {
              const isConnected = connectedNames.has(repo.fullName);
              const isConnecting = connecting === repo.fullName;
              return (
                <div key={repo.githubRepoId}
                  className="flex items-center gap-3 p-3 rounded-md hover:bg-[#21262d] transition-colors">
                  {repo.isPrivate
                    ? <Lock className="w-4 h-4 text-[#6e7681] shrink-0" />
                    : <Globe className="w-4 h-4 text-[#6e7681] shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#e6edf3] truncate">{repo.fullName}</div>
                    {repo.description && (
                      <div className="text-xs text-[#6e7681] truncate">{repo.description}</div>
                    )}
                    {repo.language && (
                      <span className="text-xs text-[#8b949e]">{repo.language}</span>
                    )}
                  </div>
                  <button
                    disabled={isConnected || isConnecting}
                    onClick={() => {
                      setConnecting(repo.fullName);
                      connectMutation.mutate({ owner: repo.owner, name: repo.name });
                    }}
                    className={isConnected ? 'badge-green' : 'btn-secondary text-xs'}
                  >
                    {isConnected
                      ? <><Check className="w-3 h-3" /> Connected</>
                      : isConnecting
                        ? <><RefreshCw className="w-3 h-3 animate-spin" /> Connecting…</>
                        : 'Connect'
                    }
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-[#30363d] flex justify-end gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-ghost text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={onClose} className="btn-secondary text-xs">Done</button>
        </div>
      </div>
    </div>
  );
}
