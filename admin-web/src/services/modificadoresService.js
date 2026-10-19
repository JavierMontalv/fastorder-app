// admin-web/src/services/modificadoresService.js
// ======================================================================
// 🔌 Service: Modificadores — COMANDA ENTERPRISE 2026
// ----------------------------------------------------------------------
// • Capa HTTP pura (sin lógica de UI)
// • Fuente única: API Backend
// • Admin NO usa axios directo
// ----------------------------------------------------------------------
// Endpoints (confirmados):
// • GET  /api/modificadores/producto/:productoId
// • POST /api/modificadores/grupos
// • POST /api/modificadores/grupos/:id/opciones
// • POST /api/modificadores/asignar-producto
// ======================================================================

'use strict';

import api from '../api/api';

function extraerMensajeError(err, fallback) {
  const msg = err?.response?.data?.message || err?.message;
  return msg || fallback;
}

// ======================================================
// 📋 Obtener modificadores por producto
// GET /api/modificadores/producto/:productoId
// ======================================================
export async function obtenerModificadoresProducto(productoId) {
  if (!productoId) throw new Error('productoId es obligatorio');

  try {
    const { data } = await api.get(`/modificadores/producto/${productoId}`);
    return Array.isArray(data?.data) ? data.data : [];
  } catch (err) {
    throw new Error(extraerMensajeError(err, 'Error obteniendo modificadores del producto'));
  }
}

// ======================================================
// 🧩 Crear grupo modificador
// POST /api/modificadores/grupos
// payload: { nombre, tipoSeleccion, obligatorio, minSeleccion, maxSeleccion, orden }
// ======================================================
export async function crearGrupoModificador(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('payload es obligatorio');
  if (!payload.nombre) throw new Error('nombre es obligatorio');

  try {
    const { data } = await api.post('/modificadores/grupos', payload);
    return data?.data || null;
  } catch (err) {
    throw new Error(extraerMensajeError(err, 'Error creando grupo de modificadores'));
  }
}

// ======================================================
// 🧩 Crear opción dentro de un grupo
// POST /api/modificadores/grupos/:id/opciones
// payload: { nombre, precioExtra, tipo, orden }
// ======================================================
export async function crearOpcionGrupo(grupoId, payload) {
  if (!grupoId) throw new Error('grupoId es obligatorio');
  if (!payload || typeof payload !== 'object') throw new Error('payload es obligatorio');
  if (!payload.nombre) throw new Error('nombre es obligatorio');

  try {
    const { data } = await api.post(`/modificadores/grupos/${grupoId}/opciones`, payload);
    return data?.data || null;
  } catch (err) {
    throw new Error(extraerMensajeError(err, 'Error creando opción de modificador'));
  }
}

// ======================================================
// 🔗 Asignar grupo a producto
// POST /api/modificadores/asignar-producto
// payload: { productoId, grupoModificadorId }
// ======================================================
export async function asignarGrupoProducto(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('payload es obligatorio');
  if (!payload.productoId) throw new Error('productoId es obligatorio');
  if (!payload.grupoModificadorId) throw new Error('grupoModificadorId es obligatorio');

  try {
    const { data } = await api.post('/modificadores/asignar-producto', payload);
    return data?.data || null;
  } catch (err) {
    throw new Error(extraerMensajeError(err, 'Error asignando grupo a producto'));
  }
}

export async function guardarConfiguracionModificadores(productoId, grupos) {
  if (!productoId) throw new Error('productoId es obligatorio');

  try {
    const { data } = await api.put(
      `/modificadores/producto/${productoId}/configuracion`,
      { grupos: Array.isArray(grupos) ? grupos : [] }
    );
    return Array.isArray(data?.data) ? data.data : [];
  } catch (err) {
    throw new Error(
      extraerMensajeError(err, 'Error guardando las ediciones y adicionales')
    );
  }
}

// ======================================================
// 📦 EXPORT ENTERPRISE
// ======================================================
export default {
  obtenerModificadoresProducto,
  crearGrupoModificador,
  crearOpcionGrupo,
  asignarGrupoProducto,
  guardarConfiguracionModificadores
};
