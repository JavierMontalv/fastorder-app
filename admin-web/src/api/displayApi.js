import api from './api';
import { API_BASE_URL } from '../config/env';

export async function obtenerConfiguracionDisplay() {
  const { data } = await api.get('/display/config');
  return data;
}

export async function obtenerDisplayPublico(slug, { signal } = {}) {
  const slugSeguro = encodeURIComponent(String(slug || '').trim());
  if (!slugSeguro) {
    throw new Error('Pantalla no disponible');
  }

  const response = await fetch(`${API_BASE_URL}/public/display/${slugSeguro}`, {
    method: 'GET',
    signal,
    cache: 'no-store'
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'No fue posible cargar la pantalla');
  }

  return payload;
}

export async function actualizarConfiguracionDisplay(payload) {
  const { data } = await api.patch('/display/config', payload);
  return data;
}

export async function anunciarPedidoDisplay(pedidoId, payload = {}) {
  const { data } = await api.post(`/display/pedidos/${pedidoId}/announce`, payload);
  return data;
}

export async function limpiarDisplayActivo() {
  const { data } = await api.patch('/display/config', {
    clearActiveCalls: true
  });
  return data;
}
