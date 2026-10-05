import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Return target home route based on user role
const getHomeForRole = (role) => {
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'COMPANY') return '/company/dashboard';
  return '/student/home';
};

// Seed demo accounts for quick one-click access
const DEMO_ACCOUNTS = [
  { label: 'Student', emoji: '🎓', email: 'rahul@student.com', password: 'pass123', color: 'bg-blue-50 border-blue-300 text-blue-700' },
  { label: 'Company', emoji: '🏢', email: 'tcs@company.com',   password: 'tcs123',  color: 'bg-amber-50 border-amber-300 text-amber-700' },
  { label: 'Admin',   emoji: '🛡️', email: 'admin@dcrust.com', password: 'admin123', color: 'bg-green-50 border-green-300 text-green-700' },
];

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null); // which demo role is loading

  // Handle normal form submit
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(getHomeForRole(user.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Log in instantly with a demo account credential
  const handleDemoLogin = async (account) => {
    setError('');
    setDemoLoading(account.label);
    try {
      const user = await login(account.email, account.password);
      navigate(getHomeForRole(user.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Demo login failed. Run "npm run seed" in the backend folder.');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <main className="mx-auto mt-8 max-w-md rounded-lg bg-white p-6 shadow">
      <h1 className="mb-1 text-2xl font-bold">Sign in</h1>
      <p className="mb-6 text-sm text-gray-500">DCRUST Placement Portal</p>

      {location.state?.message && <p className="mb-4 text-green-700">{location.state.message}</p>}
      {error && <p role="alert" className="mb-4 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      {/* Main login form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Email</span>
          <input className="w-full rounded border p-3 text-base" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Password</span>
          <input className="w-full rounded border p-3 text-base" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="w-full rounded bg-primary p-3 text-base font-semibold text-white active:scale-95 disabled:opacity-60" type="submit" disabled={submitting || demoLoading}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-4 text-sm text-center text-gray-500">New to the portal? <Link className="text-primary underline" to="/register">Create a student account</Link></p>

      {/* Demo accounts section */}
      <div className="mt-6 border-t pt-5">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">⚡ Try a demo account</p>
        <div className="flex flex-col gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.label}
              onClick={() => handleDemoLogin(account)}
              disabled={!!demoLoading || submitting}
              className={`flex min-h-[44px] items-center justify-between rounded-lg border px-4 py-2 text-sm font-medium active:scale-95 disabled:opacity-60 ${account.color}`}
            >
              {/* Role label with emoji */}
              <span>{account.emoji} {account.label}</span>
              {/* Show email and spinner/arrow */}
              <span className="flex items-center gap-2 text-xs opacity-70">
                {account.email}
                {demoLoading === account.label ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
                )}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-gray-400">Demo data: run <code className="rounded bg-gray-100 px-1">npm run seed</code> in /backend</p>
      </div>
    </main>
  );
};

export default Login;
