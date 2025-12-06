import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

export default function useFetch(endpoint, { auto = true, params = {} } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(auto);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get(endpoint, { params });
      setData(res.data);
    } catch (err) {
      console.error("❌ Error en useFetch:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, JSON.stringify(params)]);

  useEffect(() => {
    if (auto) fetchData();
  }, [fetchData, auto]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
