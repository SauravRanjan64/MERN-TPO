// Reusable pagination bar with Previous, Next, and Page indicator
export default function Pagination({ page, totalPages, onPageChange, total = 0, limit = 10 }) {
  if (totalPages <= 1 && total <= limit) return null;

  return (
    <div className="pagination-bar">
      <div className="pagination-info">
        Showing page <strong>{page}</strong> of <strong>{totalPages || 1}</strong> ({total} total)
      </div>

      <div className="pagination-buttons">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>

        <span className="page-indicator">
          {page} / {totalPages || 1}
        </span>

        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
