// admin-web/src/hooks/useAnalytics.js
// ======================================================================
// 📊 useAnalytics — COMANDA ENTERPRISE 2026
// ----------------------------------------------------------------------
// • Hook orquestador de Analítica comercial
// • Consume analiticasService (NO fetch directo)
// • Estado estable (anti re-render)
// • Preparado para Dashboard / Analítica PRO
// • NO renderiza UI
// ======================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { obtenerKpis } from '../services/analiticasService';

export default function useAnalytics({ autoLoad = true } = {}) {
  // ======================================================
  // 🧠 ESTADO
  // ======================================================
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ======================================================
  // 🧷 REFS DE ESTABILIDAD
  // ======================================================
  const mountedRef = useRef(false);
  const loadingRef = useRef(false);

  // ======================================================
  // 🚀 CARGA DE KPIs (ESTABLE)
  // ======================================================
  const cargarKpis = useCallback(async () => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      const res = await obtenerKpis();
      const data = res?.data?.data ?? null;

      if (!mountedRef.current) return;
      setKpis(data);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message || 'Error cargando KPIs');
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // ======================================================
  // 🔁 AUTOLOAD CONTROLADO
  // ======================================================
  useEffect(() => {
    mountedRef.current = true;

    if (autoLoad) {
      cargarKpis();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [autoLoad, cargarKpis]);

  // ======================================================
  // 📦 API DEL HOOK
  // ======================================================
  return {
    kpis,
    loading,
    error,
    recargar: cargarKpis
  };
}
