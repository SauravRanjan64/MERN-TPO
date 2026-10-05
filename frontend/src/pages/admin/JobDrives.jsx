import React, { useEffect, useState } from 'react';
import axios from 'axios';

const emptyForm = {
  companyId: '',
  title: '',
  description: '',
  packageLPA: '',
  minCgpa: '',
  maxBacklogs: '',
  batch: '',
  allowedBranches: '',
  requiredSkills: '',
  lastDate: '',
};

const JobDrives = () => {
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadData = async () => {
    const [companyResponse, jobResponse] = await Promise.all([
      axios.get('/api/admin/companies', { withCredentials: true }),
      axios.get('/api/admin/jobs', { withCredentials: true }),
    ]);
    setCompanies(companyResponse.data);
    setJobs(jobResponse.data);
    setForm((current) => ({
      ...current,
      companyId: current.companyId || companyResponse.data[0]?._id || '',
    }));
  };

  useEffect(() => {
    loadData()
      .catch((err) => setError(err.response?.data?.message || 'Unable to load job drives.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    const payload = {
      ...form,
      packageLPA: form.packageLPA === '' ? undefined : Number(form.packageLPA),
      minCgpa: form.minCgpa === '' ? undefined : Number(form.minCgpa),
      maxBacklogs: form.maxBacklogs === '' ? undefined : Number(form.maxBacklogs),
      allowedBranches: form.allowedBranches.split(',').map((value) => value.trim()).filter(Boolean),
      requiredSkills: form.requiredSkills.split(',').map((value) => value.trim()).filter(Boolean),
      lastDate: form.lastDate || undefined,
    };
    try {
      await axios.post('/api/admin/jobs', payload, { withCredentials: true });
      setForm({ ...emptyForm, companyId: form.companyId });
      await loadData();
      setNotice('Job drive created.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create the job drive.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <section>
        <h1 className="mb-4 text-3xl font-bold">Manage job drives</h1>
        {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
        {notice && <p role="status" className="mb-4 text-green-700">{notice}</p>}
        <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg bg-white p-5 shadow md:grid-cols-2">
          <label className="block">Company
            <select className="mt-1 w-full rounded border p-2" name="companyId" value={form.companyId} onChange={updateField} required disabled={!companies.length}>
              {companies.length === 0 && <option value="">No companies registered</option>}
              {companies.map((company) => <option key={company._id} value={company._id}>{company.name}</option>)}
            </select>
          </label>
          <label className="block">Job title
            <input className="mt-1 w-full rounded border p-2" name="title" value={form.title} onChange={updateField} required />
          </label>
          <label className="block md:col-span-2">Description
            <textarea className="mt-1 w-full rounded border p-2" name="description" value={form.description} onChange={updateField} rows="3" />
          </label>
          <label className="block">Package (LPA)
            <input className="mt-1 w-full rounded border p-2" name="packageLPA" type="number" min="0" step="any" value={form.packageLPA} onChange={updateField} />
          </label>
          <label className="block">Minimum CGPA
            <input className="mt-1 w-full rounded border p-2" name="minCgpa" type="number" min="0" max="10" step="any" value={form.minCgpa} onChange={updateField} />
          </label>
          <label className="block">Maximum backlogs
            <input className="mt-1 w-full rounded border p-2" name="maxBacklogs" type="number" min="0" step="1" value={form.maxBacklogs} onChange={updateField} />
          </label>
          <label className="block">Eligible batch
            <input className="mt-1 w-full rounded border p-2" name="batch" value={form.batch} onChange={updateField} />
          </label>
          <label className="block">Allowed branches (comma separated)
            <input className="mt-1 w-full rounded border p-2" name="allowedBranches" value={form.allowedBranches} onChange={updateField} />
          </label>
          <label className="block">Required skills (comma separated)
            <input className="mt-1 w-full rounded border p-2" name="requiredSkills" value={form.requiredSkills} onChange={updateField} />
          </label>
          <label className="block">Application deadline
            <input className="mt-1 w-full rounded border p-2" name="lastDate" type="date" value={form.lastDate} onChange={updateField} />
          </label>
          <button className="rounded bg-primary px-4 py-2 font-semibold text-white disabled:opacity-60 md:col-span-2" type="submit" disabled={submitting || loading || companies.length === 0}>
            {submitting ? 'Creating…' : 'Create job drive'}
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold">Existing job drives</h2>
        {loading ? <p>Loading job drives…</p> : jobs.length === 0 ? <p>No job drives have been created.</p> : (
          <ul className="space-y-3">
            {jobs.map((job) => (
              <li key={job._id} className="rounded-lg border bg-white p-4">
                <h3 className="font-semibold">{job.title}</h3>
                <p className="text-sm text-gray-600">{job.companyName}{job.packageLPA != null ? ` · ${job.packageLPA} LPA` : ''}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
};

export default JobDrives;
