import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

// ── Dashboard summary ────────────────────────────────────────────────────────
export const useDashboard = (financialYear = '2024-25') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { on } = useSocket() || {};

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get(`/dashboard/summary?financialYear=${financialYear}`);
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [financialYear]);

  useEffect(() => { fetch(); }, [fetch]);

  // Live updates on new activity
  useEffect(() => {
    if (!on) return;
    const unsub = on('activity:new', () => fetch());
    const unsub2 = on('activity:updated', () => fetch());
    return () => { unsub?.(); unsub2?.(); };
  }, [on, fetch]);

  return { data, loading, error, refetch: fetch };
};

// ── Activities ────────────────────────────────────────────────────────────────
export const useActivities = (params = {}) => {
  const [activities, setActivities] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      // IMPORTANT: URLSearchParams serializes `undefined` into the string "undefined",
      // which breaks server-side filtering when the user clears a filter.
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        queryParams.set(key, String(value));
      });
      const query = queryParams.toString();
      const { data } = await api.get(`/activities?${query}`);
      setActivities(data.activities);
      setTotal(data.total);
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch]);
  return { activities, total, loading, refetch: fetch };
};

// ── AAP Targets ───────────────────────────────────────────────────────────────
export const useAAPTargets = (officeId, financialYear = '2024-25') => {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ financialYear });
    if (officeId) params.set('officeId', officeId);
    api.get(`/aap?${params}`)
      .then(({ data }) => setTargets(data.targets))
      .catch(() => setTargets([]))
      .finally(() => setLoading(false));
  }, [officeId, financialYear]);

  return { targets, loading };
};

// ── Alerts ────────────────────────────────────────────────────────────────────
export const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { on } = useSocket() || {};

  const fetch = useCallback(async () => {
    const { data } = await api.get('/alerts');
    setAlerts(data.alerts);
    setUnreadCount(data.alerts.filter((a) => !a.isRead).length);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!on) return;
    const unsub = on('alert:new', (alert) => {
      setAlerts((prev) => [alert, ...prev]);
      setUnreadCount((c) => c + 1);
    });
    return unsub;
  }, [on]);

  const markRead = async (id) => {
    await api.patch(`/alerts/${id}/read`);
    setAlerts((prev) => prev.map((a) => (a._id === id ? { ...a, isRead: true } : a)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  return { alerts, unreadCount, markRead, refetch: fetch };
};

// ── Trend data ────────────────────────────────────────────────────────────────
export const useTrends = (days = 30, officeId) => {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ days });
    if (officeId) params.set('officeId', officeId);
    api.get(`/dashboard/trends?${params}`)
      .then(({ data }) => setTrends(data.trends))
      .catch(() => setTrends([]))
      .finally(() => setLoading(false));
  }, [days, officeId]);

  return { trends, loading };
};

// ── Category breakdown ────────────────────────────────────────────────────────
export const useCategoryBreakdown = (officeId) => {
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = officeId ? `?officeId=${officeId}` : '';
    api.get(`/dashboard/category-breakdown${params}`)
      .then(({ data }) => setBreakdown(data.breakdown))
      .catch(() => setBreakdown([]))
      .finally(() => setLoading(false));
  }, [officeId]);

  return { breakdown, loading };
};
