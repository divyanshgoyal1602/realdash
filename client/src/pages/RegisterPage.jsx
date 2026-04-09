import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Eye, EyeOff, Lock, Mail, User, Building2,
  CheckCircle2, XCircle, AlertCircle, ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';

// Password strength checker
const checkStrength = (pwd) => {
  const checks = {
    length:    pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number:    /[0-9]/.test(pwd),
    special:   /[!@#$%^&*()_+\-=[\]{}|;',./:<>?]/.test(pwd),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { checks, score };
};

const StrengthBar = ({ score }) => {
  const levels = [
    { label: 'Very weak', color: 'bg-red-500' },
    { label: 'Weak',      color: 'bg-orange-500' },
    { label: 'Fair',      color: 'bg-amber-500' },
    { label: 'Good',      color: 'bg-brand-500' },
    { label: 'Strong',    color: 'bg-emerald-500' },
  ];
  const level = levels[Math.min(score - 1, 4)] || levels[0];
  if (!score) return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={clsx(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i <= score ? level.color : 'bg-slate-700'
            )}
          />
        ))}
      </div>
      <span className="text-xs text-slate-500">{level.label}</span>
    </div>
  );
};

const RequirementRow = ({ met, label }) => (
  <div className={clsx('flex items-center gap-2 text-xs transition-colors', met ? 'text-emerald-400' : 'text-slate-500')}>
    {met ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
    {label}
  </div>
);

const SELF_REGISTER_ROLES = [
  { value: 'viewer',       label: 'Viewer – read-only access' },
  { value: 'office_staff', label: 'Office Staff – log activities for my office' },
];

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');

  const [offices, setOffices] = useState([]);
  const [inviteData, setInviteData] = useState(null); // decoded from invite token preview
  const [step, setStep] = useState(1); // 1 = account info, 2 = role & office, 3 = success

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'viewer',
    office: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { checks, score } = checkStrength(form.password);

  useEffect(() => {
    // Load offices for the dropdown (public endpoint, no auth required)
    api.get('/public/offices')
      .then(({ data }) => setOffices(data.offices || []))
      .catch(() => {});

    // If invite token present, try to decode it for display
    if (inviteToken) {
      try {
        // Base64 decode the payload section (middle part)
        const payload = JSON.parse(atob(inviteToken.split('.')[1]));
        setInviteData(payload);
        // Pre-fill role and office from invite
        setForm((f) => ({
          ...f,
          role: payload.role || 'office_staff',
          office: payload.officeId || '',
          email: payload.email || '',
        }));
      } catch {
        // ignore – server will validate it
      }
    }
  }, [inviteToken]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Minimum 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
        office: form.office || undefined,
        inviteToken: inviteToken || undefined,
      };

      const { data } = await api.post('/auth/register', payload);

      if (data.pending) {
        // Self-registered — needs admin approval, do NOT auto-login
        setStep(3);
      } else {
        // Invite-based — auto-login immediately
        await login(form.email, form.password);
        setStep(3);
        setTimeout(() => {
          navigate('/');
          toast.success('Welcome to RealDash!');
        }, 2000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
      if (msg.toLowerCase().includes('email')) {
        setErrors({ email: msg });
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  // Success / pending step
  if (step === 3) {
    const isPending = !inviteToken; // self-registered = pending approval
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center animate-fade-up max-w-sm">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${
            isPending
              ? 'bg-amber-900/40 border border-amber-700'
              : 'bg-emerald-900/40 border border-emerald-700'
          }`}>
            {isPending
              ? <AlertCircle size={40} className="text-amber-400" />
              : <CheckCircle2 size={40} className="text-emerald-400" />}
          </div>
          {isPending ? (
            <>
              <h1 className="font-display text-2xl font-semibold text-slate-100 mb-2">Registration Submitted!</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Your account is <span className="text-amber-400 font-medium">pending admin approval</span>.
                You'll be able to log in once an administrator approves your request.
              </p>
              <p className="text-slate-600 text-xs mt-3">You may close this page.</p>
              <Link to="/login" className="mt-5 inline-block text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors">
                ← Back to Login
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-semibold text-slate-100 mb-2">Registration Successful!</h1>
              <p className="text-slate-400 text-sm">Logging you in and taking you to the dashboard…</p>
              <div className="mt-5 flex justify-center">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-saffron-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-saffron-500 flex items-center justify-center text-white font-display font-bold text-lg mx-auto mb-3 shadow-lg shadow-brand-900/50">
            R
          </div>
          <h1 className="font-display text-xl font-semibold text-slate-100">Create your RealDash account</h1>
          <p className="text-slate-500 text-sm mt-0.5">India Tourism Offices Monitoring System</p>
        </div>

        {/* Invite banner */}
        {inviteData && (
          <div className="mb-4 p-3 rounded-lg bg-brand-900/40 border border-brand-700/50 flex items-start gap-3">
            <AlertCircle size={16} className="text-brand-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-brand-300">
              <span className="font-medium">You have been invited</span> to join as{' '}
              <span className="font-mono capitalize">{inviteData.role?.replace('_', ' ')}</span>
              {inviteData.officeId && ' for a specific office'}. Your role will be set automatically.
            </div>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-5">
          {[
            { n: 1, label: 'Account' },
            { n: 2, label: 'Role & Office' },
          ].map((s, i) => (
            <React.Fragment key={s.n}>
              <div className={clsx(
                'flex items-center gap-1.5 text-xs font-medium transition-colors',
                step >= s.n ? 'text-brand-300' : 'text-slate-600'
              )}>
                <div className={clsx(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors',
                  step > s.n ? 'bg-emerald-600 text-white' :
                  step === s.n ? 'bg-brand-600 text-white' :
                  'bg-slate-800 text-slate-600'
                )}>
                  {step > s.n ? '✓' : s.n}
                </div>
                {s.label}
              </div>
              {i < 1 && (
                <div className={clsx('flex-1 h-px transition-colors', step > 1 ? 'bg-brand-600' : 'bg-slate-800')} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="card p-6 shadow-2xl">

          {/* ─── STEP 1: Account Info ─────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="label block mb-1.5">Full Name *</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Sh. Rajiv Kumar"
                    className={clsx('input pl-9', errors.name && 'border-red-500 focus:ring-red-500')}
                    autoFocus
                  />
                </div>
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="label block mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="you@tourism.gov.in"
                    className={clsx('input pl-9', errors.email && 'border-red-500 focus:ring-red-500')}
                    disabled={!!(inviteData?.email)}
                  />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="label block mb-1.5">Password *</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    placeholder="Min. 8 characters"
                    className={clsx('input pl-9 pr-10', errors.password && 'border-red-500 focus:ring-red-500')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}

                {/* Strength meter */}
                {form.password && (
                  <div className="mt-2">
                    <StrengthBar score={score} />
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2">
                      <RequirementRow met={checks.length}    label="At least 8 characters" />
                      <RequirementRow met={checks.uppercase} label="Uppercase letter" />
                      <RequirementRow met={checks.lowercase} label="Lowercase letter" />
                      <RequirementRow met={checks.number}    label="Number" />
                      <RequirementRow met={checks.special}   label="Special character" />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="label block mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => set('confirmPassword', e.target.value)}
                    placeholder="Repeat your password"
                    className={clsx('input pl-9 pr-10', errors.confirmPassword && 'border-red-500 focus:ring-red-500')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Passwords match
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 mt-1"
              >
                Next: Role &amp; Office <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* ─── STEP 2: Role & Office ────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="label block mb-1.5">Select Role *</label>
                {inviteData ? (
                  // If invite, show role as read-only
                  <div className="input flex items-center gap-2 text-slate-300 bg-slate-800/80 cursor-not-allowed">
                    <span className="capitalize">{form.role.replace('_', ' ')}</span>
                    <span className="ml-auto badge-blue text-[10px]">Set by invite</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {SELF_REGISTER_ROLES.map((r) => (
                      <label
                        key={r.value}
                        className={clsx(
                          'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                          form.role === r.value
                            ? 'border-brand-500 bg-brand-900/30'
                            : 'border-slate-700 hover:border-slate-600'
                        )}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={r.value}
                          checked={form.role === r.value}
                          onChange={() => set('role', r.value)}
                          className="mt-0.5 accent-brand-500"
                        />
                        <div>
                          <div className="text-sm font-medium text-slate-200 capitalize">
                            {r.value.replace('_', ' ')}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{r.label.split('–')[1]?.trim()}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <p className="text-xs text-slate-600 mt-2">
                  Need admin or ministry access? Contact your system administrator.
                </p>
              </div>

              {/* Office selection (only for office_staff or if invite has an office) */}
              {(form.role === 'office_staff' || inviteData?.officeId) && (
                <div>
                  <label className="label block mb-1.5">
                    <Building2 size={12} className="inline mr-1" />
                    Assigned Office *
                  </label>
                  {inviteData?.officeId ? (
                    <div className="input text-slate-300 bg-slate-800/80 cursor-not-allowed">
                      {offices.find((o) => o._id === inviteData.officeId)?.name || 'Loading…'}
                      <span className="ml-2 badge-blue text-[10px]">Set by invite</span>
                    </div>
                  ) : (
                    <select
                      value={form.office}
                      onChange={(e) => set('office', e.target.value)}
                      className="input"
                    >
                      <option value="">Select your office…</option>
                      {offices.map((o) => (
                        <option key={o._id} value={o._id}>
                          {o.code} – {o.name.replace('India Tourism ', '')} ({o.city})
                        </option>
                      ))}
                    </select>
                  )}
                  {form.role === 'office_staff' && !form.office && !inviteData?.officeId && (
                    <p className="text-amber-400 text-xs mt-1">Please select your office to log activities</p>
                  )}
                </div>
              )}

              {/* Summary before submit */}
              <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700 space-y-2 text-sm">
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">Account Summary</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Name</span>
                  <span className="text-slate-200">{form.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email</span>
                  <span className="text-slate-200">{form.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Role</span>
                  <span className="text-slate-200 capitalize">{form.role.replace('_', ' ')}</span>
                </div>
                {form.office && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Office</span>
                    <span className="text-slate-200 text-right max-w-[200px] truncate">
                      {offices.find((o) => o._id === form.office)?.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-ghost flex-1 text-sm"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating account…
                    </>
                  ) : 'Create Account'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Link to login */}
        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Sign in here
          </Link>
        </p>

        <p className="text-center text-xs text-slate-700 mt-3">
          Ministry of Tourism, Government of India
        </p>
      </div>
    </div>
  );
}
