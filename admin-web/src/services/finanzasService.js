import api from '../api/api';

export async function obtenerResumenFinanciero({ desde, hasta }) {
  const { data } = await api.get('/finanzas/resumen', { params: { desde, hasta } });
  return data?.data || null;
}
