'use client';
import { useQuery } from '@tanstack/react-query';
import { reposApi, debugApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import Link from 'next/link';
import { 
  Database, Bug, GitPullRequest, Plus, 
  Search, Bell, Settings, Box, Code2, LayoutTemplate
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SessionIcon = ({ index }: { index: number }) => {
  const icons = [Box, Database, Code2, LayoutTemplate];
  const Icon = icons[index % icons.length];
  return (
    <div className="w-10 h-10 rounded bg-[#2a2e41] flex items-center justify-center shrink-0 shadow-inner overflow-hidden border border-white/[0.03]">
      <Icon className="w-[18px] h-[18px] text-[#8a92b2]" />
    </div>
  );
};

const Badge = ({ status }: { status: string }) => {
  switch (status) {
    case 'analyzed':
      return <span className="px-3 py-1 rounded-full bg-[#0bd9ab] text-[#064e43] text-[9px] font-extrabold tracking-widest uppercase shadow-sm">ANALYZED</span>;
    case 'pr_created':
      return <span className="px-3 py-1 rounded-full bg-[#b28cff] text-[#2b0e6e] text-[9px] font-extrabold tracking-widest uppercase shadow-sm">PR CREATED</span>;
    case 'failed':
      return <span className="px-3 py-1 rounded-full bg-[#cc0000] text-white text-[9px] font-extrabold tracking-widest uppercase shadow-sm">FAILED</span>;
    case 'pending':
      return <span className="px-3 py-1 rounded-full bg-[#3b82f6] text-white text-[9px] font-extrabold tracking-widest uppercase shadow-sm">PENDING</span>;
    default:
      return <span className="px-3 py-1 rounded-full bg-slate-600 text-slate-200 text-[9px] font-extrabold tracking-widest uppercase shadow-sm">{status.replace('_', ' ')}</span>;
  }
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: repos = [] } = useQuery({ queryKey: ['repos'], queryFn: reposApi.list });
  const { data: sessions = [] } = useQuery({ queryKey: ['sessions'], queryFn: debugApi.sessions });

  const recentSessions = sessions.slice(0, 5);
  const prCreated = sessions.filter((s: any) => s.status === 'pr_created').length;

  return (
    <div className="flex-1 flex flex-col p-8 max-w-6xl mx-auto w-full min-h-screen">
      
      {/* Top Header */}
      <header className="flex items-center justify-between mb-12">
        <h1 className="text-xl font-bold text-slate-100 tracking-wide">GitFix AI</h1>
      </header>

      {/* Main Greeting */}
      <div className="mb-10">
        <h2 className="text-[34px] font-bold text-white flex items-center gap-3 mb-2">
          Good to see you, {user?.displayName?.split(' ')[0] || user?.username} <span className="text-[32px]">👋</span>
        </h2>
        <p className="text-[#8a92b2] text-[15px] font-medium tracking-wide">Your AI debugging workspace is active and synced.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        {[
          { label: 'REPOSITORIES', value: repos.length, icon: Database, color: 'text-[#0bd9ab]' },
          { label: 'DEBUG SESSIONS', value: sessions.length, icon: Bug, color: 'text-[#0bd9ab]' },
          { label: 'PULL REQUESTS', value: prCreated, icon: GitPullRequest, color: 'text-[#0bd9ab]' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#1e2235] rounded-xl p-6 flex flex-col justify-between h-[120px] shadow-sm transform hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start">
              <span className="text-[40px] font-bold text-white leading-none">{value}</span>
              <Icon className={`w-[22px] h-[22px] ${color}`} />
            </div>
            <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">{label}</span>
          </div>
        ))}
      </div>

      {/* Bottom Layout (Quick Start + Recent Sessions) */}
      <div className="grid grid-cols-3 gap-8">
        
        {/* Quick Start Panel */}
        <div className="bg-[#1e2235] rounded-xl p-7 flex flex-col shrink-0">
          <h3 className="text-lg font-bold text-slate-100 mb-8 tracking-wide">Quick Start</h3>
          
          <div className="space-y-8 flex-1">
            <div className="flex gap-4">
              <div className="w-[30px] h-[30px] shrink-0 rounded-[10px] bg-[#143e40] text-[#0bd9ab] text-[13px] font-extrabold flex items-center justify-center">1</div>
              <div>
                <h4 className="text-sm font-bold text-slate-200 mb-1.5 leading-tight">New Debug Session</h4>
                <p className="text-[12px] text-[#8a92b2] leading-relaxed">Initiate a specialized AI diagnostic run on any existing codebase.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-[30px] h-[30px] shrink-0 rounded-[10px] bg-[#2a2e41] text-slate-400 text-[13px] font-extrabold flex items-center justify-center">2</div>
              <div>
                <h4 className="text-sm font-bold text-slate-200 mb-1.5 leading-tight">Paste your error message</h4>
                <p className="text-[12px] text-[#8a92b2] leading-relaxed">Input the stack trace or failing log to provide context for the debugger.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-[30px] h-[30px] shrink-0 rounded-[10px] bg-[#2a2e41] text-slate-400 text-[13px] font-extrabold flex items-center justify-center">2</div>
              <div>
                <h4 className="text-sm font-bold text-slate-200 mb-1.5 leading-tight">Get a fix + Auto PR</h4>
                <p className="text-[12px] text-[#8a92b2] leading-relaxed">AI generates a code patch and raises a GitHub Pull Request automatically — no manual effort needed.</p>
              </div>
            </div>
          </div>
          
          <Link href="/dashboard/debug/new" className="mt-10 w-full bg-[#8b79ff] hover:bg-[#9a8aff] text-white text-[13px] font-bold py-3.5 rounded-md flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(139,121,255,0.3)] uppercase tracking-wide">
            <Plus className="w-4 h-4" /> Start Debugging
          </Link>
        </div>

        {/* Recent Sessions */}
        <div className="col-span-2 flex flex-col pl-4">
          <div className="flex items-center justify-between mb-6 pt-1">
            <h3 className="text-[17px] font-bold text-slate-100 tracking-wide">Recent Sessions</h3>
            <Link href="/dashboard/debug" className="text-[11px] font-extrabold tracking-widest text-slate-300 hover:text-white transition-colors uppercase">
              VIEW ALL HISTORY
            </Link>
          </div>

          <div className="space-y-3.5">
            {recentSessions.map((s: any, idx: number) => (
              <div key={s._id} className="bg-[#1e2235] rounded-xl p-4 flex items-center gap-5 hover:bg-[#23283d] transition-all border border-transparent shadow-sm relative group cursor-pointer group/card">
                <SessionIcon index={idx} />
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-[15px] font-semibold text-slate-100 truncate group-hover/card:text-indigo-300 transition-colors">{s.title || s.errorMessage?.substring(0, 50) || 'Unknown Error'}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-[#8a92b2] font-bold">{s.repoId?.name || s.projectName || 'LUMINESCENT-UI'}</span>
                    <span className="text-[#8a92b2] text-[10px]">•</span>
                    <span className="text-[10px] uppercase tracking-[0.15em] text-[#8a92b2] font-bold">
                      {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true }).replace('about ', '')}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <Badge status={s.status} />
                </div>
                
                <Link href={`/dashboard/debug/${s._id}`} className="absolute inset-0" />
              </div>
            ))}
            
            {recentSessions.length === 0 && (
              <div className="bg-[#1e2235] rounded-xl p-8 flex items-center justify-center">
                <p className="text-[#8a92b2] text-sm tracking-wide">No recent sessions found. Start by throwing an error!</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
