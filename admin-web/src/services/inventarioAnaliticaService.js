// admin-web/src/services/inventarioAnaliticaService.js
// ======================================================================
// 📊 Inventario Analítica Service — COMANDA ENTERPRISE 2026
// ----------------------------------------------------------------------
// • Capa de acceso a endpoints analíticos
// • SIN lógica de negocio
// • Contratos cerrados con backend
// • Fallback seguro a nivel service
// • IA / Tendencias / Predicción viven aquí
// ======================================================================

import api from '../api/api';

// ======================================================
// 📊 Resumen analítico (nombre interno)
// GET /analytics/inventario/resumen
// ======================================================
export async function obtenerResumenAnaliticoInventario({ fechaInicio, fechaFin } = {}) {
  const params = {};
  if (fechaInicio) params.fechaInicio = fechaInicio;
  if (fechaFin) params.fechaFin = fechaFin;

  const { data } = await api.get('/analytics/inventario/resumen', { params });
  return data?.data || null;
}

// ======================================================
// 📊 Resumen analítico (CONTRATO DEL HOOK)
// Alias enterprise — NO eliminar
// ======================================================
export const obtenerResumenInventario = obtenerResumenAnaliticoInventario;

// ======================================================
// 📈 Tendencias de alertas
// GET /analytics/inventario/tendencias
// ======================================================
export async function obtenerTendenciasInventario({ fechaInicio, fechaFin } = {}) {
  const params = {};
  if (fechaInicio) params.fechaInicio = fechaInicio;
  if (fechaFin) params.fechaFin = fechaFin;

  const { data } = await api.get('/analytics/inventario/tendencias', { params });
  return Array.isArray(data?.data) ? data.data : [];
}

// ======================================================
// 🚨 Historial de alertas (nombre interno)
// GET /analytics/inventario/alertas
// ======================================================
export async function obtenerAlertasAnaliticasInventario({ fechaInicio, fechaFin } = {}) {
  const params = {};
  if (fechaInicio) params.fechaInicio = fechaInicio;
  if (fechaFin) params.fechaFin = fechaFin;

  const { data } = await api.get('/analytics/inventario/alertas', { params });
  return Array.isArray(data?.data) ? data.data : [];
}

// ======================================================
// 🚨 Historial de alertas (CONTRATO DEL HOOK)
// Alias enterprise — NO eliminar
// ======================================================
export const obtenerAlertasInventario = obtenerAlertasAnaliticasInventario;

// ======================================================
// 🔥 Productos críticos
// GET /analytics/inventario/productos-criticos
// ======================================================
export async function obtenerProductosCriticosInventario({ fechaInicio, fechaFin } = {}) {
  const params = {};
  if (fechaInicio) params.fechaInicio = fechaInicio;
  if (fechaFin) params.fechaFin = fechaFin;

  const { data } = await api.get('/analytics/inventario/productos-criticos', { params });
  return Array.isArray(data?.data) ? data.data : [];
}

// ======================================================
// 🤖 Recomendaciones IA
// GET /analytics/inventario/recomendaciones
// ======================================================
export async function obtenerRecomendacionesIA({ fechaInicio, fechaFin } = {}) {
  const params = {};
  if (fechaInicio) params.fechaInicio = fechaInicio;
  if (fechaFin) params.fechaFin = fechaFin;

  try {
    const { data } = await api.get('/analytics/inventario/recomendaciones', { params });
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

// ======================================================
// 📦 EXPORT ENTERPRISE (default)
// ======================================================
export default {
  obtenerResumenAnaliticoInventario,
  obtenerResumenInventario,
  obtenerTendenciasInventario,
  obtenerAlertasAnaliticasInventario,
  obtenerAlertasInventario,
  obtenerProductosCriticosInventario,
  obtenerRecomendacionesIA
};
