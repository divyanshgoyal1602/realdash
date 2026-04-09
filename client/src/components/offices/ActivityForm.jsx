import React, { useState } from 'react';
import { Modal, Select } from '../shared/UI';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Tourism Promotion', 'Tourist Facilitation', 'Media & Publicity',
  'Fairs & Festivals', 'Training & Capacity Building',
  'Infrastructure Development', 'Market Development Assistance',
  'Survey & Research', 'Coordination', 'Other',
];

const STATUSES = ['Planned', 'In Progress', 'Completed', 'Delayed', 'Cancelled'];

const initialForm = {
  activityName: '', category: '', description: '',
  date: new Date().toISOString().split('T')[0],
  targetValue: '', achievedValue: '', unit: 'Nos',
  budget: '', expenditure: '', status: 'In Progress', remarks: '',
};

export default function ActivityForm({ officeId, onClose, onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.activityName || !form.category) return toast.error('Name and category required');
    setSaving(true);
    try {
      const payload = { ...form, office: officeId };
      const { data } = await api.post('/activities', payload);
      onCreated(data.activity);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save activity');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Log Activity" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label block mb-1.5">Activity Name *</label>
            <input className="input" placeholder="e.g. Tourism Promotion – Media Campaign"
              value={form.activityName} onChange={(e) => set('activityName', e.target.value)} required />
          </div>

          <div>
            <label className="label block mb-1.5">Category *</label>
            <Select value={form.category} onChange={(v) => set('category', v)}
              options={CATEGORIES} placeholder="Select category" />
          </div>

          <div>
            <label className="label block mb-1.5">Date</label>
            <input type="date" className="input" value={form.date}
              onChange={(e) => set('date', e.target.value)} />
          </div>

          <div>
            <label className="label block mb-1.5">Target Value</label>
            <div className="flex gap-2">
              <input type="number" className="input" placeholder="0" value={form.targetValue}
                onChange={(e) => set('targetValue', e.target.value)} />
              <input className="input w-24" placeholder="Unit" value={form.unit}
                onChange={(e) => set('unit', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label block mb-1.5">Achieved Value</label>
            <input type="number" className="input" placeholder="0" value={form.achievedValue}
              onChange={(e) => set('achievedValue', e.target.value)} />
          </div>

          <div>
            <label className="label block mb-1.5">Budget (₹)</label>
            <input type="number" className="input" placeholder="0" value={form.budget}
              onChange={(e) => set('budget', e.target.value)} />
          </div>

          <div>
            <label className="label block mb-1.5">Expenditure (₹)</label>
            <input type="number" className="input" placeholder="0" value={form.expenditure}
              onChange={(e) => set('expenditure', e.target.value)} />
          </div>

          <div>
            <label className="label block mb-1.5">Status</label>
            <Select value={form.status} onChange={(v) => set('status', v)}
              options={STATUSES} />
          </div>

          <div>
            <label className="label block mb-1.5">Remarks</label>
            <input className="input" placeholder="Optional remarks" value={form.remarks}
              onChange={(e) => set('remarks', e.target.value)} />
          </div>

          <div className="col-span-2">
            <label className="label block mb-1.5">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="Brief description of the activity…"
              value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving…' : 'Save Activity'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
