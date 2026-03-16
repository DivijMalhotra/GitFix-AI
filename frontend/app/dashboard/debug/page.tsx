'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debugApi } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Bug, Plus, Trash2, GitPullRequest, ChevronRight } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDistanceToNow } from 'date-fns';

export default function DebugSessionsPage() {
  const qc = useQueryClient();
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: debugApi.sessions,
    refetchInterval: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => debugApi.deleteSession(id),
    onSuccess: () => {
      toast.success('Session deleted');
      qc.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Debug Sessions</h1>
          <p className="text-sm text-[#8b949e] mt-1">AI bug analyses and generated patches</p>
        </div>
        <Link href="/dashboard/debug/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Session
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card p-4 animate-pulse h-20" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="card p-12 text-center">
          <Bug className="w-10 h-10 text-[#6e7681] mx-auto mb-4" />
          <h3 className="font-medium mb-2">No debug sessions yet</h3>
          <p className="text-sm text-[#6e7681] mb-4">Submit a bug to get AI-powered root cause analysis</p>
          <Link href="/dashboard/debug/new" className="btn-primary mx-auto">
            <Plus className="w-4 h-4" /> New Debug Session
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s: any) => (
            <div key={s._id} className="card hover:border-[#58a6ff] transition-colors group">
              <Link href={`/dashboard/debug/${s._id}`} className="flex items-center gap-4 p-4">
                <div className="w-9 h-9 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center shrink-0">
                  <Bug className="w-4 h-4 text-[#6e7681] group-hover:text-[#f85149] transition-colors" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={s.status} />
                    {s.pullRequestUrl && (
                      <span className="badge-green">
                        <GitPullRequest className="w-2.5 h-2.5" /> PR
                      </span>
                    )}
                    <span className="text-xs text-[#6e7681]">
                      {s.repoId?.fullName}
                    </span>
                  </div>
                  <p className="text-sm text-[#e6edf3] truncate">
                    {s.title || s.errorMessage?.substring(0, 80)}
                  </p>
                  {s.analysis?.rootCause && (
                    <p className="text-xs text-[#8b949e] truncate mt-0.5">{s.analysis.rootCause}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-[#6e7681]">
                    {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#6e7681] group-hover:text-[#e6edf3] transition-colors" />
                </div>
              </Link>

              <div className="border-t border-[#30363d] px-4 py-2 flex justify-end">
                <button
                  onClick={e => {
                    e.preventDefault();
                    if (confirm('Delete this session?')) deleteMutation.mutate(s._id);
                  }}
                  className="btn-ghost text-xs text-[#6e7681] hover:text-[#f85149]"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
