import api from "./api";

const endpoint = "/categorias";

export const obtenerCategorias = () =>
  api.get(endpoint).then((res) => res.data);

export const crearCategoria = (data) =>
  api.post(endpoint, data).then((res) => res.data);

export const actualizarCategoria = (id, data) =>
  api.put(`${endpoint}/${id}`, data).then((res) => res.data);

export const eliminarCategoria = (id) =>
  api.delete(`${endpoint}/${id}`).then((res) => res.data);
