// ======================================================================
// 📦 pedidosApi.js — COMANDA ENTERPRISE 2026
// ----------------------------------------------------------------------
// Cliente HTTP ÚNICO para pedidos
// • CONTRATO CERRADO con backend real
// • Exporta EXACTAMENTE lo que usa la UI (Pedidos.jsx)
// • Sin exports fantasmas
// • Sin deuda técnica
// ======================================================================

import api from './api';

// ======================================================
// 📥 Obtener pedidos (ADMIN)
// BACKEND:
// GET /api/pedidos
// Retorna: { success, data: Pedido[] }
// ======================================================
export const obtenerPedidos = async () => {
  const { data } = await api.get('/pedidos');
  return data;
};

// ======================================================
// 🔄 Actualizar estado OPERATIVO del pedido
// BACKEND:
// PATCH /api/pedidos/:pedidoId/estado
// Body: { estado }
// Retorna: { success, data: Pedido }
// ======================================================
export const actualizarEstadoPedido = async (pedidoId, estado) => {
  const resolvedPedidoId = pedidoId?.id || pedidoId?.pedidoId || pedidoId;
  const resolvedEstado = estado?.estado || estado?.next || estado;

  if (!resolvedPedidoId || !resolvedEstado) {
    throw new Error('No se pudo identificar el pedido o su siguiente estado. Recarga el panel e intenta de nuevo.');
  }

  const { data } = await api.patch(
    `/pedidos/${resolvedPedidoId}/estado`,
    { estado: resolvedEstado }
  );

  return data;
};

// ======================================================
// Eliminar pedido (ADMIN)
// BACKEND:
// DELETE /api/pedidos/:pedidoId
// ======================================================
export const eliminarPedido = async (pedidoId) => {
  if (!pedidoId) {
    throw new Error('pedidoId es obligatorio');
  }

  const { data } = await api.delete(`/pedidos/${pedidoId}`);
  return data;
};

// ======================================================
// 🔍 Obtener estado de un pedido (QR / Admin)
// BACKEND:
// GET /api/pedidos/estado/:pedidoId
// Retorna: { success, data: Pedido }
// ======================================================
export const obtenerEstadoPedido = async (pedidoId) => {
  if (!pedidoId) {
    throw new Error('pedidoId es obligatorio');
  }

  const { data } = await api.get(`/pedidos/estado/${pedidoId}`);
  return data;
};

// ======================================================
// 🛎️ Llamar al mesero
// BACKEND:
// POST /api/pedidos/llamar-mesero
// Body: { pedidoId }
// Retorna: { success }
// ======================================================
export const llamarMesero = async (pedidoId) => {
  if (!pedidoId) {
    throw new Error('pedidoId es obligatorio');
  }

  const { data } = await api.post('/pedidos/llamar-mesero', {
    pedidoId
  });

  return data;
};

// ======================================================
// 📦 Export agrupado (opcional)
// ======================================================
const pedidosApi = {
  obtenerPedidos,
  actualizarEstadoPedido,
  eliminarPedido,
  obtenerEstadoPedido,
  llamarMesero
};

export default pedidosApi;
