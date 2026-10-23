// admin-web/src/api/dashboardApi.js
// ======================================================================
// 📊 Dashboard API — COMANDA ENTERPRISE 2026
// ======================================================================

import api from './api';

/** KPIs básicos del día: pedidosHoy, ventasHoy, productosActivos */
export const getKpis = () => api.get('/analytics/kpis');

/**
 * Analítica Pro con filtro de período
 * @param {'hoy'|'7d'|'30d'} filtro
 * Retorna: ventas[], pedidosPorHora[], metodosPago[], topProductos[], kpis{}
 */
export const getAnaliticaPro = (filtro = '7d') =>
  api.get(`/analytics/pro?filtro=${filtro}`);

export const getDecisionHub = () => api.get('/analytics/decision-hub');
