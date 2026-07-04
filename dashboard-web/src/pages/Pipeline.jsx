import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ExternalLink, Plus, Check, ChevronDown, ChevronUp, Inbox, FileText, RefreshCw } from 'lucide-react';
import { PreviewButton } from '../components/MarkdownPreview.jsx';
import { scoreColor } from '../utils/index.js';

const pipelineApi = {
  files: () => axios.get('/api/pipeline/files').then(r => r.data),
  parse: (file) => axios.get(`/api/pipeline?file=${encodeURIComponent(file)}`).then(r => r.data),
  add: (item) => axios.post('/api/pipeline/add', item).then(r => r.data),
};

function ItemRow({ item, onAdd, adding, added }) {
  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${added ? 'bg-green-500/5 border-green-500/20' : 'bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50'}`}>
      {/* Status dot */}
      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${item.done ? 'bg-slate-600' : 'bg-amber-400'}`} />

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {item.num && <span className="text-[10px] font-mono text-slate-600">#{item.num}</span>}
          {item.company && <span className="text-sm font-semibold text-slate-200">{item.company}</span>}
          {item.role && <span className="text-xs text-slate-400 truncate">{item.role}</span>}
          {item.score && <span className={`text-xs font-bold ml-auto ${scoreColor(item.score)}`}>{item.score}</span>}
        </div>
        {item.url && (
          <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-indigo-400/70 hover:text-indigo-400 transition-colors truncate">
            <ExternalLink size={10} className="shrink-0" />
            <span className="truncate">{item.url}</span>
          </a>
        )}
      </div>

      <div className="shrink-0">
        {added ? (
          <span className="flex items-center gap-1 text-xs text-green-400 font-medium"><Check size={12} /> Added</span>
        ) : (
          <button
            onClick={() => onAdd(item)}
            disabled={adding || item.done}
            className="btn btn-secondary btn-sm disabled:opacity-40"
            title={item.done ? 'Already processed' : 'Add to tracker'}
          >
            <Plus size={13} /> Track
          </button>
        )}
      </div>
    </div>
  );
}

export default function Pipeline() {
  const qc = useQueryClient();
  const [selectedFile, setSelectedFile] = useState('');
  const [showProcessed, setShowProcessed] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());
  const [addingId, setAddingId] = useState(null);

  const { data: files = [] } = useQuery({
    queryKey: ['pipeline-files'],
    queryFn: pipelineApi.files,
    onSuccess: (f) => { if (f.length && !selectedFile) setSelectedFile(f[0]); },
  });

  // auto-select first file
  const effectiveFile = selectedFile || files[0] || '';

  const { data: pipeline, isLoading, refetch } = useQuery({
    queryKey: ['pipeline', effectiveFile],
    queryFn: () => pipelineApi.parse(effectiveFile),
    enabled: !!effectiveFile,
  });

  async function addItem(item) {
    const key = `${item.num}-${item.url}`;
    setAddingId(key);
    try {
      const res = await pipelineApi.add({ ...item, source: effectiveFile });
      setAddedIds(s => new Set([...s, key]));
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      if (!res.created) window.alert(`Already in tracker (ID ${res.id})`);
    } finally {
      setAddingId(null);
    }
  }

  async function addAllPending() {
    const pending = (pipeline?.pendingItems || []).filter(i => {
      const key = `${i.num}-${i.url}`;
      return !addedIds.has(key);
    });
    for (const item of pending) await addItem(item);
  }

  const pending = pipeline?.pendingItems || [];
  const processed = pipeline?.processedItems || [];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline Inbox</h1>
          <p className="text-slate-500 text-sm mt-0.5">Import pending URLs from pipeline files</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {effectiveFile && (
            <PreviewButton
              file={effectiveFile}
              label="View Raw"
              title={effectiveFile}
            />
          )}
          <button onClick={() => refetch()} className="btn btn-secondary btn-sm"><RefreshCw size={13} /> Refresh</button>
        </div>
      </div>

      {/* File selector */}
      {files.length === 0 ? (
        <div className="card p-8 text-center">
          <Inbox size={36} className="mx-auto text-slate-700 mb-3" />
          <p className="text-slate-500 text-sm">No pipeline files found in <code className="text-slate-400 text-xs">data/</code></p>
          <p className="text-slate-600 text-xs mt-1">Files matching <code>pipeline*.md</code> are auto-detected</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {files.map(f => (
              <button
                key={f}
                onClick={() => setSelectedFile(f)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  effectiveFile === f
                    ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                    : 'bg-slate-800/40 border-slate-700/30 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <FileText size={13} /> {f}
              </button>
            ))}
          </div>

          {isLoading && <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}

          {pipeline && (
            <>
              {/* Stats bar */}
              <div className="flex flex-wrap items-center gap-4 px-4 py-3 card">
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="w-2 h-2 bg-amber-400 rounded-full" />
                  <span className="text-amber-400 font-semibold">{pending.length}</span>
                  <span className="text-slate-500">pending</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="w-2 h-2 bg-slate-600 rounded-full" />
                  <span className="text-slate-400 font-semibold">{processed.length}</span>
                  <span className="text-slate-500">processed</span>
                </div>
                <div className="ml-auto">
                  {pending.length > 0 && (
                    <button onClick={addAllPending} disabled={!!addingId} className="btn btn-primary btn-sm">
                      <Plus size={13} /> Add All Pending ({pending.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Pending items */}
              {pending.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-500/70 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" /> Pending ({pending.length})
                  </h2>
                  {pending.map((item, i) => {
                    const key = `${item.num}-${item.url}`;
                    return (
                      <ItemRow
                        key={i}
                        item={item}
                        onAdd={addItem}
                        adding={addingId === key}
                        added={addedIds.has(key)}
                      />
                    );
                  })}
                </div>
              )}

              {pending.length === 0 && (
                <div className="card p-8 text-center">
                  <Check size={32} className="mx-auto text-green-500/50 mb-2" />
                  <p className="text-slate-500 text-sm">All items in this pipeline are processed</p>
                </div>
              )}

              {/* Processed items (collapsed) */}
              {processed.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowProcessed(s => !s)}
                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-2 font-semibold uppercase tracking-widest"
                  >
                    {showProcessed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    Processed ({processed.length})
                  </button>
                  {showProcessed && (
                    <div className="space-y-1.5 opacity-60">
                      {processed.map((item, i) => {
                        const key = `${item.num}-${item.url}`;
                        return <ItemRow key={i} item={item} onAdd={addItem} adding={false} added={addedIds.has(key)} />;
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
