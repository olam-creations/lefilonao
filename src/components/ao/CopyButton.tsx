'use client';

import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded-lg hover:bg-slate-100 transition-colors group"
      title="Copier"
    >
      {copied
        ? <Check className="w-4 h-4 text-emerald-500" />
        : <Copy className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />}
    </button>
  );
}
