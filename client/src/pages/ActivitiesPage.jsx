import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { useActivities } from '../hooks/useDashboard';
import { useAuth } from '../context/AuthContext';
import {
  PageHeader, StatusBadge, Spinner, Table,
  EmptyState, Select,
} from '../components/shared/UI';
import ActivityForm from '../components/offices/ActivityForm';
import api from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Tourism Promotion', 'Tourist Facilitation', 'Media & Publicity',
  'Fairs & Festivals', 'Training & Capacity Building',
  'Infrastructure Development', 'Market Development Assistance',
  'Survey & Research', 'Coordination', 'Other',
];

const STATUSES = ['Planned', 'In Progress', 'Completed', 'Delayed', 'Cancelled'];

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ page: 1, limit: 30 });
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { activities, total, loading, refetch } = useActivities(filters);

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v, page: 1 }));

  const handleDelete = async (id) => {
    if (!confirm('Delete this activity?')) return;
    try {
      await api.delete(`/activities/${id}`);
      toast.success('Activity deleted');
      refetch();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filtered = search
    ? activities.filter((a) =>
        a.activityName.toLowerCase().includes(search.toLowerCase()) ||
        a.office?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : activities;

  return (
    <div className="space-y-5">
      <PageHeader
        title="All Activities"
        subtitle={`${total} total activity entries across all offices`}
        actions={
          ['superadmin', 'ministry', 'office_admin', 'office_staff'].includes(user?.role) && (
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={14} /> Log Activity
            </button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9 text-sm"
            placeholder="Search activities or offices…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={filters.category || ''}
          onChange={(v) => setFilter('category', v || undefined)}
          options={CATEGORIES}
          placeholder="All Categories"
          className="w-48"
        />
        <Select
          value={filters.status || ''}
          onChange={(v) => setFilter('status', v || undefined)}
          options={STATUSES}
          placeholder="All Statuses"
          className="w-40"
        />
        <div className="flex items-center gap-2">
          <input type="date" className="input text-sm w-36" value={filters.from || ''}
            onChange={(e) => setFilter('from', e.target.value || undefined)} />
          <span className="text-slate-500 text-sm">–</span>
          <input type="date" className="input text-sm w-36" value={filters.to || ''}
            onChange={(e) => setFilter('to', e.target.value || undefined)} />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState title="No activities found" desc="Try adjusting your filters" />
        ) : (
          <Table headers={['Activity', 'Office', 'Category', 'Date', 'Progress', 'Expenditure', 'Status', '']}>
            {filtered.map((a) => {
              const pct = a.targetValue > 0 ? Math.round((a.achievedValue / a.targetValue) * 100) : 0;
              return (
                <tr key={a._id} className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-3 max-w-[200px]">
                    <div className="font-medium text-slate-200 text-sm truncate">{a.activityName}</div>
                    {a.description && (
                      <div className="text-xs text-slate-500 truncate">{a.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-300">{a.office?.name?.replace('India Tourism ', '')}</div>
                    <div className="text-xs text-slate-500">{a.office?.code}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 max-w-[120px] truncate">{a.category}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-4 py-3 w-36">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 font-mono w-8">{pct}%</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {a.achievedValue}/{a.targetValue} {a.unit}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-400">
                    ₹{a.expenditure > 0 ? (a.expenditure / 100000).toFixed(1) + 'L' : '—'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3">
                    {['superadmin', 'ministry', 'office_admin'].includes(user?.role) && (
                      <button
                        onClick={() => handleDelete(a._id)}
                        className="text-slate-600 hover:text-red-400 text-xs transition-colors"
                      >
                        Del
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>

      {showForm && (
        <ActivityForm
          officeId={user?.office?._id}
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); refetch(); toast.success('Activity logged'); }}
        />
      )}
    </div>
  );
}
