// frontend/src/api/iaClient.js
// ======================================================================
// 🤖 IA Axios Client — COMANDA ENTERPRISE 2026
// ----------------------------------------------------------------------
// Cliente HTTP especializado EXCLUSIVAMENTE para operaciones de IA
//
// ✔ Mismo baseURL que api.js (desde .env)
// ✔ Mismo JWT y headers
// ✔ Mismos interceptores (request / response)
// ✔ Timeout extendido (IA es lenta por naturaleza)
// ❌ NO duplica lógica de negocio
// ❌ NO reemplaza api.js global
//
// Principio aplicado:
// "La IA no se trata como una API normal"
// ======================================================================

'use strict';

import axios from 'axios';
import { API_BASE_URL } from '../config/env';

// ======================================================
// 🚀 Instancia dedicada para IA (FUENTE ÚNICA: .env)
// ======================================================
const iaClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // ⏱️ IA puede tardar (OpenAI + contexto + DB)
  headers: {
    'Content-Type': 'application/json'
  }
});

// ======================================================
// 🔐 Interceptor REQUEST (JWT)
// ======================================================
iaClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('comanda_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('❌ [IA] Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

// ======================================================
// ❌ Interceptor RESPONSE (errores claros)
// ======================================================
iaClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ [IA] Error response:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code
    });

    return Promise.reject(error);
  }
);

export default iaClient;
