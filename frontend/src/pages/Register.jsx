import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../components/api';

// Student account registration view
const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Submit registration payload to create new STUDENT user
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/api/auth/register', { name, email, password });
      navigate('/login', { replace: true, state: { message: 'Account created. Sign in to continue.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto mt-12 max-w-md rounded-lg bg-white p-6 shadow">
      <h1 className="mb-6 text-2xl font-bold">Create a student account</h1>
      {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block">Full name</span>
          <input className="w-full rounded border p-2" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block">Email</span>
          <input className="w-full rounded border p-2" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block">Password</span>
          <input className="w-full rounded border p-2" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <button className="w-full rounded bg-primary p-2 font-semibold text-white disabled:opacity-60" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-sm">Already registered? <Link className="text-primary underline" to="/login">Sign in</Link></p>
    </main>
  );
};

export default Register;
