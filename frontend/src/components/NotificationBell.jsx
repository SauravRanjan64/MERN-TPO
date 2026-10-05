// NotificationBell component with badge, dropdown and toast
import React, { useContext, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from './api';

const NotificationBell = () => {
  const { user, socket } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [toast, setToast] = useState(null);

  // Load latest 20 notifications
  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data || []);
      const unseen = (res.data || []).filter(n => !n.isRead).length;
      setUnreadCount(unseen);
    } catch {
      // Ignore background notification fetch errors
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user]);

  // Listen for real‑time notifications via socket.io
  useEffect(() => {
    if (!socket) return;
    const handler = (payload) => {
      // prepend to list
      setNotifications(prev => [{ _id: payload.id, message: payload.message, isRead: false }, ...prev].slice(0, 20));
      setUnreadCount(prev => prev + 1);
      setToast(payload.message);
    };
    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, [socket]);

  // Auto‑dismiss toast after 3 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const markAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all', {});
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore background notification mark read errors
    }
  };

  return (
    <div className="relative inline-block">
      <button
        className="relative focus:outline-none"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Bell size={24} className="text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-xs rounded-full w-5 h-5 flex items-center justify-center text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md z-10 max-h-96 overflow-y-auto">
          <div className="p-2 flex justify-between items-center border-b">
            <span className="font-semibold">Notifications</span>
            <button onClick={markAllRead} className="text-sm text-blue-600">Mark all read</button>
          </div>
          <ul className="divide-y">
            {notifications.map((n) => (
              <li key={n._id} className={`p-2 ${n.isRead ? '' : 'bg-gray-100'}`}>
                {n.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="absolute right-0 mt-12 bg-gray-800 text-white px-4 py-2 rounded shadow-md animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
