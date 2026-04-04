'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import {
  LayoutDashboard, Database, Bug, User, LogOut
} from 'lucide-react';
import { clsx } from 'clsx';

const NAV = [
  { href: '/dashboard',         icon: LayoutDashboard, label: 'OVERVIEW'      },
  { href: '/dashboard/repos',   icon: Database,        label: 'REPOSITORIES'  },
  { href: '/dashboard/debug',   icon: Bug,             label: 'DEBUG SESSIONS'},
];

interface SidebarProps {
  user: { username: string; displayName: string; avatarUrl: string };
  onNavigate?: () => void;
}

export function Sidebar({ user, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  return (
    <aside className="w-64 h-full border-r border-[#1e2336] flex flex-col bg-[#161a25] shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
      {/* Logo */}
      <div className="px-6 py-8 hidden md:block">
        <Link href="/dashboard" className="flex items-center gap-3 group" onClick={onNavigate}>
          <div className="w-9 h-9 bg-indigo-500/20 rounded flex items-center justify-center text-indigo-400">
            <Bug className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-100 text-[15px] tracking-wide leading-tight">GitFix</span>
            <span className="text-[8px] text-slate-400 font-bold tracking-[0.2em] mt-[3px]">AI DEBUGGING SUITE</span>
          </div>
        </Link>
      </div>
      
      {/* Mobile profile quick link instead of logo which is on top bar */}
      <div className="md:hidden px-4 py-6 border-b border-white/5 mb-2">
         <div className="flex items-center gap-3">
             {user?.avatarUrl ? (
                 <img src={user.avatarUrl} alt={user.username} className="w-10 h-10 rounded-full border border-white/10" />
             ) : (
                 <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                     <User className="w-5 h-5" />
                 </div>
             )}
             <div className="flex flex-col">
                 <span className="font-bold text-sm text-slate-200">{user?.displayName || user?.username}</span>
                 <span className="text-xs text-slate-500">@{user?.username}</span>
             </div>
         </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-2 md:py-4 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={clsx(
                "flex items-center gap-4 px-4 py-3.5 rounded-lg text-xs font-bold tracking-widest transition-all",
                active 
                  ? "bg-[#21263c] text-slate-200" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
            >
              <Icon className={clsx("w-4 h-4 shrink-0", active ? "text-slate-300" : "text-slate-500")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 mt-auto mb-4 border-t border-white/5">
        <button onClick={() => { logout(); onNavigate?.(); }}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-xs font-bold tracking-widest text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all">
          <LogOut className="w-4 h-4" />
          <span>SIGN OUT</span>
        </button>
      </div>
    </aside>
  );
}
