import React, { useEffect, useState, createContext } from 'react';
import io from 'socket.io-client';
import api from '../components/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get('/api/auth/me');
        setUser(res.data.user);
      } catch (err) {
        setUser(null);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    fetchMe();

    const handleUnauthorized = () => {
      setUser(null);
      // optionally trigger redirect, but components watching `user` via ProtectedRoute should handle it
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // Initialize socket after we know user is logged in
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem('token');
    let rawBaseURL = import.meta.env.VITE_BACKEND_URL || '';
    const baseURL = rawBaseURL.replace(/\/+$/, '') || 'http://localhost:5000';
    
    const s = io(baseURL, {
      withCredentials: true,
      transports: ['polling', 'websocket'],
      auth: { token },
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });
    setSocket(s);
    return () => s.disconnect();
  }, [user]);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
    }
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout', {});
    } catch (e) {
      console.warn('Logout failed', e);
    }
    localStorage.removeItem('token');
    setUser(null);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, socket, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
