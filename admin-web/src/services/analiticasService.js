// src/services/analiticasService.js
// ======================================================================
// 📊 Servicios de Analítica – COMANDA Enterprise 2026
// ----------------------------------------------------------------------
// Cliente HTTP especializado para módulos empresariales de métricas:
//
//  • Dashboard KPIs
//  • Analítica PRO (ventas, pedidos, pagos, tickets)
//  • Tendencias estadísticas avanzadas
//  • Historial de transacciones
//  • Top productos y segmentación
//
// Todas las rutas están conectadas al backend:
//   /api/analytics/*
// ======================================================================

import api from '../api/api';

// ======================================================================
// 📌 1) KPIs DEL DASHBOARD PRINCIPAL
// GET /api/analytics/kpis
// ======================================================================
export const obtenerKpis = () => {
  return api.get('/analytics/kpis');
};

// ======================================================================
// 📌 2) ANALÍTICA PRO — Dashboard avanzado
// GET /api/analytics/pro?filtro=hoy|ayer|7d|30d|rango
// ======================================================================
export const obtenerAnaliticaPro = ({ filtro = 'hoy', desde, hasta } = {}) => {
  const params = { filtro };

  if (desde) params.desde = desde;
  if (hasta) params.hasta = hasta;

  return api.get('/analytics/pro', { params });
};

// ======================================================================
// 📌 3) ÚLTIMAS TRANSACCIONES (pagos / ventas)
// GET /api/analytics/transacciones
// ======================================================================
export const obtenerTransacciones = () => {
  return api.get('/analytics/transacciones');
};

// ======================================================================
// 📌 4) GRÁFICA — Tendencia de ventas
// GET /api/analytics/ventas
// ======================================================================
export const obtenerGraficaVentas = () => {
  return api.get('/analytics/ventas');
};

// ======================================================================
// 📌 5) GRÁFICA — Pedidos por hora
// GET /api/analytics/pedidos-hora
// ======================================================================
export const obtenerPedidosPorHora = () => {
  return api.get('/analytics/pedidos-hora');
};

// ======================================================================
// 📌 6) GRÁFICA — Métodos de pago
// GET /api/analytics/metodos-pago
// ======================================================================
export const obtenerMetodosPago = () => {
  return api.get('/analytics/metodos-pago');
};

// ======================================================================
// 📌 7) TOP PRODUCTOS (ranking de ventas)
// GET /api/analytics/top-productos
// ======================================================================
export const obtenerTopProductos = () => {
  return api.get('/analytics/top-productos');
};

// ======================================================================
// 📌 8) HISTORIAL DE VENTAS (futuro: CSV / Excel)
// GET /api/analytics/historial?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
// ======================================================================
export const obtenerHistorialVentas = (desde, hasta) => {
  return api.get(`/analytics/historial?desde=${desde}&hasta=${hasta}`);
};

// ======================================================================
// 📦 EXPORTACIÓN GLOBAL
// ======================================================================
export default {
  obtenerKpis,
  obtenerAnaliticaPro,
  obtenerTransacciones,
  obtenerGraficaVentas,
  obtenerPedidosPorHora,
  obtenerMetodosPago,
  obtenerTopProductos,
  obtenerHistorialVentas
};
