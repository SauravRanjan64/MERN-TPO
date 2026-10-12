// Custom hook for handling paginated data fetching with search and filters
import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useToast } from '../ToastContext';

export default function usePaginatedFetch(url, params = {}) {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(params.page || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Stringify additional params so useEffect detects real changes
  const queryParamsString = JSON.stringify(params);

  // Fetch paginated data
  const fetchData = useCallback(async (targetPage = page) => {
    setLoading(true);
    try {
      const parsedParams = JSON.parse(queryParamsString);
      const res = await api.get(url, {
        params: {
          ...parsedParams,
          page: targetPage
        }
      });
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
      setPage(res.data.page || 1);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(`Failed to fetch from ${url}:`, err.message);
      toast.error(err.response?.data?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [url, page, queryParamsString, toast]);

  // Refetch when page or parameters change
  useEffect(() => {
    fetchData(page);
  }, [page, queryParamsString]);

  // Method to manually reload current page
  const reload = () => fetchData(page);

  return {
    data,
    total,
    page,
    totalPages,
    loading,
    setPage,
    reload
  };
}
