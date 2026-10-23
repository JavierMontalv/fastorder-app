'use strict';

import api from '../api/api';

export const obtenerRestaurantes = async () => {
  const res = await api.get('/superadmin/restaurantes');
  return res?.data?.data || [];
};

export const crearRestaurante = async (payload) => {
  const res = await api.post('/superadmin/restaurantes', payload);
  return res?.data;
};

export const actualizarEstadoRestaurante = async (restauranteId, estado) => {
  const res = await api.patch(`/superadmin/restaurantes/${restauranteId}/estado`, { estado });
  return res?.data;
};

export const listarSolicitudesComerciales = async (params = {}) => {
  const res = await api.get('/superadmin/comercial/checkouts', { params });
  return res?.data?.data || { items: [], paymentStatus: null };
};

export const activarSolicitudComercial = async (checkoutId, payload = {}) => {
  const res = await api.post(`/superadmin/comercial/checkouts/${checkoutId}/activar`, payload);
  return res?.data?.data || null;
};

export const obtenerPlanRestauranteSuperadmin = async (restauranteId) => {
  const res = await api.get(`/superadmin/restaurantes/${restauranteId}/plan`);
  return res?.data?.data || null;
};

export const actualizarPlanRestauranteSuperadmin = async (
  restauranteId,
  { plan, estadoSuscripcion }
) => {
  const res = await api.patch(`/superadmin/restaurantes/${restauranteId}/plan`, {
    plan,
    estadoSuscripcion
  });
  return res?.data?.data || null;
};

export const listarUsuariosSuperadmin = async () => {
  const res = await api.get('/superadmin/usuarios');
  return res?.data?.data || { items: [], resumen: null };
};

export const actualizarAccesoUsuarioSuperadmin = async (usuarioId, payload) => {
  const res = await api.patch(`/superadmin/usuarios/${usuarioId}/acceso`, payload);
  return res?.data?.data || null;
};

export const actualizarVinculoUsuarioSuperadmin = async (usuarioId, payload) => {
  const res = await api.patch(`/superadmin/usuarios/${usuarioId}/vinculo`, payload);
  return res?.data?.data || null;
};

export const actualizarEstadoUsuarioSuperadmin = async (usuarioId, payload) => {
  const res = await api.patch(`/superadmin/usuarios/${usuarioId}/estado`, payload);
  return res?.data?.data || null;
};

export const resetPasswordUsuarioSuperadmin = async (usuarioId) => {
  const res = await api.post(`/superadmin/usuarios/${usuarioId}/reset-password-admin`);
  return res?.data?.data || null;
};

export const eliminarUsuarioSuperadmin = async (usuarioId) => {
  const res = await api.delete(`/superadmin/usuarios/${usuarioId}`);
  return res?.data?.data || null;
};
