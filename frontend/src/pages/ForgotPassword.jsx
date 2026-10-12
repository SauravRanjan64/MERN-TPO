// Forgot password page: request password reset link via email
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useToast } from '../ToastContext';
import Button from '../components/Button';

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Submit email for password reset
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/api/auth/forgot-password', { email: email.trim() });
      toast.success(res.data.message);
      setSubmitted(true);
    } catch (err) {
      console.error('Forgot password error:', err.message);
      toast.error(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Forgot Password</h2>
        <p className="hint" style={{ marginBottom: '1rem' }}>
          Enter your registered email address and we will send you a link to reset your password.
        </p>

        {submitted ? (
          <div>
            <p className="success-msg" style={{ textAlign: 'center', marginBottom: '1rem' }}>
              If an account exists with that email, a password reset link has been sent. Check your inbox (or console if running locally)!
            </p>
            <p className="toggle-text">
              <Link to="/login" className="link-btn">Return to Login</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="btn btn-primary btn-block"
              loading={submitting}
              loadingText="Sending link..."
            >
              Send Reset Link
            </Button>

            <p className="toggle-text">
              Remember your password?{' '}
              <Link to="/login" className="link-btn">Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
