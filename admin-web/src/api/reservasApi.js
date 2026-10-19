import api from './api';

export const listarReservas = (params = {}) => api.get('/reservas', { params });
export const crearReserva = (payload) => api.post('/reservas', payload);
export const actualizarReserva = (id, payload) => api.put(`/reservas/${id}`, payload);
export const eliminarReserva = (id) => api.delete(`/reservas/${id}`);
