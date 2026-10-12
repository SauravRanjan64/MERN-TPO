// Student Profile page: view and update branch, CGPA, phone, and skills
import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import Button from '../components/Button';
import api from '../api';

export default function StudentProfile() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    branch: '',
    cgpa: '',
    phone: '',
    skillsInput: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill form with current user details when component loads or user updates
  useEffect(() => {
    if (user) {
      setForm({
        branch: user.branch || '',
        cgpa: user.cgpa !== undefined && user.cgpa !== null ? String(user.cgpa) : '',
        phone: user.phone || '',
        skillsInput: Array.isArray(user.skills) ? user.skills.join(', ') : ''
      });
    }
  }, [user]);

  // Handle standard text inputs
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Submit profile updates to backend API
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Front-end check: branch must not be empty
    if (!form.branch.trim()) {
      toast.error('Branch cannot be empty.');
      return;
    }

    // Front-end check: CGPA must be a number between 0 and 10
    const numCgpa = Number(form.cgpa);
    if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
      toast.error('CGPA must be between 0 and 10.');
      return;
    }

    // Front-end check: phone should be empty or 10 digits
    const trimmedPhone = form.phone.trim();
    if (trimmedPhone !== '' && !/^\d{10}$/.test(trimmedPhone)) {
      toast.error('Phone must be empty or a 10-digit number.');
      return;
    }

    // Convert comma-separated string to an array of trimmed skill tags
    const skillsArray = form.skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    setSubmitting(true);
    try {
      const res = await api.put('/api/profile', {
        branch: form.branch.trim(),
        cgpa: numCgpa,
        phone: trimmedPhone,
        skills: skillsArray
      });

      // Update AuthContext so changes reflect everywhere in the app immediately
      updateUser(res.data.user);
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Update profile failed:', err.message);
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="card profile-card">
        <h2>Student Profile</h2>
        <p className="hint">View and edit your academic and contact details.</p>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Full Name (Read-only)</label>
            <input type="text" value={user?.name || ''} disabled readOnly />
          </div>

          <div className="form-group">
            <label>Email (Read-only)</label>
            <input type="email" value={user?.email || ''} disabled readOnly />
          </div>

          <div className="form-group">
            <label>Branch</label>
            <input
              type="text"
              name="branch"
              placeholder="e.g. Computer Science and Engineering"
              value={form.branch}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>CGPA (0 to 10)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              name="cgpa"
              placeholder="e.g. 8.5"
              value={form.cgpa}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number (10 digits)</label>
            <input
              type="tel"
              name="phone"
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Skills (comma separated)</label>
            <input
              type="text"
              name="skillsInput"
              placeholder="e.g. React, Node.js, Python, MongoDB"
              value={form.skillsInput}
              onChange={handleChange}
            />
          </div>

          <Button
            type="submit"
            className="btn btn-primary"
            loading={submitting}
            loadingText="Saving..."
          >
            Save Profile
          </Button>
        </form>
      </div>
    </div>
  );
}
