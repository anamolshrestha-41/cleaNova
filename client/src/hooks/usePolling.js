import { useState, useEffect, useCallback, useRef } from 'react';

export function usePolling(fetchFn, interval = 4000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchRef = useRef(fetchFn);

  // Keep ref current without triggering effect re-runs
  useEffect(() => { fetchRef.current = fetchFn; }, [fetchFn]);

  const load = useCallback(async () => {
    try {
      const result = await fetchRef.current();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []); // stable — never recreated

  useEffect(() => {
    load();
    const id = setInterval(load, interval);
    return () => clearInterval(id);
  }, [load, interval]); // interval change still respected

  return { data, loading, error, refetch: load };
}
