import api from './api';
export const listarGastos = (params = {}) => api.get('/gastos', { params });
export const crearGasto = (payload) => api.post('/gastos', payload);
export const actualizarGasto = (id, payload) => api.put(`/gastos/${id}`, payload);
export const eliminarGasto = (id) => api.delete(`/gastos/${id}`);
