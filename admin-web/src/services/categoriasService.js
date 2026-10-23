// admin-web/src/services/categoriasService.js
// ======================================================================
// 🗂️ Servicio Categorías ADMIN — COMANDA Enterprise 2026
// ----------------------------------------------------------------------
// • Dominio EXCLUSIVO Admin (NO cliente QR)
// • CRUD alineado al backend real
// • Multi-tenant seguro (JWT obligatorio)
// • Contrato estable para:
//   - ModalProducto
//   - Refresco inmediato post-creación
// • Estilo Shopify / Stripe Admin
// ======================================================================

'use strict';

import api from '../api/api';

// ======================================================================
// 📄 GET /api/categorias  (ADMIN)
// Listado completo del restaurante autenticado
// ======================================================================
export const obtenerCategoriasAdmin = async () => {
  const { data } = await api.get('/categorias');
  return data;
};

// ======================================================================
// ➕ POST /api/categorias  (ADMIN)
// JSON simple (nombre, icono opcional)
// ======================================================================
export const crearCategoriaAdmin = async (payload) => {
  if (!payload?.nombre) {
    throw new Error('Nombre de categoría requerido');
  }

  try {
    const { data } = await api.post('/categorias', payload);
    return data;
  } catch (error) {
    throw error; // error ya viene normalizado desde api.js
  }
};

// ======================================================================
// ✏️ PUT /api/categorias/:id  (ADMIN)
// ======================================================================
export const actualizarCategoriaAdmin = async (id, payload) => {
  if (!id) throw new Error('ID de categoría requerido');

  const { data } = await api.put(`/categorias/${id}`, payload);
  return data;
};

// ======================================================================
// 🗑️ DELETE /api/categorias/:id  (ADMIN)
// El backend decide soft/hard delete
// ======================================================================
export const eliminarCategoriaAdmin = async (id) => {
  if (!id) throw new Error('ID de categoría requerido');

  const { data } = await api.delete(`/categorias/${id}`);
  return data;
};

// ======================================================================
// 📦 EXPORT ENTERPRISE
// ======================================================================
export default {
  obtenerCategoriasAdmin,
  crearCategoriaAdmin,
  actualizarCategoriaAdmin,
  eliminarCategoriaAdmin
};
