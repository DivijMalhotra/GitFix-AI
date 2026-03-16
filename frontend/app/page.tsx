import Link from 'next/link';
import { GitBranch, Zap, Shield, Search, Code2, GitPullRequest } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#010409] text-[#e6edf3]">
      {/* Nav */}
      <nav className="border-b border-[#30363d] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#238636] rounded-md flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">AI Debugger</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-ghost text-sm">Dashboard</Link>
            <Link href="/api/auth/github" className="btn-primary text-sm">
              Connect GitHub
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1f6335] border border-[#2ea043] text-[#3fb950] text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
          Powered by Claude AI + RAG
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          Debug faster with
          <span className="text-[#3fb950]"> AI-powered</span><br />
          patch generation
        </h1>

        <p className="text-xl text-[#8b949e] max-w-2xl mx-auto mb-10 leading-relaxed">
          Connect your GitHub repo, paste an error, and get a root cause analysis,
          code fix, and an automated pull request — in seconds.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link href="/api/auth/github" className="btn-primary px-6 py-3 text-base">
            <GitBranch className="w-5 h-5" />
            Connect GitHub to Start
          </Link>
          <Link href="#how-it-works" className="btn-secondary px-6 py-3 text-base">
            See how it works
          </Link>
        </div>
      </section>

      {/* Terminal mock */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-[#0d1117] border-b border-[#30363d]">
            <div className="w-3 h-3 rounded-full bg-[#f85149]" />
            <div className="w-3 h-3 rounded-full bg-[#d29922]" />
            <div className="w-3 h-3 rounded-full bg-[#3fb950]" />
            <span className="ml-2 text-xs text-[#6e7681] font-mono">ai-debugger — analysis</span>
          </div>
          <div className="p-6 font-mono text-sm space-y-3">
            <div className="text-[#6e7681]">$ Analyzing TypeError in <span className="text-[#58a6ff]">api/users.js:42</span></div>
            <div className="flex gap-2">
              <span className="text-[#3fb950]">✓</span>
              <span className="text-[#8b949e]">Indexed <span className="text-[#e6edf3]">247 files</span> · <span className="text-[#e6edf3]">1,832 chunks</span></span>
            </div>
            <div className="flex gap-2">
              <span className="text-[#3fb950]">✓</span>
              <span className="text-[#8b949e]">Retrieved <span className="text-[#e6edf3]">8 relevant code chunks</span> via semantic search</span>
            </div>
            <div className="flex gap-2">
              <span className="text-[#d29922]">→</span>
              <span className="text-[#e6edf3]">Root cause: <span className="text-[#f85149]">Cannot read property 'id' of undefined</span></span>
            </div>
            <div className="flex gap-2">
              <span className="text-[#8b949e] ml-4">User object not validated before destructuring on line 42.</span>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="text-[#3fb950]">✓</span>
              <span className="text-[#8b949e]">Patch generated: <span className="text-[#e6edf3]">+3 lines / -1 line</span> in <span className="text-[#58a6ff]">api/users.js</span></span>
            </div>
            <div className="flex gap-2">
              <span className="text-[#3fb950]">✓</span>
              <span className="text-[#8b949e]">Pull request opened: <span className="text-[#58a6ff]">github.com/…/pull/47</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 hover:border-[#58a6ff] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center mb-4">
                <f.Icon className="w-5 h-5 text-[#58a6ff]" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-[#8b949e] leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#30363d] px-6 py-8 text-center text-sm text-[#6e7681]">
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
