'use client';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props { patch: string }

export function PatchViewer({ patch }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(patch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = patch.split('\n');

  return (
    <div className="relative">
      <button
        onClick={copy}
        className="absolute top-2 right-2 z-10 btn-ghost p-1.5 text-xs"
        title="Copy patch"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <div className="overflow-x-auto max-h-80">
        <table className="w-full text-xs font-mono">
          <tbody>
            {lines.map((line, i) => {
              const isAdd = line.startsWith('+') && !line.startsWith('+++');
              const isRemove = line.startsWith('-') && !line.startsWith('---');
              const isHunk = line.startsWith('@@');
              const isHeader = line.startsWith('diff') || line.startsWith('index') ||
                               line.startsWith('---') || line.startsWith('+++');

              return (
                <tr key={i} className={
                  isAdd    ? 'bg-[#1a3a1a]' :
                  isRemove ? 'bg-[#3a1a1a]' :
                  isHunk   ? 'bg-[#1a2a3a]' :
                  ''
                }>
                  <td className="w-8 text-right pr-3 text-[#6e7681] select-none border-r border-[#30363d] pl-2 py-0.5">
                    {i + 1}
                  </td>
                  <td className={`pl-3 py-0.5 whitespace-pre ${
                    isAdd    ? 'text-[#3fb950]' :
                    isRemove ? 'text-[#f85149]' :
                    isHunk   ? 'text-[#58a6ff]' :
                    isHeader ? 'text-[#6e7681]' :
                    'text-[#e6edf3]'
                  }`}>
                    {line || ' '}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
