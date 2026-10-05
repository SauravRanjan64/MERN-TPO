// Admin students directory and enrollment management
import React, { useEffect, useState } from 'react';
import { Users, Search, Filter, Plus, Phone, Mail, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';
import api from '../../components/api';
import Message from '../../components/Message';

const emptyStudentForm = {
  name: '',
  email: '',
  password: '',
  rollNo: '',
  branch: 'CSE',
  batch: '2024',
  cgpa: '',
  backlogs: '0',
  phone: '',
};

// Admin panel for student records search, branch filtering, and new student enrollment
const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');
  const [form, setForm] = useState(emptyStudentForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Fetch all students filtered by optional branch and search terms
  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (branch) query.append('branch', branch);
      const res = await api.get(`/api/admin/students?${query.toString()}`);
      setStudents(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load students list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [branch]);

  // Handle form field change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Create a new student user and linked academic profile
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setNotice('');

    const payload = {
      ...form,
      cgpa: form.cgpa ? Number(form.cgpa) : undefined,
      backlogs: form.backlogs !== '' ? Number(form.backlogs) : 0,
      batch: form.batch ? Number(form.batch) : undefined,
    };

    try {
      await api.post('/api/admin/students', payload);
      setNotice(`Student account for ${form.name} created successfully.`);
      setForm(emptyStudentForm);
      setIsFormOpen(false);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll student.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Student Directory</h1>
          <p className="mt-1 text-sm text-gray-500">
            View registered students, verified academic records, and enroll new candidates.
          </p>
        </div>
      </div>

      {notice && (
        <div className="rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-800 border border-green-200">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {/* Add Student Form (Collapsible) */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="w-full flex items-center justify-between p-5 text-left font-bold text-gray-900 bg-gray-50 hover:bg-gray-100 transition"
        >
          <span className="flex items-center space-x-2 text-base">
            <Plus size={18} className="text-primary" />
            <span>Add New Student Profile</span>
          </span>
          {isFormOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {isFormOpen && (
          <form onSubmit={handleCreateStudent} className="p-5 space-y-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. rahul@dcrust.ac.in"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Initial Password *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Roll Number *
                </label>
                <input
                  type="text"
                  name="rollNo"
                  required
                  value={form.rollNo}
                  onChange={handleChange}
                  placeholder="e.g. 20001001050"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Branch *
                </label>
                <select
                  name="branch"
                  value={form.branch}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="ME">ME</option>
                  <option value="EE">EE</option>
                  <option value="CE">CE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Graduation Batch *
                </label>
                <input
                  type="number"
                  name="batch"
                  value={form.batch}
                  onChange={handleChange}
                  placeholder="2024"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  CGPA
                </label>
                <input
                  type="number"
                  step="any"
                  name="cgpa"
                  value={form.cgpa}
                  onChange={handleChange}
                  placeholder="e.g. 8.25"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Active Backlogs
                </label>
                <input
                  type="number"
                  name="backlogs"
                  value={form.backlogs}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-primary py-3.5 px-4 font-bold text-white shadow hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {submitting ? 'Enrolling Student…' : 'Enroll Student'}
            </button>
          </form>
        )}
      </section>

      {/* Search & Filter Bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by student name, roll number, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
            className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="ECE">ECE</option>
            <option value="ME">ME</option>
            <option value="EE">EE</option>
            <option value="CE">CE</option>
          </select>
        </div>
      </div>

      {/* Students List */}
      <section className="space-y-4">
        {loading ? (
          <Message type="loading" message="Loading student records…" />
        ) : students.length === 0 ? (
          <Message
            type="empty"
            title="No Students Found"
            message="No registered student records match the active search or branch filter."
          />
        ) : (
          <div className="space-y-3">
            {students.map((student) => (
              <div
                key={student._id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-base font-bold text-gray-900">{student.name}</h2>
                      {student.consent ? (
                        <span className="text-[10px] bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded-full">
                          Consent Given
                        </span>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          No Consent
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center space-x-1">
                        <Mail size={13} />
                        <span>{student.email}</span>
                      </span>
                      <span className="flex items-center space-x-1 font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                        <Phone size={13} />
                        <span>{student.phone || 'No phone'}</span>
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-primary w-fit">
                    Roll: {student.rollNo || 'N/A'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div>
                    <span className="text-gray-400 block">Branch</span>
                    <span className="font-semibold text-gray-800">{student.branch || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Batch</span>
                    <span className="font-semibold text-gray-800">{student.batch || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">CGPA</span>
                    <span className="font-semibold text-gray-800">{student.cgpa != null ? student.cgpa : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Backlogs</span>
                    <span className="font-semibold text-gray-800">{student.backlogs != null ? student.backlogs : '0'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ONE Big Primary Button when form is closed */}
      {!isFormOpen && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="w-full flex items-center justify-center space-x-2 rounded-xl bg-primary py-4 px-6 text-center font-bold text-white shadow-md hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            <span>Enroll New Student</span>
          </button>
        </div>
      )}
    </main>
  );
};

export default AdminStudents;
