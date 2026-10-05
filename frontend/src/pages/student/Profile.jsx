// Student profile management: view academic record, update contact and skills, consent, and resume upload
import React, { useEffect, useState } from 'react';
import { User, Phone, BookOpen, FileText, Upload, CheckCircle2 } from 'lucide-react';
import api from '../../components/api';
import Message from '../../components/Message';

// Manage student profile details, placement consent agreement, and resume text extraction
const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [consent, setConsent] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Fetch student profile data from the backend
  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/student/me');
      const student = res.data.student || {};
      setProfile(student);
      setPhone(student.phone || '');
      setSkills(Array.isArray(student.skills) ? student.skills.join(', ') : '');
      setConsent(!!student.consent);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Save editable contact phone, skills, and placement consent status
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotice('');
    setError('');
    try {
      const skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
      await api.put('/api/student/me', { phone, skills: skillsArray });
      await api.put('/api/student/consent', { consent });
      setNotice('Profile and consent updated successfully.');
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Upload PDF resume file to extract plain text for skill matching
  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file only.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Resume file size must be less than 2 MB.');
      return;
    }

    setUploading(true);
    setNotice('');
    setError('');
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await api.post('/api/student/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setNotice(res.data?.message || 'Resume uploaded successfully.');
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Resume upload failed.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Message type="loading" message="Loading your profile…" />;

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Student Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Academic details are verified by the university. You can update your phone, skills, and resume.
        </p>
      </div>

      {notice && (
        <div className="flex items-center space-x-2 rounded-xl bg-green-50 p-4 text-sm font-medium text-green-800 border border-green-200">
          <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {/* Read-Only Academic Record */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-800 flex items-center space-x-2">
          <BookOpen size={18} className="text-primary" />
          <span>Academic Information (Read-Only)</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
            <span className="block text-xs text-gray-400">Roll Number</span>
            <span className="font-semibold text-gray-800">{profile?.rollNo || 'Not Assigned'}</span>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
            <span className="block text-xs text-gray-400">Branch</span>
            <span className="font-semibold text-gray-800">{profile?.branch || 'N/A'}</span>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
            <span className="block text-xs text-gray-400">Graduation Batch</span>
            <span className="font-semibold text-gray-800">{profile?.batch || 'N/A'}</span>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
            <span className="block text-xs text-gray-400">CGPA</span>
            <span className="font-semibold text-gray-800">{profile?.cgpa != null ? profile.cgpa : 'N/A'}</span>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
            <span className="block text-xs text-gray-400">Active Backlogs</span>
            <span className="font-semibold text-gray-800">{profile?.backlogs != null ? profile.backlogs : '0'}</span>
          </div>
        </div>
      </section>

      {/* Resume Upload Section */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-800 flex items-center space-x-2">
          <FileText size={18} className="text-primary" />
          <span>Resume & Skill Analysis</span>
        </h2>
        <p className="text-xs text-gray-500">
          Upload your resume in PDF format (max 2 MB). Skills will be parsed and matched against job requirements.
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="cursor-pointer inline-flex items-center px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-gray-700 transition">
            <Upload size={16} className="mr-2 text-primary" />
            <span>{uploading ? 'Processing Resume…' : 'Choose PDF Resume'}</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleResumeUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <span className="text-xs text-gray-500">
            {profile?.resumeText
              ? `✓ Resume uploaded (${profile.resumeText.length} characters parsed)`
              : 'No resume uploaded yet.'}
          </span>
        </div>
      </section>

      {/* Editable Contact & Skills Form */}
      <form onSubmit={handleSaveProfile} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-5">
        <h2 className="text-base font-bold text-gray-800 flex items-center space-x-2">
          <User size={18} className="text-primary" />
          <span>Contact Details & Technical Skills</span>
        </h2>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 text-gray-400" size={16} />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">
            Companies and admins see a masked version of this number for privacy.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Technical Skills (comma-separated)
          </label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. React, Node.js, Python, SQL, C++"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="pt-2 border-t border-gray-100">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-xs text-gray-700">
              I agree to the university placement policies and give consent to share my academic and resume details with recruiters.
            </span>
          </label>
        </div>

        {/* ONE big primary button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-primary py-3.5 px-4 text-center font-bold text-white shadow hover:bg-blue-700 disabled:opacity-60 transition"
        >
          {saving ? 'Saving Changes…' : 'Save Profile Changes'}
        </button>
      </form>
    </main>
  );
};

export default StudentProfile;
