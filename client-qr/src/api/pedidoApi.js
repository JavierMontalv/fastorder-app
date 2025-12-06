// ======================================================
// 🧾 pedidoApi.js – FASTORDER ENTERPRISE (2026)
// ------------------------------------------------------
// Cliente HTTP para operaciones de pedidos.
// Nivel RappiAliado / Shopify POS.
// Manejo centralizado, errores limpios y token JWT.
// ======================================================

import api from "./axiosConfig";

// ======================================================
// 🔐 Helper: encabezados con token
// ======================================================
const authHeaders = () => {
  const token = localStorage.getItem("fastorder_token");
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};

// ======================================================
// 🟢 Crear pedido
// ------------------------------------------------------
// items: [{ productoId, cantidad }]
// mesaId: optional
// nota: optional
// ======================================================
export const crearPedido = async (payload) => {
  try {
    const { data } = await api.post("/pedidos", payload, {
      headers: authHeaders()
    });
    return data;
  } catch (error) {
    throw error.response?.data || { message: "Error creando pedido" };
  }
};

// ======================================================
// 🔍 Obtener pedido por ID (con items + mesa)
// ------------------------------------------------------
// GET /pedidos/:id
// ======================================================
export const obtenerPedidoPorId = async (id) => {
  try {
    const { data } = await api.get(`/pedidos/${id}`, {
      headers: authHeaders()
    });
    return data;
  } catch (error) {
    throw error.response?.data || { message: "Error obteniendo pedido" };
  }
};

// ======================================================
// 📄 Listar pedidos con filtros
// ------------------------------------------------------
// filtros: estado, tipo, page, limit
// ======================================================
export const listarPedidos = async (params = {}) => {
  try {
    const { data } = await api.get("/pedidos", {
      params,
      headers: authHeaders()
    });
    return data;
  } catch (error) {
    throw error.response?.data || { message: "Error listando pedidos" };
  }
};

// ======================================================
// 🔄 Cambiar estado del pedido
// ------------------------------------------------------
// estados permitidos:
// pendiente → preparacion → listo → entregado
// cancelado (flujo alterno)
// ======================================================
export const cambiarEstadoPedido = async (id, estado) => {
  try {
    const { data } = await api.patch(
      `/pedidos/${id}/estado`,
      { estado },
      { headers: authHeaders() }
    );
    return data;
  } catch (error) {
    throw error.response?.data || { message: "Error cambiando estado" };
  }
};

// ======================================================
// 🧹 Cancelar pedido
// ------------------------------------------------------
export const cancelarPedido = async (id) => {
  try {
    const { data } = await api.patch(
      `/pedidos/${id}/estado`,
      { estado: "cancelado" },
      { headers: authHeaders() }
    );
    return data;
  } catch (error) {
    throw error.response?.data || { message: "Error cancelando pedido" };
  }
};

// ======================================================
// 🧾 Agregar item a un pedido EXISTENTE
// ------------------------------------------------------
// payload: { productoId, cantidad }
// ======================================================
export const agregarItem = async (pedidoId, payload) => {
  try {
    const { data } = await api.post(
      `/pedidos/${pedidoId}/items`,
      payload,
      { headers: authHeaders() }
    );
    return data;
  } catch (error) {
    throw error.response?.data || { message: "Error agregando item" };
  }
};

// ======================================================
// 🗑️ Eliminar item de un pedido
// ------------------------------------------------------
export const eliminarItem = async (pedidoId, itemId) => {
  try {
    const { data } = await api.delete(
      `/pedidos/${pedidoId}/items/${itemId}`,
      { headers: authHeaders() }
    );
    return data;
  } catch (error) {
    throw error.response?.data || { message: "Error eliminando item" };
  }
};

// ======================================================
// 🔢 Recalcular total del pedido
// ------------------------------------------------------
// GET /pedidos/:id/recalcular
// ======================================================
export const recalcularTotal = async (pedidoId) => {
  try {
    const { data } = await api.get(
      `/pedidos/${pedidoId}/recalcular`,
      { headers: authHeaders() }
    );
    return data;
  } catch (error) {
    throw error.response?.data || { message: "Error recalculando total" };
  }
};
