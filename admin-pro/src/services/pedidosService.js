import api from "./api";

const endpoint = "/pedidos";

export const obtenerPedidos = () =>
  api.get(endpoint).then((res) => res.data);

export const obtenerPedidoPorId = (id) =>
  api.get(`${endpoint}/${id}`).then((res) => res.data);

export const actualizarEstadoPedido = (id, estado) =>
  api.patch(`${endpoint}/${id}`, { estado }).then((res) => res.data);
