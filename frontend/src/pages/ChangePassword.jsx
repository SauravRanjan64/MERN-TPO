// Change password page for logged-in users (students and admins)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useToast } from '../ToastContext';
import Button from '../components/Button';

export default function ChangePassword() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Handle form input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Submit password change request to the backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check that current password is entered
    if (!form.currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }

    // Check minimum length of new password
    if (form.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }

    // Check that new password and confirm password match
    if (form.newPassword !== form.confirmPassword) {
      toast.error('New password and confirm password do not match.');
      return;
    }

    // Check that new password is not identical to current password
    if (form.newPassword === form.currentPassword) {
      toast.error('New password must be different from your current password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.put('/api/auth/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });

      toast.success(res.data.message || 'Password changed successfully!');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      // Redirect back to home / dashboard
      navigate('/');
    } catch (err) {
      console.error('Change password failed:', err.message);
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="card profile-card">
        <h2>Change Password</h2>
        <p className="hint">Ensure your account is using a secure password (at least 6 characters).</p>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              name="currentPassword"
              placeholder="Enter your current password"
              value={form.currentPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>New Password (min 6 characters)</label>
            <input
              type="password"
              name="newPassword"
              placeholder="Enter new password"
              value={form.newPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <Button
            type="submit"
            className="btn btn-primary"
            loading={submitting}
            loadingText="Updating Password..."
          >
            Change Password
          </Button>
        </form>
      </div>
    </div>
  );
}
