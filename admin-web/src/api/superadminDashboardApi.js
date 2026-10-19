// admin-web/src/api/superadminDashboardApi.js
// ======================================================================
// 👑 SuperAdmin Dashboard API — COMANDA ENTERPRISE 2026
// Centraliza llamadas al backend para:
//  • Dashboard General
//  • Dashboard IA
// Arquitectura limpia · Sin lógica en vistas
// ======================================================================

import api from './api';

// ======================================================
// 📊 DASHBOARD GENERAL SUPERADMIN
// GET /api/superadmin/dashboard
// ======================================================
export const getDashboard = async () => {
  const response = await api.get('/superadmin/dashboard');
  return response.data;
};

// ======================================================
// 🤖 DASHBOARD IA SUPERADMIN
// GET /api/superadmin/dashboard/ia
// ======================================================
export const getDashboardIA = async () => {
  const response = await api.get('/superadmin/dashboard/ia');
  return response.data;
};
