'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap } from 'lucide-react';

function AuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      localStorage.setItem('auth_token', token);
      router.replace('/dashboard');
    } else {
      router.replace(`/?error=${error || 'auth_failed'}`);
    }
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-[#238636] rounded-xl flex items-center justify-center mx-auto animate-pulse">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <p className="text-[#8b949e] text-sm">Authenticating with GitHub…</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 bg-[#238636] rounded-xl flex items-center justify-center mx-auto animate-pulse">
          <Zap className="w-7 h-7 text-white" />
        </div>
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
