import api from '../api/api';

const normalizarLista = (response) => response?.data?.data || response?.data || [];
const normalizarItem = (response) => response?.data?.data || response?.data || null;
const esFormData = (payload) => typeof FormData !== 'undefined' && payload instanceof FormData;

const requestConfig = (payload) =>
  esFormData(payload)
    ? {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    : undefined;

export const obtenerPromociones = async (params = {}) => {
  const response = await api.get('/promociones', { params });
  return normalizarLista(response);
};

export const obtenerPromocionPorId = async (id) => {
  const response = await api.get(`/promociones/${id}`);
  return normalizarItem(response);
};

export const crearPromocion = async (data) => {
  const response = await api.post('/promociones', data, requestConfig(data));
  return normalizarItem(response);
};

export const actualizarPromocion = async (id, data) => {
  const response = await api.put(`/promociones/${id}`, data, requestConfig(data));
  return normalizarItem(response);
};

export const cambiarEstadoPromocion = async (id, data) => {
  const response = await api.put(`/promociones/${id}/estado`, data);
  return normalizarItem(response);
};

export const eliminarPromocion = async (id) => {
  return api.delete(`/promociones/${id}`);
};

export default {
  obtenerPromociones,
  obtenerPromocionPorId,
  crearPromocion,
  actualizarPromocion,
  cambiarEstadoPromocion,
  eliminarPromocion
};
