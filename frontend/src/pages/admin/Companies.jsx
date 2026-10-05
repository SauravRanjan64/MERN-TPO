// Admin companies management and recruiter registration
import React, { useEffect, useState } from 'react';
import { Building, Plus, Mail, ChevronDown, ChevronUp, Briefcase } from 'lucide-react';
import api from '../../components/api';
import Message from '../../components/Message';

const emptyCompanyForm = {
  name: '',
  email: '',
  password: '',
};

// Admin panel to register new company recruiters and view current corporate partners
const AdminCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(emptyCompanyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Fetch all registered recruitment companies from backend
  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/admin/companies');
      setCompanies(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load companies list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Update company registration form state
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Register a new company account and organization profile
  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setNotice('');

    try {
      await api.post('/api/admin/companies', form);
      setNotice(`Company account for "${form.name}" registered successfully.`);
      setForm(emptyCompanyForm);
      setIsFormOpen(false);
      fetchCompanies();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register company.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Registered Companies</h1>
          <p className="mt-1 text-sm text-gray-500">
            Corporate recruiters participating in DCRUST campus placement drives.
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

      {/* Add Company Form (Collapsible) */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="w-full flex items-center justify-between p-5 text-left font-bold text-gray-900 bg-gray-50 hover:bg-gray-100 transition"
        >
          <span className="flex items-center space-x-2 text-base">
            <Plus size={18} className="text-primary" />
            <span>Register New Company</span>
          </span>
          {isFormOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {isFormOpen && (
          <form onSubmit={handleCreateCompany} className="p-5 space-y-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Tata Consultancy Services"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Recruiter Login Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. recruiter@tcs.com"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Password *
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
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-primary py-3.5 px-4 font-bold text-white shadow hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {submitting ? 'Registering Company…' : 'Register Company'}
            </button>
          </form>
        )}
      </section>

      {/* Companies List */}
      <section className="space-y-4">
        {loading ? (
          <Message type="loading" message="Loading registered companies…" />
        ) : companies.length === 0 ? (
          <Message
            type="empty"
            title="No Companies Registered"
            message="Click 'Register New Company' above to onboard your first recruitment partner."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {companies.map((comp) => (
              <div
                key={comp._id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2"
              >
                <div className="flex items-center space-x-2 text-primary font-bold">
                  <Building size={18} />
                  <h2 className="text-base text-gray-900">{comp.name}</h2>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <Mail size={13} />
                  <span>Login: {comp.userEmail || comp.userName}</span>
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
            <span>Register New Company</span>
          </button>
        </div>
      )}
    </main>
  );
};

export default AdminCompanies;
