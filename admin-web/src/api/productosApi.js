// admin-web/src/api/productosApi.js
// ======================================================================
// 🛒 productosApi.js — COMANDA ADMIN 2026
// API Empresarial compatible con multipart/form-data
// Normaliza ID para SQL / Mongo — Estilo Shopify Cloud
// ======================================================================

import api from './api';

const normalizeId = (item) => item?.id || item?._id || item;

/* ================================
   GET — Listar productos
================================ */
export const obtenerProductos = (params = {}) =>
  api.get('/productos', {
    params
  });

/* ================================
   POST — Crear producto
================================ */
export const crearProducto = (formData) =>
  api.post('/productos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

/* ================================
   PUT — Actualizar producto
================================ */
export const actualizarProducto = (id, formData) =>
  api.put(`/productos/${normalizeId(id)}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

/* ================================
   DELETE — Eliminar producto
================================ */
export const eliminarProducto = (id) =>
  api.delete(`/productos/${normalizeId(id)}`);
