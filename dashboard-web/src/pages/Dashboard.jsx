import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { statsApi, applicationApi } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { STATUS_CONFIG, fmtDate, fmtDateTime, scoreColor } from '../utils/index.js';
import { TrendingUp, Briefcase, Calendar, Award, Download, ArrowRight, Clock } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-300 font-medium">{payload[0].name || payload[0].dataKey}</p>
      <p className="text-indigo-400 font-bold">{payload[0].value}</p>
    </div>
  );
};

export default function Dashboard() {
  const qc = useQueryClient();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => statsApi.get().then(r => r.data),
    refetchInterval: 30000,
  });

  const importMut = useMutation({
    mutationFn: applicationApi.import,
    onSuccess: (res) => {
      const { imported, updated } = res.data;
      qc.invalidateQueries();
      window.alert(`Synced! ${imported} new, ${updated} updated.`);
    },
    onError: (e) => window.alert(`Import failed: ${e.message}`),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pieData = (stats?.byStatus || []).filter(s => s.c > 0).map(s => ({
    name: s.status, value: s.c, fill: STATUS_CONFIG[s.status]?.hex || '#64748b',
  }));

  const weekData = (stats?.weeklyStats || []).map(w => ({
    week: w.week?.replace(/^\d{4}-/, '') || '',
    count: w.count,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Your job search pipeline at a glance</p>
        </div>
        <button
          onClick={() => importMut.mutate()}
          disabled={importMut.isPending}
          className="btn btn-primary self-start sm:self-auto"
        >
          <Download size={15} />
          {importMut.isPending ? 'Syncing…' : 'Sync from MD'}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Total', value: stats?.total ?? 0, icon: Briefcase, color: 'text-blue-400', ring: 'bg-blue-500/10' },
          { label: 'This Month', value: stats?.thisMonth ?? 0, icon: TrendingUp, color: 'text-emerald-400', ring: 'bg-emerald-500/10' },
          { label: 'In Progress', value: stats?.inProgress ?? 0, icon: Clock, color: 'text-violet-400', ring: 'bg-violet-500/10' },
          { label: 'Offers', value: stats?.offers ?? 0, icon: Award, color: 'text-amber-400', ring: 'bg-amber-500/10' },
        ].map(({ label, value, icon: Icon, color, ring }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between">
              <span className="section-title">{label}</span>
              <div className={`w-8 h-8 rounded-xl ${ring} flex items-center justify-center`}>
                <Icon size={16} className={color} />
              </div>
            </div>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Pie chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">By Status</h2>
          {pieData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          ) : (
            <>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} dataKey="value" paddingAngle={3} strokeWidth={0}>
                      {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.fill }} />
                    {d.name} <span className="text-slate-500">({d.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bar chart */}
        <div className="card p-5 lg:col-span-3">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Weekly Applications</h2>
          {weekData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          ) : (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData} barSize={22}>
                  <XAxis dataKey="week" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming interviews */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Calendar size={16} className="text-violet-400" /> Upcoming Interviews
            </h2>
            <Link to="/interviews" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              All <ArrowRight size={12} />
            </Link>
          </div>
          {(stats?.upcomingInterviews || []).length === 0 ? (
            <p className="text-slate-600 text-sm py-4 text-center">No upcoming interviews</p>
          ) : (
            <div className="space-y-2">
              {stats.upcomingInterviews.map(i => (
                <Link key={i.id} to={`/applications/${i.application_id}`} className="flex items-center gap-3 p-3 bg-slate-800/40 hover:bg-slate-800/70 rounded-xl transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                    <Calendar size={15} className="text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{i.company}</p>
                    <p className="text-xs text-slate-500 truncate">{i.round || i.interview_type} · {i.role}</p>
                  </div>
                  <span className="text-xs text-violet-400 shrink-0">{fmtDateTime(i.scheduled_at)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent applications */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Briefcase size={16} className="text-blue-400" /> Recent Applications
            </h2>
            <Link to="/applications" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              All <ArrowRight size={12} />
            </Link>
          </div>
          {(stats?.recentApplications || []).length === 0 ? (
            <p className="text-slate-600 text-sm py-4 text-center">
              No applications yet.{' '}
              <button onClick={() => importMut.mutate()} className="text-indigo-400 hover:underline">Import from MD</button>
            </p>
          ) : (
            <div className="space-y-2">
              {stats.recentApplications.slice(0, 6).map(a => (
                <Link key={a.id} to={`/applications/${a.id}`} className="flex items-center gap-3 p-3 bg-slate-800/40 hover:bg-slate-800/70 rounded-xl transition-colors group">
                  <div className="w-8 h-8 rounded-xl bg-slate-700/60 flex items-center justify-center shrink-0 text-xs font-bold text-slate-400">
                    {a.company[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{a.company}</p>
                    <p className="text-xs text-slate-500 truncate">{a.role}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {a.score && <span className={`text-xs font-semibold ${scoreColor(a.score)}`}>{a.score}</span>}
                    <StatusBadge status={a.status} size="xs" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
