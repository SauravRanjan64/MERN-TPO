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
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  // Initialize socket after we know user (or even before)
  useEffect(() => {
    const s = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket']
    });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    await api.post('/api/auth/logout', {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, socket, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
