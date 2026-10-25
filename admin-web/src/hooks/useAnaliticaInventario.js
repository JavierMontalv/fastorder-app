// admin-web/src/hooks/useAnaliticaInventario.js
// ======================================================================
// 📊 useAnaliticaInventario — COMANDA ENTERPRISE 2026
// ----------------------------------------------------------------------
// • Hook exclusivo para analítica de inventario
// • Contrato ACCIONABLE (incluye productos críticos)
// • Fallback seguro si backend no soporta feature
// • Carga paralela y estable
// • Política clara: SOLO carga manual (botón “Aplicar”)
// ======================================================================

import { latestAnalyticsRequest } from '../utils/analyticsWorkspace.mjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  obtenerAlertasInventario,
  obtenerRecomendacionesIA,
  obtenerProductosCriticosInventario,
  obtenerResumenInventario,
  obtenerTendenciasInventario
} from '../services/inventarioAnaliticaService';

// ======================================================
// 🧠 DEFAULTS ESTABLES (CONTRATO UI)
// ======================================================
const METRICAS_DEFAULT = {
  totalAlertas: 0,
  alertasCreadasEnRango: 0,
  alertasResueltas: 0,
  alertasActivasActuales: 0,
  duracionPromedioHoras: 0,
  slaHoras: 0,
  alertasDentroSLA: 0,
  porcentajeCumplimientoSLA: 0
};

// ======================================================
// 🔒 Normalización métricas
// ======================================================
const normalizarMetricas = (data) => {
  if (!data || typeof data !== 'object') {
    return { ...METRICAS_DEFAULT };
  }

  return {
    totalAlertas: Number(data.totalAlertas ?? data.alertasCreadasEnRango) || 0,
    alertasCreadasEnRango: Number(data.alertasCreadasEnRango) || 0,
    alertasResueltas: Number(data.alertasResueltas) || 0,
    alertasActivasActuales: Number(data.alertasActivasActuales) || 0,
    duracionPromedioHoras: Number(data.duracionPromedioHoras) || 0,
    slaHoras: Number(data.slaHoras) || 0,
    alertasDentroSLA: Number(data.alertasDentroSLA) || 0,
    porcentajeCumplimientoSLA: Math.max(
      0,
      Math.min(100, Number(data.porcentajeCumplimientoSLA) || 0)
    )
  };
};

// ======================================================
// 🪝 HOOK
// ======================================================
export default function useAnaliticaInventario({
  fechaInicio = null,
  fechaFin = null,
  autoLoad = false
} = {}) {
  // --------------------------------------------------
  // 📦 Estado
  // --------------------------------------------------
  const [historial, setHistorial] = useState([]);
  const [alertasActivasActualesDetalle, setAlertasActivasActualesDetalle] = useState([]);
  const [tendencias, setTendencias] = useState([]);
  const [metricas, setMetricas] = useState({ ...METRICAS_DEFAULT });
  const [productosCriticos, setProductosCriticos] = useState([]);
  const [recomendaciones, setRecomendaciones] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --------------------------------------------------
  // 🧷 Refs de estabilidad
  // --------------------------------------------------
  const mountedRef = useRef(false);
  const requestRef = useRef(null);
  if (!requestRef.current) requestRef.current = latestAnalyticsRequest();

  // --------------------------------------------------
  // 🚀 Carga analítica (PARALELA + AISLADA)
  // --------------------------------------------------
  const cargarAnalitica = useCallback(async () => {
    const request = requestRef.current.begin();

    try {
      setLoading(true);
      setError(null);

      const [
        historialData,
        metricasData,
        productosCriticosData,
        tendenciasData,
        recomendacionesData,
        alertasActivasActualesData
      ] =
        await Promise.all([
          obtenerAlertasInventario({ fechaInicio, fechaFin }),
          obtenerResumenInventario({ fechaInicio, fechaFin }),
          obtenerProductosCriticosInventario({ fechaInicio, fechaFin })
            .then((res) => (Array.isArray(res) ? res : []))
            .catch(() => []),
          obtenerTendenciasInventario({ fechaInicio, fechaFin })
            .then((res) => (Array.isArray(res) ? res : []))
            .catch(() => []),
          obtenerRecomendacionesIA({ fechaInicio, fechaFin }),
          obtenerAlertasInventario()
            .then((res) => (Array.isArray(res) ? res.filter((alerta) => !alerta.resuelta) : []))
            .catch(() => [])
        ]);

      if (!mountedRef.current || !requestRef.current.isCurrent(request)) return;

      setHistorial(Array.isArray(historialData) ? historialData : []);
      setAlertasActivasActualesDetalle(
        Array.isArray(alertasActivasActualesData) ? alertasActivasActualesData : []
      );
      setMetricas(normalizarMetricas(metricasData));
      setProductosCriticos(productosCriticosData);
      setTendencias(Array.isArray(tendenciasData) ? tendenciasData : []);
      setRecomendaciones(Array.isArray(recomendacionesData) ? recomendacionesData : []);
    } catch (err) {
      if (!mountedRef.current || !requestRef.current.isCurrent(request)) return;

      setHistorial([]);
      setAlertasActivasActualesDetalle([]);
      setTendencias([]);
      setMetricas({ ...METRICAS_DEFAULT });
      setProductosCriticos([]);
      setRecomendaciones([]);
      setError(err?.message || 'Error cargando analítica de inventario');
    } finally {
      if (mountedRef.current && requestRef.current.isCurrent(request)) setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  // --------------------------------------------------
  // 🔁 Autoload SOLO inicial
  // --------------------------------------------------
  useEffect(() => {
    mountedRef.current = true;

    if (autoLoad) {
      cargarAnalitica();
    }

    return () => {
      mountedRef.current = false;
      requestRef.current.invalidate();
    };
  }, [autoLoad, cargarAnalitica]);

  // --------------------------------------------------
  // 📦 API del hook (CONTRATO FINAL)
  // --------------------------------------------------
  return {
    // datos
    historial,
    alertasActivasActualesDetalle,
    tendencias,
    metricas,
    productosCriticos,
    recomendaciones,

    // estado
    loading,
    error,

    // acciones
    aplicarFiltros: cargarAnalitica,
    recargar: cargarAnalitica
  };
}
