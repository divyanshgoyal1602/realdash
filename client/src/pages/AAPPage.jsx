import React, { useState, useEffect } from 'react';
import { Target, Plus } from 'lucide-react';
import { useAAPTargets } from '../hooks/useDashboard';
import { PageHeader, Table, Spinner, EmptyState, Modal, Select } from '../components/shared/UI';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Tourism Promotion', 'Tourist Facilitation', 'Media & Publicity',
  'Fairs & Festivals', 'Training & Capacity Building',
  'Infrastructure Development', 'Market Development Assistance',
  'Survey & Research', 'Coordination', 'Other',
];

const FYS = ['2024-25', '2025-26', '2023-24'];

const initialForm = {
  activityName: '', category: '', financialYear: '2024-25',
  officeId: '',
  annualTarget: '', unit: 'Nos', annualBudget: '',
  'quarter.Q1.target': '', 'quarter.Q2.target': '',
  'quarter.Q3.target': '', 'quarter.Q4.target': '',
};

export default function AAPPage() {
  const { user } = useAuth();
  const [fy, setFy] = useState('2024-25');
  const { targets, loading } = useAAPTargets(null, fy);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [offices, setOffices] = useState([]);

  const canEdit = ['superadmin', 'ministry', 'office_admin'].includes(user?.role);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!user) return;
    if (!['superadmin', 'ministry'].includes(user.role)) return;

    api.get('/offices')
      .then(({ data }) => setOffices(data.offices || []))
      .catch(() => setOffices([]));
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const officeId = user?.role === 'office_admin' ? user?.office?._id : form.officeId;
      if (!officeId) return toast.error('Please select an office');

      const payload = {
        activityName: form.activityName,
        category: form.category,
        financialYear: form.financialYear,
        annualTarget: Number(form.annualTarget),
        unit: form.unit,
        annualBudget: Number(form.annualBudget),
        office: officeId,
        quarter: {
          Q1: { target: Number(form['quarter.Q1.target'] || 0) },
          Q2: { target: Number(form['quarter.Q2.target'] || 0) },
          Q3: { target: Number(form['quarter.Q3.target'] || 0) },
          Q4: { target: Number(form['quarter.Q4.target'] || 0) },
        },
      };
      await api.post('/aap', payload);
      toast.success('AAP target created');
      setShowForm(false);
      setForm(initialForm);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Group by category
  const grouped = targets.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <PageHeader
        title="Annual Action Plan"
        subtitle="Office-wise targets and quarterly breakdowns"
        actions={
          <div className="flex items-center gap-3">
            <Select value={fy} onChange={setFy} options={FYS} className="w-28" />
            {canEdit && (
              <button
                onClick={() => {
                  setForm({
                    ...initialForm,
                    financialYear: fy,
                    officeId: user?.role === 'office_admin' ? user?.office?._id : '',
                  });
                  setShowForm(true);
                }}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus size={14} /> Add Target
              </button>
            )}
          </div>
        }
      />

      {loading ? <Spinner /> : targets.length === 0 ? (
        <EmptyState icon={Target} title="No AAP targets found" desc={`No targets set for FY ${fy}`} />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="card overflow-hidden">
              <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-medium text-slate-200 text-sm">{cat}</h3>
                <span className="text-xs text-slate-500">{items.length} entries</span>
              </div>
              <Table headers={['Office', 'Activity', 'Annual Target', 'Budget (₹L)', 'Q1', 'Q2', 'Q3', 'Q4', 'Status']}>
                {items.map((t) => (
                  <tr key={t._id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="text-xs font-medium text-slate-300">{t.office?.code}</div>
                      <div className="text-xs text-slate-500">{t.office?.city}</div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-300 max-w-[180px] truncate">{t.activityName}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-slate-300">{t.annualTarget} {t.unit}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-slate-400">
                      {(t.annualBudget / 100000).toFixed(1)}
                    </td>
                    {['Q1','Q2','Q3','Q4'].map((q) => (
                      <td key={q} className="px-4 py-2.5 text-xs font-mono text-slate-500">
                        {t.quarter?.[q]?.target ?? 0}
                      </td>
                    ))}
                    <td className="px-4 py-2.5">
                      <span className={t.isActive ? 'badge-green' : 'badge-gray'}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          ))}
        </div>
      )}

      {/* Add form modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add AAP Target" maxWidth="max-w-xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label block mb-1.5">Activity Name *</label>
              <input className="input" required value={form.activityName}
                onChange={(e) => set('activityName', e.target.value)} />
            </div>
            <div>
              <label className="label block mb-1.5">Category *</label>
              <Select value={form.category} onChange={(v) => set('category', v)}
                options={CATEGORIES} placeholder="Select" />
            </div>
            {user?.role !== 'office_admin' && (
              <div>
                <label className="label block mb-1.5">Office *</label>
                <Select
                  value={form.officeId}
                  onChange={(v) => set('officeId', v)}
                  options={offices.map((o) => ({ value: o._id, label: `${o.code} – ${o.city}` }))}
                  placeholder="Select office"
                />
              </div>
            )}
            <div>
              <label className="label block mb-1.5">Financial Year</label>
              <Select value={form.financialYear} onChange={(v) => set('financialYear', v)} options={FYS} />
            </div>
            <div>
              <label className="label block mb-1.5">Annual Target</label>
              <div className="flex gap-2">
                <input type="number" className="input" value={form.annualTarget}
                  onChange={(e) => set('annualTarget', e.target.value)} />
                <input className="input w-20" value={form.unit}
                  onChange={(e) => set('unit', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label block mb-1.5">Annual Budget (₹)</label>
              <input type="number" className="input" value={form.annualBudget}
                onChange={(e) => set('annualBudget', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label block mb-2">Quarterly Targets</label>
              <div className="grid grid-cols-4 gap-2">
                {['Q1','Q2','Q3','Q4'].map((q) => (
                  <div key={q}>
                    <label className="text-xs text-slate-500 block mb-1">{q}</label>
                    <input type="number" className="input text-xs" placeholder="0"
                      value={form[`quarter.${q}.target`]}
                      onChange={(e) => set(`quarter.${q}.target`, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? 'Saving…' : 'Save Target'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
