import api from './api';
export const listarPagosNomina = (params = {}) => api.get('/nomina/pagos', { params });
export const crearPagoNomina = (payload) => api.post('/nomina/pagos', payload);
export const eliminarPagoNomina = (id) => api.delete(`/nomina/pagos/${id}`);
export const listarTurnos = (params = {}) => api.get('/nomina/turnos', { params });
export const guardarTurno = (payload) => api.put('/nomina/turnos', payload);
export const eliminarTurno = (id) => api.delete(`/nomina/turnos/${id}`);
