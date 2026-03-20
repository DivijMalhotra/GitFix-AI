'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debugApi, prApi } from '@/lib/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bug, GitPullRequest, Send, Loader2, ChevronDown, ChevronRight,
  ExternalLink, AlertTriangle, CheckCircle2, FileCode2, Sparkles,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PatchViewer } from '@/components/debug/PatchViewer';
import { CreatePRModal } from '@/components/debug/CreatePRModal';
import { formatDistanceToNow } from 'date-fns';

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [chatInput, setChatInput] = useState('');
  const [showChunks, setShowChunks] = useState(false);
  const [showPRModal, setShowPRModal] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: session, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => debugApi.session(sessionId),
    refetchInterval: (query) =>
      (query.state.data?.status === 'analyzing' || query.state.data?.status === 'pending') ? 2000 : false,
  });

  const chatMutation = useMutation({
    mutationFn: (msg: string) => debugApi.chat(sessionId, msg),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session', sessionId] }),
    onError: (e: any) => toast.error(e.response?.data?.error || 'Chat failed'),
  });

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatMutation.isPending) return;
    const msg = chatInput.trim();
    setChatInput('');
    chatMutation.mutate(msg);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-[#6e7681]" />
    </div>
  );

  if (!session) return (
    <div className="p-8 text-center text-[#6e7681]">Session not found</div>
  );

  const isAnalyzing = session.status === 'analyzing' || session.status === 'pending';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-[#30363d] px-6 py-4 flex items-center gap-4 shrink-0">
        <Bug className="w-5 h-5 text-[#f85149]" />
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm truncate">{session.title || 'Debug Session'}</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <StatusBadge status={session.status} />
            <span className="text-xs text-[#6e7681]">{session.repoId?.fullName}</span>
            <span className="text-xs text-[#6e7681]">
              {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {session.pullRequestUrl ? (
            <a href={session.pullRequestUrl} target="_blank" rel="noopener"
              className="btn-secondary text-xs">
              <GitPullRequest className="w-3.5 h-3.5 text-[#3fb950]" />
              View PR #{session.pullRequestNumber}
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : session.patch && session.status === 'analyzed' && (
            <button onClick={() => setShowPRModal(true)} className="btn-primary text-xs">
              <GitPullRequest className="w-3.5 h-3.5" /> Create Pull Request
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left panel - Analysis */}
        <div className="w-1/2 border-r border-[#30363d] overflow-y-auto p-5 space-y-5">

          {/* Analyzing spinner */}
          {isAnalyzing && (
            <div className="card p-6 flex flex-col items-center gap-3 text-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-[#238636] border-t-transparent animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-[#3fb950]" />
              </div>
              <p className="font-medium text-sm">AI is analyzing your bug…</p>
              <p className="text-xs text-[#6e7681]">Retrieving relevant code and generating root cause analysis</p>
            </div>
          )}

          {/* Error */}
          <div className="card p-4 space-y-2">
            <h3 className="text-xs font-semibold text-[#6e7681] uppercase tracking-wider">Error</h3>
            <pre className="text-xs text-[#f85149] font-mono whitespace-pre-wrap break-all">
              {session.errorMessage}
            </pre>
          </div>

          {/* Analysis results */}
          {session.analysis && (
            <>
              <div className="card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#d29922]" />
                  <h3 className="text-sm font-semibold">Root Cause</h3>
                  {session.analysis.confidence && (
                    <span className="badge-yellow ml-auto">
                      {Math.round(session.analysis.confidence * 100)}% confidence
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#e6edf3] leading-relaxed">{session.analysis.rootCause}</p>
              </div>

              <div className="card p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3fb950]" /> Explanation
                </h3>
                <div className="prose prose-sm prose-invert max-w-none text-[#8b949e] text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {session.analysis.explanation}
                  </ReactMarkdown>
                </div>
              </div>

              <div className="card p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-[#58a6ff]" /> Suggested Fix
                </h3>
                <div className="prose prose-sm prose-invert max-w-none text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {session.analysis.suggestedFix}
                  </ReactMarkdown>
                </div>
                {session.analysis.affectedFiles?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {session.analysis.affectedFiles.map((f: string) => (
                      <span key={f} className="badge-blue font-mono text-xs">{f}</span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Patch */}
          {session.patch && (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d]">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-[#3fb950]" /> Generated Patch
                </h3>
              </div>
              <PatchViewer patch={session.patch} />
            </div>
          )}

          {/* Relevant chunks */}
          {session.relevantChunks?.length > 0 && (
            <div className="card overflow-hidden">
              <button
                onClick={() => setShowChunks(v => !v)}
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-[#21262d] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-[#6e7681]" />
                  Retrieved Code Chunks ({session.relevantChunks.length})
                </span>
                {showChunks ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {showChunks && (
                <div className="border-t border-[#30363d] divide-y divide-[#30363d]">
                  {session.relevantChunks.map((c: any, i: number) => (
                    <div key={i} className="p-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#58a6ff] font-mono">{c.filePath}</span>
                        <span className="text-xs text-[#6e7681]">lines {c.startLine}-{c.endLine}</span>
                        <span className="badge-gray text-xs ml-auto">{(c.score * 100).toFixed(0)}%</span>
                      </div>
                      <pre className="text-xs text-[#8b949e] font-mono overflow-x-auto max-h-32">
                        {c.content}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel - Chat */}
        <div className="w-1/2 flex flex-col">
          <div className="px-4 py-3 border-b border-[#30363d] shrink-0">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#d29922]" /> Conversational Debug
            </h2>
            <p className="text-xs text-[#6e7681] mt-0.5">Ask follow-up questions about this bug</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {(session.messages || []).length === 0 && !isAnalyzing && (
              <div className="text-center text-sm text-[#6e7681] pt-8">
                <Sparkles className="w-8 h-8 mx-auto mb-3 text-[#30363d]" />
                <p>Ask questions about the bug, request alternative fixes,</p>
                <p>or explore the root cause further.</p>
              </div>
            )}

            {(session.messages || []).map((m: any, i: number) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  m.role === 'user'
                    ? 'bg-[#1f6335] text-[#3fb950]'
                    : 'bg-[#0d1117] border border-[#30363d] text-[#58a6ff]'
                }`}>
                  {m.role === 'user' ? 'U' : 'AI'}
                </div>
                <div className={`flex-1 text-sm rounded-lg px-3 py-2 max-w-[85%] ${
                  m.role === 'user'
                    ? 'bg-[#1f6335] text-[#e6edf3] ml-auto'
                    : 'bg-[#161b22] border border-[#30363d] text-[#e6edf3]'
                }`}>
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}

            {chatMutation.isPending && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-xs text-[#58a6ff]">AI</div>
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#6e7681] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <form onSubmit={handleChat} className="border-t border-[#30363d] p-3 flex gap-2 shrink-0">
            <input
              className="input flex-1 text-sm"
              placeholder={isAnalyzing ? 'Waiting for analysis…' : 'Ask about this bug…'}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              disabled={isAnalyzing || chatMutation.isPending}
            />
            <button
              type="submit"
              className="btn-primary px-3"
              disabled={!chatInput.trim() || isAnalyzing || chatMutation.isPending}
            >
              {chatMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </form>
        </div>
      </div>

      {showPRModal && (
        <CreatePRModal
          sessionId={sessionId}
          repoFullName={session.repoId?.fullName}
          onClose={() => setShowPRModal(false)}
          onSuccess={(url) => {
            setShowPRModal(false);
            qc.invalidateQueries({ queryKey: ['session', sessionId] });
            toast.success('Pull request created!');
            window.open(url, '_blank');
          }}
        />
      )}
    </div>
  );
}
