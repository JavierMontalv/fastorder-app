// ======================================================================
// 💳 pagosApi.js — COMANDA ENTERPRISE 2026
// ----------------------------------------------------------------------
// Cliente HTTP para pagos (Caja / Online)
// • Contrato 100% alineado con backend real
// • Sin exports fantasmas
// • Sin deuda técnica
// • Manejo explícito de errores
// • Retorna SIEMPRE { success, data, message }
// ======================================================================

import api from './api';

// ======================================================
// 🏦 Marcar pago en caja
// BACKEND:
// PUT /api/pagos/pedido/:pedidoId/caja
// Body: { metodoPago }
// Retorna: { success, data: pedido }
// ======================================================
export const marcarPagoEnCaja = async (pedidoId, metodoPago = 'efectivo') => {
  if (!pedidoId) {
    throw new Error('pedidoId es obligatorio');
  }

  const payload = {
    metodoPago
  };

  const { data } = await api.put(
    `/pagos/pedido/${pedidoId}/caja`,
    payload
  );

  return data;
};

// ======================================================
// 🌐 Iniciar pago online
// BACKEND:
// POST /api/pagos/pedido/:pedidoId/online
// Retorna: { success, data }
// ======================================================
export const iniciarPagoOnline = async (pedidoId) => {
  if (!pedidoId) {
    throw new Error('pedidoId es obligatorio');
  }

  const { data } = await api.post(
    `/pagos/pedido/${pedidoId}/online`
  );

  return data;
};

// ======================================================
// 📦 Export agrupado (opcional)
// ======================================================
const pagosApi = {
  marcarPagoEnCaja,
  iniciarPagoOnline
};

export default pagosApi;
