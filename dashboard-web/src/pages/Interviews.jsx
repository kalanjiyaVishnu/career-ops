import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { interviewApi } from '../api.js';
import { fmtDateTime, fmtDate } from '../utils/index.js';
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, User2, MapPin } from 'lucide-react';

const OUTCOME_CONFIG = {
  pending:   { icon: Clock,          color: 'text-amber-400',  bg: 'bg-amber-500/10',  label: 'Scheduled' },
  passed:    { icon: CheckCircle2,   color: 'text-green-400',  bg: 'bg-green-500/10',  label: 'Passed' },
  failed:    { icon: XCircle,        color: 'text-red-400',    bg: 'bg-red-500/10',    label: 'Failed' },
  cancelled: { icon: AlertCircle,    color: 'text-slate-500',  bg: 'bg-slate-700/30',  label: 'Cancelled' },
};

const TYPE_COLORS = {
  phone: 'bg-blue-500/10 text-blue-400',
  video: 'bg-violet-500/10 text-violet-400',
  onsite: 'bg-orange-500/10 text-orange-400',
  technical: 'bg-cyan-500/10 text-cyan-400',
  hr: 'bg-pink-500/10 text-pink-400',
  panel: 'bg-amber-500/10 text-amber-400',
  case: 'bg-emerald-500/10 text-emerald-400',
  'take-home': 'bg-indigo-500/10 text-indigo-400',
};

function InterviewRow({ interview }) {
  const oc = OUTCOME_CONFIG[interview.outcome] || OUTCOME_CONFIG.pending;
  const Icon = oc.icon;
  const typeColor = TYPE_COLORS[interview.interview_type] || 'bg-slate-700/30 text-slate-400';
  const isPast = interview.scheduled_at && new Date(interview.scheduled_at) < new Date();

  return (
    <Link to={`/applications/${interview.application_id}`} className="card-hover p-4 flex items-start gap-4 block group">
      <div className={`w-10 h-10 rounded-xl ${oc.bg} flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon size={18} className={oc.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
              {interview.company}
            </p>
            <p className="text-xs text-slate-500 truncate">{interview.role}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium capitalize ${typeColor}`}>
              {interview.interview_type}
            </span>
            <span className={`text-[10px] font-semibold ${oc.color}`}>{oc.label}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
          {interview.round && <span className="font-medium text-slate-400">{interview.round}</span>}
          {interview.scheduled_at && (
            <span className={`flex items-center gap-1 ${isPast && interview.outcome === 'pending' ? 'text-amber-500' : ''}`}>
              <Calendar size={11} /> {fmtDateTime(interview.scheduled_at)}
            </span>
          )}
          {interview.interviewers && <span className="flex items-center gap-1"><User2 size={11} /> {interview.interviewers}</span>}
          {interview.location && <span className="flex items-center gap-1"><MapPin size={11} /> {interview.location}</span>}
        </div>
        {interview.feedback && (
          <p className="text-xs text-slate-500 mt-2 line-clamp-2 bg-slate-800/50 rounded-lg px-2 py-1.5">{interview.feedback}</p>
        )}
      </div>
    </Link>
  );
}

export default function Interviews() {
  const { data: all = [], isLoading } = useQuery({
    queryKey: ['interviews-all'],
    queryFn: () => interviewApi.getAll().then(r => r.data),
  });

  const now = new Date();
  const upcoming = all.filter(i => i.scheduled_at && new Date(i.scheduled_at) >= now && i.outcome === 'pending');
  const past = all.filter(i => !upcoming.includes(i));

  const stats = {
    total: all.length,
    pending: all.filter(i => i.outcome === 'pending').length,
    passed: all.filter(i => i.outcome === 'passed').length,
    failed: all.filter(i => i.outcome === 'failed').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Interviews</h1>
        <p className="text-slate-500 text-sm mt-0.5">Track your interview pipeline</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-300' },
          { label: 'Scheduled', value: stats.pending, color: 'text-amber-400' },
          { label: 'Passed', value: stats.passed, color: 'text-green-400' },
          { label: 'Failed', value: stats.failed, color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-600 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {isLoading && <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" /> Upcoming ({upcoming.length})
          </h2>
          <div className="space-y-2">
            {upcoming.map(i => <InterviewRow key={i.id} interview={i} />)}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500">Past ({past.length})</h2>
          <div className="space-y-2">
            {past.map(i => <InterviewRow key={i.id} interview={i} />)}
          </div>
        </div>
      )}

      {!isLoading && all.length === 0 && (
        <div className="card p-12 text-center">
          <Calendar size={40} className="mx-auto text-slate-700 mb-3" />
          <p className="text-slate-600 text-sm">No interviews yet</p>
          <p className="text-slate-700 text-xs mt-1">Add interviews from an application's detail page</p>
        </div>
      )}
    </div>
  );
}
