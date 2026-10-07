// Auth context: provides user state, login/register/logout to all components
import { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);     // current logged-in user
  const [loading, setLoading] = useState(true); // true while checking token on startup

  // On app start, if we have a token, fetch the user
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/api/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('token'); // token was bad
      })
      .finally(() => setLoading(false));
  }, []);

  // Login: send email+password, save token, set user
  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  // Register: send student details, save token, set user
  const register = async (data) => {
    const res = await api.post('/api/auth/register', data);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  // Logout: clear everything
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook so components can do: const { user, login, ... } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
