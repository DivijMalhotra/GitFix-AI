import Link from 'next/link';
import { GitBranch, Zap, Shield, Search, Code2, GitPullRequest, Bug } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0F1219] text-white relative overflow-hidden">
      {/* Background ambient light effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-[#5E5DF0] to-[#8B88FF] blur-[100px] rounded-full mix-blend-screen" />
      </div>

      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 bg-[#0F1219]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#5E5DF0]/20 rounded flex items-center justify-center text-[#8B88FF]">
              <Bug className="w-5 h-5 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-100 text-[15px] tracking-wide leading-tight">GitFix</span>
              <span className="text-[8px] text-slate-400 font-bold tracking-[0.2em] mt-[3px]">AI DEBUGGING SUITE</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-ghost text-sm">Dashboard</Link>
            <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/auth/github`} className="btn-primary text-sm">
              Connect GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-32 pb-24 text-center z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5E5DF0]/10 border border-[#5E5DF0]/20 text-[#8B88FF] text-xs font-semibold mb-8 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5E5DF0] animate-pulse" />
          Powered by Claude AI + RAG
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight text-white">
          Debug faster with AI-powered
          <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B88FF] to-[#5E5DF0] animate-pulse-slow"> patch generation</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Connect your GitHub repo, paste an error, and get a root cause analysis,
          code fix, and an automated pull request — in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/auth/github`} className="btn-primary w-full sm:w-auto px-8 py-3.5 text-base rounded-xl justify-center">
            <GitBranch className="w-5 h-5" />
            Connect GitHub to Start
          </a>
          <Link href="#how-it-works" className="btn-secondary w-full sm:w-auto px-8 py-3.5 text-base rounded-xl justify-center">
            See how it works
          </Link>
        </div>
      </section>

      {/* Terminal mock */}
      <section className="relative max-w-4xl mx-auto px-4 md:px-6 pb-24 z-10 w-full">
        <div className="absolute inset-0 bg-gradient-to-b from-[#5E5DF0]/10 to-transparent blur-3xl rounded-3xl -z-10" />
        <div className="card overflow-hidden border-white/5 shadow-2xl shadow-black/50 bg-[#161A26]">
          <div className="flex items-center gap-2 px-4 py-3 bg-[#11141E]/90 border-b border-white/5 backdrop-blur-md">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-xs text-slate-500 font-mono truncate">ai-debugger — analysis</span>
          </div>
          <div className="p-4 md:p-6 font-mono text-[11px] sm:text-sm space-y-3 bg-[#161A26]/80 backdrop-blur-sm overflow-x-auto whitespace-nowrap md:whitespace-normal">
            <div className="text-slate-500">$ Analyzing TypeError in <span className="text-[#8B88FF]">api/users.js:42</span></div>
            <div className="flex gap-2">
              <span className="text-emerald-400">✓</span>
              <span className="text-slate-400">Indexed <span className="text-slate-200">247 files</span> · <span className="text-slate-200">1,832 chunks</span></span>
            </div>
            <div className="flex gap-2">
              <span className="text-emerald-400">✓</span>
              <span className="text-slate-400">Retrieved <span className="text-slate-200">8 relevant code chunks</span> via semantic search</span>
            </div>
            <div className="flex gap-2">
              <span className="text-amber-400">→</span>
              <span className="text-slate-200">Root cause: <span className="text-red-400">Cannot read property 'id' of undefined</span></span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-400 ml-4 hidden sm:block">User object not validated before destructuring on line 42.</span>
              <span className="text-slate-400 ml-4 sm:hidden">User object not validated...</span>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="text-emerald-400">✓</span>
              <span className="text-slate-400">Patch generated: <span className="text-slate-200">+3 lines / -1 line</span> in <span className="text-[#8B88FF]">api/users.js</span></span>
            </div>
            <div className="flex gap-2">
              <span className="text-emerald-400">✓</span>
              <span className="text-slate-400">Pull request opened: <span className="text-[#8B88FF]">github.com/…/pull/47</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="relative max-w-6xl mx-auto px-6 pb-24 z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Seamless workflow from bug to pull request.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 bg-[#161A26]/50 border-white/5 hover:border-[#5E5DF0]/30 hover:bg-[#1C2130]/80 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-[#1C2130] border border-white/5 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#5E5DF0]/20 group-hover:border-[#5E5DF0]/30 transition-all duration-300">
                <f.Icon className="w-6 h-6 text-[#8B88FF]" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-slate-100">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-light">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8 text-center text-sm text-slate-500 bg-[#0F1219]/80 backdrop-blur-md relative z-10">
        Built with Next.js · FastAPI · ChromaDB · Claude AI
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    Icon: GitBranch,
    title: '1. Connect & Index',
    description: 'Connect your GitHub repo. The AI engine clones it, chunks the code, and stores semantic embeddings in a vector database.',
  },
  {
    Icon: Search,
    title: '2. Submit Bug',
    description: 'Paste an error message, stack trace, logs, or GitHub issue URL. Relevant code is retrieved instantly via semantic search.',
  },
  {
    Icon: Code2,
    title: '3. AI Analysis',
    description: 'The LLM identifies the root cause, explains the bug clearly, and generates a precise git diff patch to fix it.',
  },
  {
    Icon: GitPullRequest,
    title: '4. Auto Pull Request',
    description: 'One click creates a branch, applies the patch, commits the change, and opens a pull request on GitHub — automatically.',
  },
  {
    Icon: Shield,
    title: 'Multi-file Patches',
    description: 'Complex bugs spanning multiple files? The AI understands cross-file dependencies and generates coordinated fixes.',
  },
  {
    Icon: Zap,
    title: 'Conversational Debug',
    description: 'Chat with your codebase. Ask follow-up questions, request alternative fixes, or explore the root cause deeper.',
  },
];
