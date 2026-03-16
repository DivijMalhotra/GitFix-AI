'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import {
  LayoutDashboard, GitBranch, Bug, GitPullRequest,
  Settings, LogOut, Zap, ChevronRight,
} from 'lucide-react';
import Image from 'next/image';
import { clsx } from 'clsx';

const NAV = [
  { href: '/dashboard',         icon: LayoutDashboard, label: 'Overview'      },
  { href: '/dashboard/repos',   icon: GitBranch,       label: 'Repositories'  },
  { href: '/dashboard/debug',   icon: Bug,             label: 'Debug Sessions' },
];

interface SidebarProps {
  user: { username: string; displayName: string; avatarUrl: string };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  return (
    <aside className="w-60 border-r border-[#30363d] flex flex-col bg-[#0d1117] shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#30363d]">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#238636] rounded-md flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[#e6edf3] text-sm tracking-tight">AI Debugger</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx('sidebar-item', active && 'active')}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-[#30363d] p-3 space-y-1">
        <div className="flex items-center gap-3 px-2 py-2">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt={user.username} width={28} height={28}
              className="rounded-full" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#238636] flex items-center justify-center text-xs font-bold text-white">
              {user.username[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#e6edf3] truncate">{user.displayName || user.username}</p>
            <p className="text-xs text-[#6e7681] truncate">@{user.username}</p>
          </div>
        </div>
        <button onClick={logout}
          className="sidebar-item w-full text-[#f85149] hover:text-[#f85149] hover:bg-[#3d1f1f]">
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
