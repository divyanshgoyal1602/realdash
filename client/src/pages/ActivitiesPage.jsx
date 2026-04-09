import React, { useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useActivities } from '../hooks/useDashboard';
import { useAuth } from '../context/AuthContext';
import {
  PageHeader, StatusBadge, Spinner, Table,
  EmptyState, Select, Modal,
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
  const [editActivity, setEditActivity] = useState(null); // activity being edited
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const { activities, total, loading, refetch } = useActivities(filters);

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v, page: 1 }));

  // Can a user edit/delete this specific activity?
  const canEditActivity = (a) => {
    if (['superadmin', 'ministry'].includes(user?.role)) return true;
    if (user?.role === 'office_admin' && a.office?._id === user?.office?._id) return true;
    return false;
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this activity?')) return;
    try {
      await api.delete(`/activities/${id}`);
      toast.success('Activity deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const openEdit = (a) => {
    setEditActivity(a);
    setEditForm({
      activityName: a.activityName,
      description: a.description || '',
      category: a.category,
      status: a.status,
      achievedValue: a.achievedValue,
      targetValue: a.targetValue,
      expenditure: a.expenditure,
      date: a.date?.slice(0, 10),
    });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/activities/${editActivity._id}`, editForm);
      toast.success('Activity updated');
      setEditActivity(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
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
          <Table headers={['Activity', 'Office', 'Category', 'Date', 'Progress', 'Expenditure', 'Status', 'Actions']}>
            {filtered.map((a) => {
              const pct = a.targetValue > 0 ? Math.round((a.achievedValue / a.targetValue) * 100) : 0;
              const canAct = canEditActivity(a);
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
                    {canAct && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(a)}
                          className="text-slate-500 hover:text-brand-400 transition-colors"
                          title="Edit activity"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(a._id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete activity"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>

      {/* Log Activity Modal */}
      {showForm && (
        <ActivityForm
          officeId={user?.office?._id}
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); refetch(); toast.success('Activity logged'); }}
        />
      )}

      {/* Edit Activity Modal */}
      <Modal open={!!editActivity} onClose={() => setEditActivity(null)} title="Edit Activity" maxWidth="max-w-lg">
        <form onSubmit={handleEditSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label block mb-1.5">Activity Name *</label>
              <input className="input" required value={editForm.activityName || ''}
                onChange={(e) => setEditForm(f => ({ ...f, activityName: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="label block mb-1.5">Description</label>
              <textarea className="input" rows={2} value={editForm.description || ''}
                onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="label block mb-1.5">Category</label>
              <Select value={editForm.category || ''} onChange={(v) => setEditForm(f => ({ ...f, category: v }))}
                options={CATEGORIES} placeholder="Select" />
            </div>
            <div>
              <label className="label block mb-1.5">Status</label>
              <Select value={editForm.status || ''} onChange={(v) => setEditForm(f => ({ ...f, status: v }))}
                options={STATUSES} placeholder="Select" />
            </div>
            <div>
              <label className="label block mb-1.5">Achieved Value</label>
              <input type="number" className="input" value={editForm.achievedValue ?? ''}
                onChange={(e) => setEditForm(f => ({ ...f, achievedValue: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label block mb-1.5">Target Value</label>
              <input type="number" className="input" value={editForm.targetValue ?? ''}
                onChange={(e) => setEditForm(f => ({ ...f, targetValue: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label block mb-1.5">Expenditure (₹)</label>
              <input type="number" className="input" value={editForm.expenditure ?? ''}
                onChange={(e) => setEditForm(f => ({ ...f, expenditure: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label block mb-1.5">Date</label>
              <input type="date" className="input" value={editForm.date || ''}
                onChange={(e) => setEditForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setEditActivity(null)} className="btn-ghost text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
