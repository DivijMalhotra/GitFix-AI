'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { Menu, Bug, X } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, fetchUser } = useAuthStore();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#151822]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#5E5DF0] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[#6e7681]">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#151822] overflow-hidden text-slate-100 relative">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#161a25] z-30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500/20 rounded flex items-center justify-center text-indigo-400">
            <Bug className="w-4 h-4 fill-current" />
          </div>
          <span className="font-bold text-slate-100">GitFix</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 -mr-2 text-slate-400 hover:text-slate-200">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar user={user} onNavigate={() => setMobileMenuOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto relative w-full">
        {children}
      </main>
    </div>
  );
}
