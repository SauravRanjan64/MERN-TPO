// Admin Students tab: view paginated students, search by name/email/branch
import { useState } from 'react';
import Pagination from '../../components/Pagination';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import useDebounce from '../../hooks/useDebounce';

export default function StudentsTab() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  // Fetch paginated students
  const {
    data: students,
    total,
    page,
    totalPages,
    loading,
    setPage
  } = usePaginatedFetch('/api/admin/students', {
    search: debouncedSearch,
    limit: 10
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2>Registered Students ({total})</h2>
        <input
          type="text"
          placeholder="Search by name, email, or branch..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', minWidth: '260px' }}
        />
      </div>

      {loading ? (
        <p className="center">Loading students...</p>
      ) : students.length === 0 ? (
        <p className="no-data-msg">No students found matching your search.</p>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Branch</th>
                <th>CGPA</th>
                <th>Phone</th>
                <th>Skills</th>
              </tr>
            </thead>
            <tbody>
              {students.map((stu) => (
                <tr key={stu._id}>
                  <td><strong>{stu.name}</strong></td>
                  <td>{stu.email}</td>
                  <td>{stu.branch || '-'}</td>
                  <td>{stu.cgpa !== undefined ? stu.cgpa : '-'}</td>
                  <td>{stu.phone || '-'}</td>
                  <td>
                    {Array.isArray(stu.skills) && stu.skills.length > 0 ? (
                      <span className="skills-tags">
                        {stu.skills.join(', ')}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={10}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}
    </div>
  );
}
