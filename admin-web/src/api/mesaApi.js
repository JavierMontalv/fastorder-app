// src/api/mesaApi.js
// ======================================================================
// 🍽️ Mesa API — COMANDA ADMIN 2026
// ======================================================================

import api from './api';

export const listarMesas = () => api.get('/mesas');

export const crearMesa = (data) => api.post('/mesas', data);

export const actualizarMesa = (id, data) => api.put(`/mesas/${id}`, data);

export const liberarMesa = (id) => api.put(`/mesas/${id}/liberar`);

export const ocuparMesa = (id) => api.put(`/mesas/${id}`, { estado: 'ocupada' });

export const eliminarMesa = (id) => api.delete(`/mesas/${id}`);

/** Retorna { qrBase64, qrUrl, numero } */
export const obtenerQRMesa = (id) => api.get(`/mesas/${id}/qr`);

/** Retorna blob PDF para descarga */
export const descargarPDFQRMesa = (id) =>
  api.get(`/qr/pdf/mesas/${id}`, { responseType: 'blob' });

// ======================================================================
// Grupos de mesas (Unir / Separar / Cuenta unificada)
// ======================================================================

/**
 * Une varias mesas en un grupo con una mesa principal.
 * @param {number} mesaPrincipalId
 * @param {number[]} mesasSecundariasIds
 */
export const unirMesas = (mesaPrincipalId, mesasSecundariasIds) =>
  api.post('/mesas/unir', { mesaPrincipalId, mesasSecundariasIds });

/**
 * Disuelve el grupo de mesas de la mesa principal indicada.
 * @param {number} mesaPrincipalId
 */
export const separarMesas = (mesaPrincipalId) =>
  api.post('/mesas/separar', { mesaPrincipalId });

/**
 * Retira una mesa secundaria de su grupo actual.
 * @param {number} mesaId
 */
export const quitarMesaDelGrupo = (mesaId) =>
  api.post('/mesas/quitar-del-grupo', { mesaId });

/**
 * Retorna todos los pedidos activos del grupo al que pertenece la mesa.
 * @param {number} mesaId  (puede ser principal o secundaria)
 */
export const obtenerCuentaUnificada = (mesaId) =>
  api.get(`/mesas/${mesaId}/cuenta-unificada`);
