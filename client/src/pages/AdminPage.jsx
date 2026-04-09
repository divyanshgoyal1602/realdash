import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Building2, Plus, RefreshCw, Trash2,
  ToggleLeft, ToggleRight, KeyRound, Link2, Copy, Check,
  UserCheck, UserX, Clock,
} from 'lucide-react';
import api from '../services/api';
import {
  PageHeader, Table, Spinner, Modal, Select,
  EmptyState, StatusBadge,
} from '../components/shared/UI';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

const ROLES = ['superadmin', 'ministry', 'office_admin', 'office_staff', 'viewer'];
const ROLE_COLORS = {
  superadmin:   'badge-red',
  ministry:     'badge-saffron',
  office_admin: 'badge-blue',
  office_staff: 'badge-green',
  viewer:       'badge-gray',
};

export default function AdminPage() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showResetPwd, setShowResetPwd] = useState(null); // user object
  const [editUser, setEditUser] = useState(null);

  // Create user form
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'office_staff', office: '' });
  const [saving, setSaving] = useState(false);

  // Invite form
  const [inviteForm, setInviteForm] = useState({ role: 'office_staff', officeId: '', email: '' });
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Reset password form
  const [newPwd, setNewPwd] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, oRes, pendingRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/offices'),
        api.get('/auth/users?isActive=false'),
      ]);
      const allUsers = uRes.data.users || [];
      // Pending = inactive AND never logged in (self-registered, awaiting approval)
      const pending = allUsers.filter(u => !u.isActive && !u.lastLogin);
      setUsers(allUsers.filter(u => u.isActive || u.lastLogin)); // active or previously active
      setPendingUsers(pending);
      setOffices(oRes.data.offices || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Create user ─────────────────────────────────────────────────────────────
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email || !userForm.password)
      return toast.error('All fields required');
    setSaving(true);
    try {
      await api.post('/auth/admin-register', userForm);
      toast.success('User created successfully');
      setShowCreateUser(false);
      setUserForm({ name: '', email: '', password: '', role: 'office_staff', office: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active ────────────────────────────────────────────────────────────
  const toggleActive = async (user) => {
    try {
      await api.put(`/auth/users/${user._id}`, { ...user, isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      load();
    } catch {
      toast.error('Failed to update user');
    }
  };

  // ── Approve user ─────────────────────────────────────────────────────────────
  const handleApprove = async (userId) => {
    try {
      await api.patch(`/auth/users/${userId}/approve`);
      toast.success('User approved — they can now log in');
      load();
    } catch {
      toast.error('Failed to approve user');
    }
  };

  // ── Reject user ──────────────────────────────────────────────────────────────
  const handleReject = async (userId) => {
    if (!window.confirm('Reject and delete this registration request?')) return;
    try {
      await api.patch(`/auth/users/${userId}/reject`);
      toast.success('Registration rejected and removed');
      load();
    } catch {
      toast.error('Failed to reject user');
    }
  };

  // ── Delete user ──────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      toast.success('User deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // ── Update user ──────────────────────────────────────────────────────────────
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/auth/users/${editUser._id}`, {
        name: editUser.name, role: editUser.role,
        office: editUser.office?._id || editUser.office || null,
        isActive: editUser.isActive,
      });
      toast.success('User updated');
      setEditUser(null);
      load();
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Reset password ───────────────────────────────────────────────────────────
  const handleResetPwd = async (e) => {
    e.preventDefault();
    if (newPwd.length < 8) return toast.error('Min 8 characters');
    setSaving(true);
    try {
      await api.patch(`/auth/users/${showResetPwd._id}/reset-password`, { newPassword: newPwd });
      toast.success('Password reset successfully');
      setShowResetPwd(null);
      setNewPwd('');
    } catch {
      toast.error('Reset failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Generate invite ──────────────────────────────────────────────────────────
  const handleGenerateInvite = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/auth/generate-invite', inviteForm);
      setInviteLink(data.inviteLink);
    } catch {
      toast.error('Failed to generate invite');
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied!');
  };

  const TABS = [
    { id: 'users',   label: 'Users',   icon: Users     },
    { id: 'pending', label: 'Pending Approvals', icon: Clock, badge: pendingUsers.length },
    { id: 'offices', label: 'Offices', icon: Building2 },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Admin Panel"
        subtitle="User management, office configuration, and invite generation"
        actions={
          <button onClick={load} className="btn-ghost flex items-center gap-2 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === t.id
                ? 'border-brand-500 text-brand-300'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            )}
          >
            <t.icon size={14} />{t.label}
            {t.badge != null && t.badge > 0 && (
              <span className="ml-1 text-xs bg-amber-500 text-black px-1.5 py-0.5 rounded-full font-bold">
                {t.badge}
              </span>
            )}
            {t.id === 'users' && (
              <span className="ml-1 text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">
                {users.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* ── USERS TAB ──────────────────────────────────────────────── */}
          {tab === 'users' && (
            <div className="space-y-4">
              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 justify-end">
                <button
                  onClick={() => { setInviteLink(''); setShowInvite(true); }}
                  className="btn-ghost flex items-center gap-2 text-sm border border-slate-700"
                >
                  <Link2 size={14} /> Generate Invite Link
                </button>
                <button
                  onClick={() => setShowCreateUser(true)}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Plus size={14} /> Add User Directly
                </button>
              </div>

              {/* Users table */}
              <div className="card">
                {users.length === 0 ? (
                  <EmptyState icon={Users} title="No users found" desc="Create the first user or run the seeder" />
                ) : (
                  <Table headers={['Name & Email', 'Role', 'Office', 'Last Login', 'Status', 'Actions']}>
                    {users.map((u) => (
                      <tr key={u._id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-200 text-sm">{u.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={ROLE_COLORS[u.role] || 'badge-gray'}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {u.office ? (
                            <div>
                              <div className="font-medium text-slate-300">{u.office.code}</div>
                              <div className="text-slate-500">{u.office.city}</div>
                            </div>
                          ) : <span className="text-slate-600">Ministry-level</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {u.lastLogin
                            ? formatDistanceToNow(new Date(u.lastLogin), { addSuffix: true })
                            : 'Never'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={u.isActive ? 'badge-green' : 'badge-red'}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {/* Edit */}
                            <button
                              onClick={() => setEditUser({ ...u })}
                              className="btn-ghost px-2 py-1 text-xs"
                              title="Edit user"
                            >
                              Edit
                            </button>
                            {/* Toggle active */}
                            <button
                              onClick={() => toggleActive(u)}
                              className="text-slate-500 hover:text-amber-400 transition-colors p-1"
                              title={u.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {u.isActive
                                ? <ToggleRight size={16} className="text-emerald-500" />
                                : <ToggleLeft size={16} />}
                            </button>
                            {/* Reset password */}
                            <button
                              onClick={() => { setShowResetPwd(u); setNewPwd(''); }}
                              className="text-slate-500 hover:text-brand-400 transition-colors p-1"
                              title="Reset password"
                            >
                              <KeyRound size={14} />
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(u._id)}
                              className="text-slate-600 hover:text-red-400 transition-colors p-1"
                              title="Delete user"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Table>
                )}
              </div>
            </div>
          )}

          {/* ── PENDING APPROVALS TAB ───────────────────────────────────────── */}
          {tab === 'pending' && (
            <div className="space-y-4">
              {pendingUsers.length === 0 ? (
                <div className="card p-10 text-center">
                  <UserCheck size={36} className="text-emerald-500 mx-auto mb-3" />
                  <p className="text-slate-300 font-medium">No pending approvals</p>
                  <p className="text-slate-500 text-sm mt-1">All registrations have been reviewed.</p>
                </div>
              ) : (
                <div className="card">
                  <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                    <Clock size={14} className="text-amber-400" />
                    <span className="text-sm font-medium text-amber-300">{pendingUsers.length} registration{pendingUsers.length > 1 ? 's' : ''} awaiting approval</span>
                  </div>
                  <Table headers={['Name & Email', 'Requested Role', 'Office', 'Registered', 'Actions']}>
                    {pendingUsers.map((u) => (
                      <tr key={u._id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-200 text-sm">{u.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={ROLE_COLORS[u.role] || 'badge-gray'}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {u.office ? (
                            <div>
                              <div className="font-medium text-slate-300">{u.office.code}</div>
                              <div className="text-slate-500">{u.office.city}</div>
                            </div>
                          ) : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(u._id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg font-medium transition-colors"
                            >
                              <UserCheck size={12} /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(u._id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/60 hover:bg-red-800 text-red-300 text-xs rounded-lg font-medium transition-colors"
                            >
                              <UserX size={12} /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Table>
                </div>
              )}
            </div>
          )}

          {/* ── OFFICES TAB ────────────────────────────────────────────── */}
          {tab === 'offices' && (
            <div className="card">
              {offices.length === 0 ? (
                <EmptyState icon={Building2} title="No offices found" desc="Run npm run seed in the server directory" />
              ) : (
                <Table headers={['#', 'Code', 'Office Name', 'City', 'State', 'Region', 'Officer-in-Charge', 'Status']}>
                  {offices.map((o, i) => (
                    <tr key={o._id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-600">{i + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-brand-400">{o.code}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-200">{o.name}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{o.city}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{o.state}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{o.region}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{o.officerInCharge || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={o.isActive ? 'badge-green' : 'badge-red'}>
                          {o.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </Table>
              )}
            </div>
          )}
        </>
      )}

      {/* ── CREATE USER MODAL ──────────────────────────────────────────── */}
      <Modal open={showCreateUser} onClose={() => setShowCreateUser(false)} title="Add New User Directly">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="label block mb-1.5">Full Name *</label>
            <input className="input" required value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label block mb-1.5">Email *</label>
            <input type="email" className="input" required value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
          </div>
          <div>
            <label className="label block mb-1.5">Password * (min. 8 characters)</label>
            <input type="password" className="input" required minLength={8} value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
          </div>
          <div>
            <label className="label block mb-1.5">Role *</label>
            <Select value={userForm.role}
              onChange={(v) => setUserForm({ ...userForm, role: v })}
              options={ROLES.map((r) => ({ value: r, label: r.replace('_', ' ') }))} />
          </div>
          {['office_admin', 'office_staff'].includes(userForm.role) && (
            <div>
              <label className="label block mb-1.5">Assigned Office</label>
              <Select value={userForm.office}
                onChange={(v) => setUserForm({ ...userForm, office: v })}
                options={offices.map((o) => ({ value: o._id, label: `${o.code} – ${o.city}` }))}
                placeholder="Select office" />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setShowCreateUser(false)} className="btn-ghost text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── INVITE MODAL ───────────────────────────────────────────────── */}
      <Modal open={showInvite} onClose={() => { setShowInvite(false); setInviteLink(''); }} title="Generate Invite Link">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Generate a time-limited link (48 hours) to invite someone to register with a pre-assigned role and office.
          </p>
          <form onSubmit={handleGenerateInvite} className="space-y-3">
            <div>
              <label className="label block mb-1.5">Role to assign *</label>
              <Select value={inviteForm.role}
                onChange={(v) => setInviteForm({ ...inviteForm, role: v })}
                options={ROLES.map((r) => ({ value: r, label: r.replace('_', ' ') }))} />
            </div>
            {['office_admin', 'office_staff'].includes(inviteForm.role) && (
              <div>
                <label className="label block mb-1.5">Office to assign</label>
                <Select value={inviteForm.officeId}
                  onChange={(v) => setInviteForm({ ...inviteForm, officeId: v })}
                  options={offices.map((o) => ({ value: o._id, label: `${o.code} – ${o.city}` }))}
                  placeholder="Select office" />
              </div>
            )}
            <div>
              <label className="label block mb-1.5">Pre-fill email (optional)</label>
              <input type="email" className="input" placeholder="invitee@tourism.gov.in"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full text-sm">
              {saving ? 'Generating…' : 'Generate Invite Link'}
            </button>
          </form>

          {inviteLink && (
            <div className="mt-3 p-3 rounded-lg bg-emerald-900/30 border border-emerald-800 space-y-2">
              <div className="text-xs text-emerald-400 font-medium">✓ Invite link generated (valid 48 hours)</div>
              <div className="font-mono text-xs text-slate-300 break-all bg-slate-900 p-2 rounded border border-slate-700">
                {inviteLink}
              </div>
              <button
                onClick={copyLink}
                className="btn-primary w-full text-sm flex items-center justify-center gap-2"
              >
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* ── EDIT USER MODAL ────────────────────────────────────────────── */}
      {editUser && (
        <Modal open onClose={() => setEditUser(null)} title="Edit User">
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <label className="label block mb-1.5">Full Name</label>
              <input className="input" value={editUser.name}
                onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} />
            </div>
            <div>
              <label className="label block mb-1.5">Email</label>
              <input className="input bg-slate-800/40 cursor-not-allowed" value={editUser.email} disabled />
            </div>
            <div>
              <label className="label block mb-1.5">Role</label>
              <Select value={editUser.role}
                onChange={(v) => setEditUser({ ...editUser, role: v })}
                options={ROLES.map((r) => ({ value: r, label: r.replace('_', ' ') }))} />
            </div>
            {['office_admin', 'office_staff'].includes(editUser.role) && (
              <div>
                <label className="label block mb-1.5">Office</label>
                <Select
                  value={editUser.office?._id || editUser.office || ''}
                  onChange={(v) => setEditUser({ ...editUser, office: v })}
                  options={offices.map((o) => ({ value: o._id, label: `${o.code} – ${o.city}` }))}
                  placeholder="Select office" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={editUser.isActive}
                onChange={(e) => setEditUser({ ...editUser, isActive: e.target.checked })}
                className="accent-brand-500" />
              <label htmlFor="isActive" className="text-sm text-slate-300">Account active</label>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setEditUser(null)} className="btn-ghost text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary text-sm">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── RESET PASSWORD MODAL ───────────────────────────────────────── */}
      {showResetPwd && (
        <Modal open onClose={() => { setShowResetPwd(null); setNewPwd(''); }} title="Reset Password">
          <form onSubmit={handleResetPwd} className="space-y-4">
            <p className="text-sm text-slate-400">
              Resetting password for <span className="text-slate-200 font-medium">{showResetPwd.name}</span> ({showResetPwd.email})
            </p>
            <div>
              <label className="label block mb-1.5">New Password (min. 8 characters)</label>
              <input type="password" className="input" required minLength={8}
                value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
                placeholder="Enter new password" autoFocus />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setShowResetPwd(null); setNewPwd(''); }} className="btn-ghost text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary text-sm">
                {saving ? 'Resetting…' : 'Reset Password'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
