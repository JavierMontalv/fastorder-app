// src/services/productosService.js
import api from "../api/axiosConfig";

const endpoint = "/productos";

export const obtenerProductos = (params = {}) =>
  api.get(endpoint, { params }).then((res) => res.data);

export const obtenerProductoPorId = (id) =>
  api.get(`${endpoint}/${id}`).then((res) => res.data);

export const crearProducto = (data) =>
  api.post(endpoint, data).then((res) => res.data);

export const actualizarProducto = (id, data) =>
  api.put(`${endpoint}/${id}`, data).then((res) => res.data);

export const eliminarProducto = (id) =>
  api.delete(`${endpoint}/${id}`).then((res) => res.data);
