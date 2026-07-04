import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { applicationApi } from '../api.js';
import { FileText } from 'lucide-react';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import { STATUSES, STATUS_CONFIG, fmtDate, scoreColor } from '../utils/index.js';
import { Plus, Search, LayoutGrid, List, Trash2, Briefcase, ChevronRight, ChevronUp, ChevronDown, ArrowUpDown, Download, Upload, FileUp, SlidersHorizontal, X } from 'lucide-react';

const OPEN_STATUSES = ['Evaluated', 'Applied', 'Responded', 'Interview'];

function StatusMultiSelect({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function toggle(status) {
    if (selected.includes(status)) onChange(selected.filter(s => s !== status));
    else onChange([...selected, status]);
  }

  function setPreset(statuses) { onChange(statuses); setOpen(false); }

  const isOpen   = selected.length === OPEN_STATUSES.length && OPEN_STATUSES.every(s => selected.includes(s));
  const isAll    = selected.length === 0;
  const label    = isAll ? 'All Statuses' : isOpen ? 'Open' : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`input flex items-center gap-2 w-auto pr-2.5 cursor-pointer select-none ${open ? 'border-indigo-500/50' : ''}`}
      >
        <SlidersHorizontal size={14} className="text-slate-500 shrink-0" />
        <span className={`text-sm ${isAll ? 'text-slate-500' : 'text-slate-200'}`}>{label}</span>
        {!isAll && (
          <button
            onClick={e => { e.stopPropagation(); onChange([]); }}
            className="ml-1 p-0.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <X size={11} />
          </button>
        )}
        <ChevronDown size={13} className={`text-slate-500 ml-1 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-50 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
          {/* Presets */}
          <div className="flex gap-1 p-2 border-b border-slate-800">
            <button
              onClick={() => setPreset([])}
              className={`flex-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${isAll ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              All
            </button>
            <button
              onClick={() => setPreset(OPEN_STATUSES)}
              className={`flex-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${isOpen ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              Open
            </button>
          </div>
          {/* Status list */}
          <div className="py-1 max-h-72 overflow-y-auto">
            {STATUSES.map(s => {
              const cfg = STATUS_CONFIG[s] || {};
              const checked = selected.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggle(s)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-slate-800/70 ${checked ? 'bg-slate-800/40' : ''}`}
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`}>
                    {checked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </span>
                  <span className={`w-2 h-2 rounded-full shrink-0`} style={{ backgroundColor: cfg.dot }} />
                  <span className={checked ? 'text-slate-200' : 'text-slate-400'}>{s}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AppForm({ onSubmit, loading, initial = {} }) {
  const [form, setForm] = useState({
    company: initial.company || '',
    role: initial.role || '',
    date: initial.date || new Date().toISOString().split('T')[0],
    status: initial.status || 'Evaluated',
    score: initial.score || '',
    url: initial.url || '',
    notes: initial.notes || '',
  });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 form-group">
          <label className="label">Company *</label>
          <input className="input" value={form.company} onChange={set('company')} required placeholder="e.g. Google" />
        </div>
        <div className="col-span-2 form-group">
          <label className="label">Role *</label>
          <input className="input" value={form.role} onChange={set('role')} required placeholder="e.g. Software Engineer" />
        </div>
        <div className="form-group">
          <label className="label">Date</label>
          <input type="date" className="input" value={form.date} onChange={set('date')} />
        </div>
        <div className="form-group">
          <label className="label">Score</label>
          <input className="input" value={form.score} onChange={set('score')} placeholder="e.g. 4.2/5" />
        </div>
        <div className="form-group">
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={set('status')}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">URL</label>
          <input className="input" value={form.url} onChange={set('url')} placeholder="Job posting URL" />
        </div>
        <div className="col-span-2 form-group">
          <label className="label">Notes</label>
          <textarea className="input resize-none" rows={3} value={form.notes} onChange={set('notes')} placeholder="Quick notes..." />
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">
        {loading ? 'Saving…' : (initial.id ? 'Save Changes' : 'Add Application')}
      </button>
    </form>
  );
}

function KanbanCard({ app, onDelete }) {
  return (
    <Link to={`/applications/${app.id}`} className="block group">
      <div className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 hover:border-slate-600/60 rounded-xl p-3.5 transition-all duration-150">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
            {app.company[0]}
          </div>
          <button
            onClick={e => { e.preventDefault(); onDelete(app.id); }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 size={12} />
          </button>
        </div>
        <p className="text-sm font-semibold text-slate-200 leading-snug mb-0.5">{app.company}</p>
        <p className="text-xs text-slate-500 truncate mb-2">{app.role}</p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-600">{fmtDate(app.date)}</span>
          {app.score && <span className={`text-xs font-bold ${scoreColor(app.score)}`}>{app.score}</span>}
        </div>
      </div>
    </Link>
  );
}

export default function Applications() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const search          = params.get('q') || '';
  const statusParam     = params.get('status') || '';
  const selectedStatuses = statusParam ? statusParam.split(',').filter(Boolean) : [];
  const view            = params.get('view') || 'list';
  const sortBy          = params.get('sort') || 'date_desc';

  const sourceFilter    = params.get('source') || '';

  const setSearch         = (v) => setParams(p => { const n = new URLSearchParams(p); v ? n.set('q', v) : n.delete('q'); n.delete('page'); return n; }, { replace: true });
  const setSelectedStatuses = (arr) => setParams(p => { const n = new URLSearchParams(p); arr.length ? n.set('status', arr.join(',')) : n.delete('status'); return n; }, { replace: true });
  const setSourceFilter   = (v) => setParams(p => { const n = new URLSearchParams(p); v ? n.set('source', v) : n.delete('source'); return n; }, { replace: true });
  const setView           = (v) => setParams(p => { const n = new URLSearchParams(p); v === 'list' ? n.delete('view') : n.set('view', v); return n; }, { replace: true });
  const setSortBy         = (v) => setParams(p => { const n = new URLSearchParams(p); v === 'date_desc' ? n.delete('sort') : n.set('sort', v); return n; }, { replace: true });

  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);
  const csvRef = useRef();

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ['applications', statusParam, search, sourceFilter],
    queryFn: () => applicationApi.list({ status: statusParam || undefined, search: search || undefined, source: sourceFilter || undefined }).then(r => r.data),
    keepPreviousData: true,
  });

  const { data: sources = [] } = useQuery({
    queryKey: ['application-sources'],
    queryFn: () => applicationApi.getSources().then(r => r.data),
    staleTime: 60_000,
  });

  const addMut = useMutation({
    mutationFn: applicationApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); qc.invalidateQueries({ queryKey: ['stats'] }); setAddOpen(false); },
  });

  const delMut = useMutation({
    mutationFn: applicationApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); qc.invalidateQueries({ queryKey: ['stats'] }); },
  });

  function confirmDelete(id) {
    if (window.confirm('Delete this application?')) delMut.mutate(id);
  }

  function parseScore(s) {
    if (!s) return -1;
    const n = parseFloat(s);
    return isNaN(n) ? -1 : n;
  }

  const sortedApps = [...apps].sort((a, b) => {
    if (sortBy === 'score_desc') return parseScore(b.score) - parseScore(a.score);
    if (sortBy === 'score_asc') return parseScore(a.score) - parseScore(b.score);
    if (sortBy === 'date_asc') return (a.date || '').localeCompare(b.date || '');
    return (b.date || '').localeCompare(a.date || ''); // date_desc default
  });

  async function handleCsvImport(file) {
    if (!file) return;
    setImporting(true);
    setImportError('');
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append('csv', file);
      const { data } = await axios.post('/api/applications/import-csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImportResult(data);
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    } catch (e) {
      setImportError(e.response?.data?.error || 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  function exportUrl() {
    const p = new URLSearchParams();
    if (statusParam) p.set('status', statusParam);
    if (sourceFilter) p.set('source', sourceFilter);
    if (search) p.set('search', search);
    return `/api/applications/export.csv?${p}`;
  }

  function toggleScoreSort() {
    setSortBy(sortBy === 'score_desc' ? 'score_asc' : 'score_desc');
  }

  const kanbanGroups = STATUSES.reduce((acc, s) => {
    acc[s] = sortedApps.filter(a => a.status === s);
    return acc;
  }, {});

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Applications</h1>
          <p className="text-slate-500 text-sm mt-0.5">{sortedApps.length} result{sortedApps.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setImportResult(null); setImportError(''); setImportOpen(true); }} className="btn btn-secondary">
            <FileUp size={15} /> Import
          </button>
          <a href={exportUrl()} download className="btn btn-secondary">
            <Download size={15} /> Export
          </a>
          <button onClick={() => setAddOpen(true)} className="btn btn-primary">
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9"
            placeholder="Search company, role, notes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <StatusMultiSelect selected={selectedStatuses} onChange={setSelectedStatuses} />
          {sources.length > 0 && (
            <div className="relative">
              <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <select
                className={`input pl-8 w-auto pr-2 ${sourceFilter ? 'text-slate-200 border-indigo-500/40' : 'text-slate-500'}`}
                value={sourceFilter}
                onChange={e => setSourceFilter(e.target.value)}
              >
                <option value="">All Sources</option>
                {sources.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <select className="input w-auto" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
            <option value="score_desc">Score ↓</option>
            <option value="score_asc">Score ↑</option>
          </select>
          <div className="flex rounded-xl overflow-hidden border border-slate-700 shrink-0">
            {[['list', List], ['grid', LayoutGrid]].map(([v, Icon]) => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-2 transition-colors ${view === v ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}

      {!isLoading && sortedApps.length === 0 && (
        <div className="card p-12 text-center">
          <Briefcase className="mx-auto text-slate-700 mb-3" size={40} />
          <p className="text-slate-500 text-sm">No applications found</p>
          <button onClick={() => setAddOpen(true)} className="btn btn-primary mt-4 mx-auto">
            <Plus size={15} /> Add Application
          </button>
        </div>
      )}

      {/* List view */}
      {!isLoading && view === 'list' && sortedApps.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Company</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hidden lg:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hidden sm:table-cell">
                    <button onClick={toggleScoreSort} className="flex items-center gap-1 hover:text-slate-300 transition-colors group">
                      Score
                      {sortBy === 'score_desc' ? <ChevronDown size={12} className="text-indigo-400" /> :
                       sortBy === 'score_asc'  ? <ChevronUp size={12} className="text-indigo-400" /> :
                       <ArrowUpDown size={11} className="opacity-0 group-hover:opacity-50" />}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sortedApps.map(app => (
                  <tr key={app.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-4 py-3 text-slate-600 text-xs">{app.num || app.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                          {app.company[0]}
                        </div>
                        <span className="font-medium text-slate-200">{app.company}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell max-w-xs truncate">{app.role}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">{fmtDate(app.date)}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`font-bold text-sm ${scoreColor(app.score)}`}>{app.score || '—'}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/applications/${app.id}`} className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                          <ChevronRight size={15} />
                        </Link>
                        <button onClick={() => confirmDelete(app.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kanban view */}
      {!isLoading && view === 'grid' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {STATUSES.map(status => {
              const c = STATUS_CONFIG[status];
              const cards = kanbanGroups[status] || [];
              return (
                <div key={status} className="w-56 flex-shrink-0">
                  <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-2 ${c.bg} border ${c.border}`}>
                    <span className={`text-xs font-semibold ${c.text}`}>{status}</span>
                    <span className={`text-xs font-bold ${c.text} opacity-70`}>{cards.length}</span>
                  </div>
                  <div className="space-y-2">
                    {cards.map(app => <KanbanCard key={app.id} app={app} onDelete={confirmDelete} />)}
                    {cards.length === 0 && (
                      <div className="border-2 border-dashed border-slate-800 rounded-xl h-16 flex items-center justify-center">
                        <span className="text-xs text-slate-700">empty</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      <Modal isOpen={importOpen} onClose={() => setImportOpen(false)} title="Import from CSV">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Upload a CSV file with columns: <code className="text-xs text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">company, role, date, score, status, url, notes</code></p>
          <p className="text-xs text-slate-500">Existing entries (matched by company + role) will be updated. New entries will be added.</p>

          <div
            onClick={() => csvRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors group"
          >
            <Upload size={24} className="mx-auto text-slate-600 group-hover:text-indigo-400 mb-2 transition-colors" />
            <p className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">Click to select CSV file</p>
            <p className="text-xs text-slate-600 mt-1">or drag and drop</p>
          </div>
          <input
            ref={csvRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={e => { if (e.target.files[0]) handleCsvImport(e.target.files[0]); e.target.value = ''; }}
          />

          {importing && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              Importing…
            </div>
          )}

          {importError && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{importError}</div>
          )}

          {importResult && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 space-y-1">
              <p className="text-sm font-semibold text-green-400">Import complete</p>
              <p className="text-xs text-slate-400">{importResult.imported} new · {importResult.updated} updated · {importResult.total} total rows</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <a href="/api/applications/export.csv" download className="btn btn-secondary btn-sm">
              <Download size={13} /> Download template (current data)
            </a>
            <button onClick={() => setImportOpen(false)} className="btn btn-secondary">Close</button>
          </div>
        </div>
      </Modal>

      {/* Add Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Application">
        <AppForm onSubmit={addMut.mutate} loading={addMut.isPending} />
      </Modal>
    </div>
  );
}
