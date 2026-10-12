// Reset password page: handles setting new password using token from reset link
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useToast } from '../ToastContext';
import Button from '../components/Button';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Submit new password with the token
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/api/auth/reset-password/${token}`, { password });
      toast.success(res.data.message || 'Password reset successfully!');
      navigate('/login');
    } catch (err) {
      console.error('Reset password error:', err.message);
      toast.error(err.response?.data?.message || 'Password reset link is invalid or expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Reset Password</h2>
        <p className="hint" style={{ marginBottom: '1rem' }}>
          Enter a new password for your account (at least 6 characters).
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            className="btn btn-primary btn-block"
            loading={submitting}
            loadingText="Resetting..."
          >
            Reset Password
          </Button>

          <p className="toggle-text">
            <Link to="/login" className="link-btn">Back to Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
