// src/api/restauranteApi.js
// ======================================================================
// 🏪 restauranteApi — COMANDA ENTERPRISE 2026
// Cliente HTTP del restaurante
// ======================================================================

import api from './api';

// ======================================================
// 📌 Obtener restaurante (configuración general)
// ======================================================
export const obtenerRestaurante = () => {
  return api.get('/restaurantes/me');
};

export const obtenerConfigRestaurante = () => {
  return api.get('/restaurantes/me/config');
};

export const obtenerSedesRestaurante = () => {
  return api.get('/restaurantes/me/sedes');
};

export const seleccionarSedeRestaurante = (sedeId) => {
  return api.post(`/restaurantes/me/sedes/${sedeId}/seleccionar`);
};

// ======================================================
// ✏️ Actualizar restaurante (configuración)
// ======================================================
export const actualizarRestaurante = (data) => {
  return api.put('/restaurantes', data);
};

export const actualizarConfigRestaurante = (data) => {
  return api.patch('/restaurantes/me/config', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// ======================================================
// 📎 Obtener QR del restaurante
// ======================================================
export const obtenerQRRestaurante = () => {
  return api.get('/restaurantes/me/config/qr');
};
