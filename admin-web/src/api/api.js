// admin-web/src/api/api.js
// ======================================================================
// 🌐 Axios Base — COMANDA ENTERPRISE 2026
// ----------------------------------------------------------------------
// • BaseURL centralizada desde .env (VITE_API_URL)
// • Axios SIEMPRE apunta a /api
// • Inyección automática de JWT
// • Headers consistentes
// • Manejo básico de errores
// ----------------------------------------------------------------------
// ❌ Assets e imágenes NO pasan por Axios
// ======================================================================

import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ======================================================
// 🔐 Interceptor de REQUEST (JWT)
// ======================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('comanda_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const sedeActivaId = localStorage.getItem('comanda_sede_activa_id');
    if (sedeActivaId) {
      config.headers['X-Comanda-Sede-Id'] = sedeActivaId;
    }

    return config;
  },
  (error) => {
    console.error('❌ [API] Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

// ======================================================
// ❌ Interceptor de RESPONSE (errores normalizados)
// ======================================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ [API] Error response:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });

    const status = error.response?.status;
    const requestUrl = String(error.config?.url || '');
    const errorCode = String(error.code || '');
    let message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Respuesta inválida del servidor';

    if (errorCode === 'ECONNABORTED') {
      message =
        'La solicitud tardo mas de lo esperado. Intenta de nuevo en unos segundos.';
    } else if (!error.response) {
      message =
        'No fue posible conectar con el servidor. Verifica tu red o vuelve a intentarlo.';
    }

    if (status === 401) {
      message = 'Tu sesión expiró o ya no es válida. Recarga el panel e inicia sesión de nuevo.';
    }

    if (status === 404 && requestUrl.includes('/display/reset')) {
      message = 'El panel quedó desfasado frente a la API. Recarga la página para usar la versión nueva.';
    }

    const normalizedError = new Error(message);
    normalizedError.status = status;
    normalizedError.response = error.response;
    normalizedError.data = error.response?.data;

    return Promise.reject(normalizedError);
  }
);

export default api;
