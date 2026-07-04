import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { chatApi } from '../api.js';
import { useQueryClient } from '@tanstack/react-query';

const WELCOME = {
  type: 'bot',
  text: `**Hi! I'm your career assistant.** 👋\n\nI can help you:\n• Add and update applications\n• Show stats and upcoming interviews\n• Search your pipeline\n• Import from applications.md\n\nType \`help\` to see all commands.`,
  ts: new Date(),
};

function renderText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-slate-700/60 px-1 py-0.5 rounded text-xs font-mono text-indigo-300">$1</code>')
    .replace(/\n/g, '<br/>');
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const qc = useQueryClient();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);

  async function send() {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    setMsgs(m => [...m, { type: 'user', text: msg, ts: new Date() }]);
    setLoading(true);
    try {
      const { data } = await chatApi.send(msg);
      setMsgs(m => [...m, { type: 'bot', text: data.text, ts: new Date(), data }]);
      if (['created','updated','import'].includes(data.type)) {
        qc.invalidateQueries({ queryKey: ['applications'] });
        qc.invalidateQueries({ queryKey: ['stats'] });
      }
    } catch {
      setMsgs(m => [...m, { type: 'bot', text: '❌ Server error. Is the backend running?', ts: new Date() }]);
    } finally {
      setLoading(false);
    }
  }

  const SUGGESTIONS = ['stats', 'upcoming', 'import', 'help'];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-20 md:bottom-6 right-4 z-50 w-13 h-13 flex items-center justify-center rounded-2xl shadow-lg shadow-indigo-500/25 transition-all duration-200 ${
          open ? 'bg-slate-700 rotate-0' : 'bg-indigo-500 hover:bg-indigo-400 hover:scale-105'
        }`}
        style={{ width: 52, height: 52 }}
        title="Career Assistant"
      >
        {open ? <X size={20} className="text-slate-200" /> : <MessageCircle size={22} className="text-white" />}
        {!open && msgs.length > 1 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center text-[9px] font-bold text-slate-900">
            {Math.min(msgs.length - 1, 9)}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-[90px] md:bottom-20 right-4 z-50 w-[min(360px,calc(100vw-24px))] bg-slate-900 border border-slate-700/70 rounded-2xl shadow-2xl shadow-black/50 flex flex-col animate-slide-up overflow-hidden" style={{ height: 480 }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Bot size={16} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">Career Assistant</p>
              <p className="text-xs text-slate-500">Type a command or ask anything</p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800">
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${m.type === 'user' ? 'bg-indigo-500' : 'bg-slate-700/70'}`}>
                  {m.type === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-slate-400" />}
                </div>
                <div className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                  m.type === 'user'
                    ? 'bg-indigo-500 text-white rounded-tr-sm'
                    : 'bg-slate-800 text-slate-200 rounded-tl-sm'
                }`}
                  dangerouslySetInnerHTML={{ __html: renderText(m.text) }}
                />
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-700/70 flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-slate-400" />
                </div>
                <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-3 py-3 flex gap-1">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Suggestions */}
          {msgs.length <= 2 && (
            <div className="px-3 pb-2 flex gap-1.5 flex-wrap shrink-0">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => { setInput(s); setTimeout(send, 10); }} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs transition-colors font-mono">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-slate-800 shrink-0 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="add Google - SWE, stats, help..."
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-9 h-9 flex items-center justify-center bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
