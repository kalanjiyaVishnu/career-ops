import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';
import Modal from './Modal.jsx';
import { FileText, Eye, Copy, Check, ExternalLink, Loader2 } from 'lucide-react';

function MarkdownBody({ content }) {
  return (
    <div className="prose-custom">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold text-slate-100 mt-6 mb-3 pb-2 border-b border-slate-700">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold text-slate-200 mt-5 mb-2 pb-1 border-b border-slate-800">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold text-slate-300 mt-4 mb-1.5">{children}</h3>,
          h4: ({ children }) => <h4 className="text-sm font-medium text-slate-400 mt-3 mb-1">{children}</h4>,
          p: ({ children }) => <p className="text-sm text-slate-300 mb-3 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-outside pl-5 mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside pl-5 mb-3 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm text-slate-300 leading-relaxed">{children}</li>,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-indigo-500/50 pl-4 my-3 text-slate-400 italic">{children}</blockquote>,
          code: ({ inline, children }) =>
            inline
              ? <code className="bg-slate-700/60 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
              : <code className="block bg-slate-900 text-slate-300 rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre my-3 border border-slate-700/50">{children}</code>,
          pre: ({ children }) => <>{children}</>,
          strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-400">{children}</em>,
          hr: () => <hr className="border-slate-700/50 my-5" />,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 hover:underline">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="border-b border-slate-700">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-slate-800">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-slate-800/30 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="text-left px-3 py-2 text-slate-400 font-semibold uppercase text-[10px] tracking-wide">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-slate-300">{children}</td>,
          input: ({ checked }) => (
            <input type="checkbox" checked={checked} readOnly className="mr-2 accent-indigo-500 w-3.5 h-3.5" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function MarkdownModal({ file, title, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['preview', file],
    queryFn: () => axios.get(`/api/preview?file=${encodeURIComponent(file)}`).then(r => r.data),
    enabled: isOpen && !!file,
    staleTime: 60_000,
  });

  function copy() {
    if (data?.content) {
      navigator.clipboard.writeText(data.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || data?.filename || 'Preview'}
      maxWidth="max-w-3xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-600 font-mono truncate">{file}</span>
          <div className="flex gap-2 shrink-0">
            <button onClick={copy} className="btn btn-secondary btn-sm">
              {copied ? <><Check size={13} className="text-green-400" /> Copied</> : <><Copy size={13} /> Copy</>}
            </button>
            <button onClick={onClose} className="btn btn-ghost btn-sm">Close</button>
          </div>
        </div>
      }
    >
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-indigo-400" />
        </div>
      )}
      {error && (
        <div className="py-8 text-center">
          <p className="text-red-400 text-sm">{error.response?.data?.error || 'Could not load file'}</p>
          <p className="text-slate-600 text-xs mt-1">{file}</p>
        </div>
      )}
      {data?.content && <MarkdownBody content={data.content} />}
    </Modal>
  );
}

// Inline preview button — drop this next to any report_link / jd_file
export function PreviewButton({ file, label = 'Preview', title, className = '' }) {
  const [open, setOpen] = useState(false);
  if (!file) return null;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`btn btn-secondary btn-sm ${className}`}
      >
        <Eye size={13} /> {label}
      </button>
      <MarkdownModal file={file} title={title} isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
