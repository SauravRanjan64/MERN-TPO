// Login + Register page (toggle between the two forms)
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false); // toggle login/register
  const [form, setForm] = useState({ name: '', email: '', password: '', branch: '', cgpa: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect
  if (user) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/student'} />;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      let loggedUser;
      if (isRegister) {
        loggedUser = await register({
          name: form.name, email: form.email, password: form.password,
          branch: form.branch, cgpa: Number(form.cgpa) || 0
        });
      } else {
        loggedUser = await login(form.email, form.password);
      }
      navigate(loggedUser.role === 'ADMIN' ? '/admin' : '/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Fill form with demo credentials
  const fillAdmin = () => setForm({ ...form, email: 'admin@dcrust.com', password: 'admin123' });
  const fillStudent = () => setForm({ ...form, email: 'rahul@student.com', password: 'pass123' });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{isRegister ? 'Student Registration' : 'Login'}</h2>

        {!isRegister && (
          <div className="demo-buttons">
            <button type="button" onClick={fillAdmin} className="btn btn-sm btn-outline">Fill Admin Demo</button>
            <button type="button" onClick={fillStudent} className="btn btn-sm btn-outline">Fill Student Demo</button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
              <input name="branch" placeholder="Branch (e.g. CSE)" value={form.branch} onChange={handleChange} />
              <input name="cgpa" placeholder="CGPA (e.g. 8.5)" type="number" step="0.1" min="0" max="10" value={form.cgpa} onChange={handleChange} />
            </>
          )}
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />

          {error && <p className="error-msg">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Please wait...' : (isRegister ? 'Register' : 'Login')}
          </button>

          {submitting && (
            <p className="hint">Server may take up to a minute to wake up on first try.</p>
          )}
        </form>

        <p className="toggle-text">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" className="link-btn" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}
