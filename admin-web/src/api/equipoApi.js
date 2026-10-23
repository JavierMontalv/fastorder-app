import api from './api';

export const listarEquipo = async () => {
  const { data } = await api.get('/equipo');
  return data;
};

export const crearMiembroEquipo = async (payload) => {
  const { data } = await api.post('/equipo', payload);
  return data;
};

export const actualizarMiembroEquipo = async (usuarioId, payload) => {
  const { data } = await api.patch(`/equipo/${usuarioId}`, payload);
  return data;
};

export const actualizarEstadoMiembroEquipo = async (usuarioId, payload) => {
  const { data } = await api.patch(`/equipo/${usuarioId}/estado`, payload);
  return data;
};

export const generarPasswordTemporalEquipo = async (usuarioId) => {
  const { data } = await api.post(`/equipo/${usuarioId}/password-temporal`);
  return data;
};

export const cambiarPasswordMiembroEquipo = async (usuarioId, payload) => {
  const { data } = await api.patch(`/equipo/${usuarioId}/password`, payload);
  return data;
};
