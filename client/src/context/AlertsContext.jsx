import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useSocket } from './SocketContext';

const AlertsContext = createContext(null);

export const AlertsProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { on } = useSocket() || {};

  const fetchAlerts = useCallback(async () => {
    try {
      const { data } = await api.get('/alerts');
      setAlerts(data.alerts);
      setUnreadCount(data.alerts.filter((a) => !a.isRead).length);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Listen for new real-time alerts via socket
  useEffect(() => {
    if (!on) return;
    const unsub = on('alert:new', (alert) => {
      setAlerts((prev) => [alert, ...prev]);
      setUnreadCount((c) => c + 1);
    });
    return unsub;
  }, [on]);

  const markRead = async (id) => {
    try {
      await api.patch(`/alerts/${id}/read`);
      setAlerts((prev) =>
        prev.map((a) => (a._id === id ? { ...a, isRead: true } : a))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silently fail
    }
  };

  const markAllRead = async () => {
    await api.patch('/alerts/mark-all-read');
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    setUnreadCount(0);
  };

  const deleteAlert = async (id) => {
    await api.delete(`/alerts/${id}`);
    setAlerts((prev) => {
      const updated = prev.filter((a) => a._id !== id);
      setUnreadCount(updated.filter((a) => !a.isRead).length);
      return updated;
    });
  };

  return (
    <AlertsContext.Provider value={{ alerts, unreadCount, markRead, markAllRead, deleteAlert, refetch: fetchAlerts }}>
      {children}
    </AlertsContext.Provider>
  );
};

export const useAlertsContext = () => {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error('useAlertsContext must be inside AlertsProvider');
  return ctx;
};
