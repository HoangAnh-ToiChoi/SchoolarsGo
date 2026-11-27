import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { COPY_RESET_MS } from '~/pages/chat/constants';

export default function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_RESET_MS);
    });
  };
  return (
    <button
      onClick={handle}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-ink-500 hover:text-ink-300 hover:bg-ink-800"
      title="Sao chép"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-success-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}
