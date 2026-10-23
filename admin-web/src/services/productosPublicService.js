// admin-web/src/services/productosPublicService.js
// ======================================================================
// 🛒 Servicio Productos (CLIENTE QR) — COMANDA Enterprise 2026
// ----------------------------------------------------------------------
// • Fuente ÚNICA pública: /api/productos/public
// • Normalización estricta para bloqueo de compra
// • Sin lógica duplicada
// • FASE 1.3: disponible NORMALIZADO
// ======================================================================

'use strict';

import api from './api';

// ======================================================
// 🔄 Normalizador de producto (CONTRATO CERRADO)
// ======================================================
function normalizarProducto(p) {
  return {
    id: p.id,
    nombre: p.nombre,
    slug: p.slug,
    precio: Number(p.precio) || 0,
    descripcion: p.descripcion || '',
    imagenUrl: p.imagenUrl || null,
    categoriaId: p.categoriaId || null,

    // 🔒 BLOQUEO DE COMPRA (FASE 1.3)
    disponible: Boolean(p.disponible)
  };
}

// ======================================================
// 🌍 OBTENER PRODUCTOS PÚBLICOS (MENÚ QR)
// GET /api/productos/public?restauranteId=&categoriaId=
// ======================================================
export const obtenerProductosPublicos = async (restauranteId, categoriaId = null) => {
  const params = {};

  if (restauranteId) params.restauranteId = restauranteId;
  if (categoriaId) params.categoriaId = categoriaId;

  const { data } = await api.get('/productos/public', { params });

  const lista = Array.isArray(data?.data) ? data.data : [];
  return lista.map(normalizarProducto);
};

// ======================================================
// 📦 EXPORT ENTERPRISE
// ======================================================
export default {
  obtenerProductosPublicos
};
