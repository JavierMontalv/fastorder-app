import api from './api';

export const obtenerExperienciaComercial = async () => {
  const response = await api.get('/public/comercial/config');
  return response.data;
};

export const crearCheckoutPlan = async (payload) => {
  const response = await api.post('/public/comercial/checkout', payload);
  return response.data;
};

export const completarCheckoutPlanPagado = async ({ reference, claim, customer }) => {
  const response = await api.post(`/public/comercial/checkout/${reference}/complete`, {
    claim,
    customer
  });
  return response.data;
};

export const consultarEstadoCheckoutPlan = async ({ reference, claim }) => {
  const response = await api.get(`/public/comercial/checkout/${reference}/status`, {
    params: { claim }
  });
  return response.data;
};
