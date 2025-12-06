import api from "./api";

const endpoint = "/restaurante";

export const obtenerDatosRestaurante = () =>
  api.get(endpoint).then((res) => res.data);

export const actualizarRestaurante = (data) =>
  api.put(endpoint, data).then((res) => res.data);
