import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, ClipboardCheck, AlertTriangle,
  TrendingUp, RefreshCw, CalendarDays,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useDashboard, useTrends, useCategoryBreakdown } from '../hooks/useDashboard';
import { useAuth } from '../context/AuthContext';
import { StatCard, ProgressBar, RegionBadge, Spinner, PageHeader } from '../components/shared/UI';
import { format } from 'date-fns';
import clsx from 'clsx';

const PIE_COLORS = ['#6366f1','#f97316','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#84cc16','#ec4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-slate-400 mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

const OfficeCard = ({ office, onClick }) => (
  <div
    onClick={onClick}
    className="card-hover p-4 cursor-pointer"
  >
    <div className="flex items-start justify-between mb-3">
      <div>
        <div className="font-medium text-slate-100 text-sm">{office.name.replace('India Tourism ', '')}</div>
        <div className="text-xs text-slate-500 mt-0.5">{office.city} · {office.code}</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <RegionBadge region={office.region} />
        {office.submittedToday
          ? <span className="badge-green text-[10px]">✓ Submitted</span>
          : <span className="badge-red text-[10px]">⚠ Pending</span>
        }
      </div>
    </div>

    <div className="space-y-2">
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-500">AAP Completion</span>
          <span className={clsx('text-xs font-mono font-medium',
            office.completionPct >= 75 ? 'text-emerald-400' :
            office.completionPct >= 50 ? 'text-brand-400' :
            office.completionPct >= 25 ? 'text-amber-400' : 'text-red-400'
          )}>
            {office.completionPct}%
          </span>
        </div>
        <ProgressBar value={office.completionPct} />
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-500">Budget Utilisation</span>
          <span className="text-xs font-mono text-slate-400">{office.budgetUtilPct}%</span>
        </div>
        <ProgressBar value={office.budgetUtilPct} />
      </div>
    </div>

    <div className="flex gap-3 mt-3 pt-3 border-t border-slate-800">
      <div className="text-center">
        <div className="text-sm font-semibold text-slate-200">{office.totalActivities}</div>
        <div className="text-[10px] text-slate-600">Activities</div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-emerald-400">{office.completed}</div>
        <div className="text-[10px] text-slate-600">Completed</div>
      </div>
      <div className="text-center">
        <div className={clsx('text-sm font-semibold', office.delayed > 0 ? 'text-red-400' : 'text-slate-400')}>
          {office.delayed}
        </div>
        <div className="text-[10px] text-slate-600">Delayed</div>
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fy] = useState('2024-25');
  const [filter, setFilter] = useState('all');
  const { data, loading, refetch } = useDashboard(fy);
  const { trends, loading: trendsLoading } = useTrends(180);
  const { breakdown, loading: breakdownLoading } = useCategoryBreakdown();

  if (loading) return <Spinner size="lg" />;

  const { summary, offices = [] } = data || {};

  const filteredOffices = offices.filter((o) => {
    if (filter === 'low') return o.completionPct < 30;
    if (filter === 'pending') return !o.submittedToday;
    if (filter === 'delayed') return o.delayed > 0;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mission Control"
        subtitle={`Ministry of Tourism · India Tourism Offices · FY ${fy}`}
        actions={
          <button onClick={refetch} className="btn-ghost flex items-center gap-2 text-sm">
            <RefreshCw size={14} />
            Refresh
          </button>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Offices"
          value={summary?.totalOffices ?? 20}
          sub="India Tourism Offices"
          icon={Building2}
          color="brand"
        />
        <StatCard
          label="Avg. Completion"
          value={`${summary?.avgCompletion ?? 0}%`}
          sub="vs Annual Targets"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          label="Submitted Today"
          value={`${summary?.submittedToday ?? 0}/${summary?.totalOffices ?? 20}`}
          sub="Daily activity entries"
          icon={ClipboardCheck}
          color="orange"
        />
        <StatCard
          label="Offices Delayed"
          value={summary?.delayedCount ?? 0}
          sub="Have delayed activities"
          icon={AlertTriangle}
          color={summary?.delayedCount > 0 ? 'red' : 'emerald'}
        />
        <StatCard
          label="Today's Date"
          value={format(new Date(), 'd MMM')}
          sub={format(new Date(), 'EEEE, yyyy')}
          icon={CalendarDays}
          color="brand"
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Trend chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Activity Trends (6 months)</h2>
          </div>
          {trendsLoading ? (
            <div className="h-[180px] flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : trends.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-slate-500 text-sm">No trend data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trends} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => v?.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="Activities" stroke="#6366f1" strokeWidth={2}
                  fill="url(#grad1)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category pie */}
        <div className="card p-5">
          <h2 className="section-title mb-4">By Category</h2>
          {breakdownLoading ? (
            <div className="h-[220px] flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : breakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={breakdown} dataKey="count" nameKey="_id" cx="50%" cy="50%"
                    innerRadius={40} outerRadius={65} paddingAngle={2}>
                    {breakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2 max-h-32 overflow-y-auto">
                {breakdown.slice(0, 6).map((b, i) => (
                  <div key={b._id} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-slate-400 truncate flex-1">{b._id}</span>
                    <span className="text-slate-300 font-medium">{b.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Office grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">
            All India Tourism Offices
            <span className="ml-2 text-sm text-slate-500 font-normal">({filteredOffices.length})</span>
          </h2>
          <div className="flex gap-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'low', label: 'Low Perf.' },
              { id: 'pending', label: 'No Submit' },
              { id: 'delayed', label: 'Delayed' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  filter === f.id
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-slate-100 bg-slate-800/60'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOffices.map((office) => (
            <OfficeCard
              key={office._id}
              office={office}
              onClick={() => navigate(`/offices/${office._id}`)}
            />
          ))}
        </div>

        {filteredOffices.length === 0 && (
          <div className="card p-12 text-center text-slate-500">
            No offices match this filter.
          </div>
        )}
      </div>
    </div>
  );
}
