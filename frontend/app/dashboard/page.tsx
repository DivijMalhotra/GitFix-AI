'use client';
import { useQuery } from '@tanstack/react-query';
import { reposApi, debugApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import Link from 'next/link';
import { GitBranch, Bug, GitPullRequest, Plus, ArrowRight, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: repos = [] } = useQuery({ queryKey: ['repos'], queryFn: reposApi.list });
  const { data: sessions = [] } = useQuery({ queryKey: ['sessions'], queryFn: debugApi.sessions });

  const indexedRepos = repos.filter((r: any) => r.indexStatus === 'indexed');
  const recentSessions = sessions.slice(0, 5);
  const prCreated = sessions.filter((s: any) => s.status === 'pr_created').length;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#e6edf3]">
          Good to see you, {user?.displayName?.split(' ')[0] || user?.username} 👋
        </h1>
        <p className="text-[#8b949e] text-sm mt-1">Here's your debugging workspace</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: GitBranch, label: 'Repositories', value: repos.length, sub: `${indexedRepos.length} indexed`, href: '/dashboard/repos' },
          { icon: Bug,       label: 'Debug Sessions', value: sessions.length, sub: 'total analyses', href: '/dashboard/debug' },
          { icon: GitPullRequest, label: 'Pull Requests', value: prCreated, sub: 'auto-generated', href: '/dashboard/debug' },
        ].map(({ icon: Icon, label, value, sub, href }) => (
          <Link key={label} href={href}
            className="card p-5 hover:border-[#58a6ff] transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#6e7681] uppercase tracking-wider">{label}</span>
              <Icon className="w-4 h-4 text-[#6e7681] group-hover:text-[#58a6ff] transition-colors" />
            </div>
            <div className="text-3xl font-bold text-[#e6edf3]">{value}</div>
            <div className="text-xs text-[#6e7681] mt-1">{sub}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#3fb950]" /> Quick Start
          </h2>
          {repos.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-[#8b949e]">Connect a GitHub repository to begin debugging.</p>
              <Link href="/dashboard/repos" className="btn-primary w-full justify-center">
                <Plus className="w-4 h-4" /> Connect Repository
              </Link>
            </div>
          ) : indexedRepos.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-[#8b949e]">Index a repository to enable AI debugging.</p>
              <Link href="/dashboard/repos" className="btn-secondary w-full justify-center">
                <ArrowRight className="w-4 h-4" /> Index a Repo
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[#8b949e]">Ready to debug. Submit a bug for AI analysis.</p>
              <Link href="/dashboard/debug/new" className="btn-primary w-full justify-center">
                <Bug className="w-4 h-4" /> New Debug Session
              </Link>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#58a6ff]" /> Recent Sessions
          </h2>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-[#6e7681]">No debug sessions yet.</p>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((s: any) => (
                <Link key={s._id} href={`/dashboard/debug/${s._id}`}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-[#21262d] transition-colors group">
                  <StatusBadge status={s.status} />
                  <span className="flex-1 text-xs text-[#8b949e] truncate group-hover:text-[#e6edf3]">
                    {s.title || s.errorMessage?.substring(0, 50)}
                  </span>
                  <span className="text-xs text-[#6e7681] shrink-0">
                    {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                  </span>
                </Link>
              ))}
              <Link href="/dashboard/debug" className="text-xs text-[#58a6ff] hover:underline block pt-1">
                View all sessions →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
