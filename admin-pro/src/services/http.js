// src/services/http.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  timeout: 8000,
});

// -------------------------------------
// 🔐 Interceptor REQUEST → Adjunta Token
// -------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("fastorder_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// -------------------------------------
// ❌ Interceptor RESPONSE → Manejo global
// -------------------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {

    if (error.code === "ECONNABORTED") {
      console.error("⏳ Tiempo de espera agotado");
      return Promise.reject("Tiempo de espera agotado");
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("fastorder_token");
      window.location.href = "/login";
    }

    return Promise.reject(error.response?.data?.message || error.message);
  }
);

export default api;
