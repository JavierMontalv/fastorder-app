import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  timeout: 10000,
});

// 👉 Agregar token si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("📤 [API REQUEST]:", config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// 👉 Manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ [API ERROR]:", error?.response || error);
    return Promise.reject(error);
  }
);

export default api;
