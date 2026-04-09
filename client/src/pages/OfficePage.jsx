import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Mail, User, Plus, Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar,
} from 'recharts';
import api from '../services/api';
import { useAAPTargets, useTrends, useCategoryBreakdown } from '../hooks/useDashboard';
import {
  PageHeader, ProgressBar, StatusBadge, Spinner,
  RegionBadge, Table, EmptyState,
} from '../components/shared/UI';
import ActivityForm from '../components/offices/ActivityForm';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function OfficePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [office, setOffice] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const { targets } = useAAPTargets(id);
  const { trends, loading: trendsLoading } = useTrends(180, id);
  const { breakdown, loading: breakdownLoading } = useCategoryBreakdown(id);

  useEffect(() => {
    Promise.all([
      api.get(`/offices/${id}`),
      api.get(`/activities?officeId=${id}&limit=50`),
    ]).then(([offRes, actRes]) => {
      setOffice(offRes.data.office);
      setActivities(actRes.data.activities);
    }).catch(() => toast.error('Failed to load office data'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleActivityCreated = (act) => {
    setActivities((prev) => [act, ...prev]);
    setShowForm(false);
    toast.success('Activity recorded');
  };

  if (loading) return <Spinner size="lg" />;
  if (!office) return <div className="text-slate-400 p-8">Office not found</div>;

  const totalTarget = targets.reduce((s, t) => s + t.annualTarget, 0);
  const totalBudget = targets.reduce((s, t) => s + t.annualBudget, 0);
  const achieved = activities.reduce((s, a) => s + a.achievedValue, 0);
  const spent = activities.reduce((s, a) => s + a.expenditure, 0);
  const completionPct = totalTarget > 0 ? Math.min(Math.round((achieved / totalTarget) * 100), 100) : 0;
  const budgetPct = totalBudget > 0 ? Math.min(Math.round((spent / totalBudget) * 100), 100) : 0;

  const TABS = ['overview', 'activities', 'aap targets', 'trends'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2 text-sm mb-4 -ml-1">
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
        <PageHeader
          title={office.name}
          subtitle={`${office.city}, ${office.state} · ${office.code}`}
          actions={
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={14} /> Log Activity
            </button>
          }
        />
      </div>

      {/* Info strip */}
      <div className="card p-4 flex flex-wrap gap-5">
        <div className="flex items-center gap-2 text-sm">
          <MapPin size={13} className="text-brand-400" />
          <span className="text-slate-400">{office.address || `${office.city}, ${office.state}`}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User size={13} className="text-brand-400" />
          <span className="text-slate-400">{office.officerInCharge || 'Not assigned'}</span>
        </div>
        {office.contactEmail && (
          <div className="flex items-center gap-2 text-sm">
            <Mail size={13} className="text-brand-400" />
            <a href={`mailto:${office.contactEmail}`} className="text-slate-400 hover:text-brand-300">{office.contactEmail}</a>
          </div>
        )}
        <div className="ml-auto">
          <RegionBadge region={office.region} />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'AAP Completion', value: `${completionPct}%`, bar: completionPct },
          { label: 'Budget Utilisation', value: `${budgetPct}%`, bar: budgetPct },
          { label: 'Total Activities', value: activities.length },
          { label: 'Delayed', value: activities.filter(a => a.status === 'Delayed').length },
        ].map((k) => (
          <div key={k.label} className="stat-card">
            <span className="label">{k.label}</span>
            <div className="text-2xl font-display font-semibold text-slate-100 my-1">{k.value}</div>
            {k.bar !== undefined && <ProgressBar value={k.bar} />}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
              activeTab === t
                ? 'border-brand-500 text-brand-300'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Category breakdown bar */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Activity by Category</h3>
            {breakdownLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : breakdown.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">No activities yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={breakdown} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="_id" type="category" width={130}
                    tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => v?.length > 18 ? v.slice(0, 18) + '\u2026' : v} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Status distribution */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Activity Status Distribution</h3>
            {(() => {
              const statusMap = {};
              activities.forEach((a) => { statusMap[a.status] = (statusMap[a.status] || 0) + 1; });
              const statusColors = {
                Completed: '#10b981', 'In Progress': '#6366f1',
                Planned: '#64748b', Delayed: '#ef4444', Cancelled: '#374151',
              };
              return (
                <div className="space-y-3">
                  {Object.entries(statusMap).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-3">
                      <div className="w-24 text-xs text-slate-400 flex-shrink-0">{status}</div>
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.round((count / activities.length) * 100)}%`,
                            background: statusColors[status] || '#64748b',
                          }}
                        />
                      </div>
                      <div className="text-xs font-mono text-slate-300 w-6 text-right">{count}</div>
                    </div>
                  ))}
                  {activities.length === 0 && <div className="text-slate-500 text-sm">No activities yet</div>}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Tab: Activities */}
      {activeTab === 'activities' && (
        <div className="card">
          {activities.length === 0 ? (
            <EmptyState
              title="No activities recorded"
              desc="Log the first activity for this office"
              action={
                <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
                  <Plus size={14} className="inline mr-1" /> Log Activity
                </button>
              }
            />
          ) : (
            <Table headers={['Activity', 'Category', 'Date', 'Target', 'Achieved', 'Expenditure', 'Status']}>
              {activities.map((a) => (
                <tr key={a._id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-200 text-sm">{a.activityName}</div>
                    {a.remarks && <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{a.remarks}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{a.category}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-300">{a.targetValue} {a.unit}</td>
                  <td className="px-4 py-3 text-xs font-mono text-emerald-400">{a.achievedValue} {a.unit}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-400">
                    ₹{(a.expenditure / 100000).toFixed(1)}L
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      )}

      {/* Tab: AAP Targets */}
      {activeTab === 'aap targets' && (
        <div className="card">
          {targets.length === 0 ? (
            <EmptyState title="No AAP targets set" desc="Annual Action Plan targets not configured yet" />
          ) : (
            <Table headers={['Category / Activity', 'Annual Target', 'Budget', 'Q1', 'Q2', 'Q3', 'Q4']}>
              {targets.map((t) => (
                <tr key={t._id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-200 text-sm">{t.activityName}</div>
                    <div className="text-xs text-slate-500">{t.category}</div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-300">{t.annualTarget} {t.unit}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-400">₹{(t.annualBudget / 100000).toFixed(1)}L</td>
                  {['Q1','Q2','Q3','Q4'].map((q) => (
                    <td key={q} className="px-4 py-3 text-xs font-mono text-slate-400">
                      {t.quarter?.[q]?.target ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </Table>
          )}
        </div>
      )}

      {/* Tab: Trends */}
      {activeTab === 'trends' && (
        <div className="card p-5">
          <h3 className="section-title mb-4">6-Month Activity Trend</h3>
          {trendsLoading ? (
            <div className="h-[240px] flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : trends.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center text-slate-500 text-sm">No trend data for this office yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trends} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => v?.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" name="Activities" fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Activity Form Modal */}
      {showForm && (
        <ActivityForm
          officeId={id}
          onClose={() => setShowForm(false)}
          onCreated={handleActivityCreated}
        />
      )}
    </div>
  );
}
