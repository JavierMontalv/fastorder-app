import api from "./api";

const endpoint = "/usuarios";

export const obtenerUsuarios = () =>
  api.get(endpoint).then((res) => res.data);

export const crearUsuario = (data) =>
  api.post(endpoint, data).then((res) => res.data);

export const actualizarUsuario = (id, data) =>
  api.put(`${endpoint}/${id}`, data).then((res) => res.data);

export const eliminarUsuario = (id) =>
  api.delete(`${endpoint}/${id}`).then((res) => res.data);
