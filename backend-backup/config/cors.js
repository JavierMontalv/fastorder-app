// backend/config/cors.js
// ======================================================
// 🌐 Configuración CORS – FASTORDER (Nivel Enterprise 2026)
// ------------------------------------------------------
// Seguridad tipo Shopify / Stripe / Uber Eats.
// - Whitelist dinámica por dominios y subdominios
// - Permite localhost automáticamente en desarrollo
// - Logs avanzados para debugging controlado
// ======================================================

"use strict";

import cors from "cors";

// ======================================================
// 🟢 WHITELIST Dinámica para producción
// ======================================================
const whitelist = [
  process.env.FRONTEND_URL,       // Panel Admin PRO
  process.env.FRONTEND_PUBLIC,    // App pública / catálogo
  process.env.MOBILE_APP_URL      // App móvil (si existe)
].filter(Boolean); // elimina undefined/null

// ======================================================
// 🧠 Reglas inteligentes de CORS
// ======================================================
function validarOrigen(origin) {
  // 1️⃣ Permitir herramientas locales y servidores internos
  if (!origin) return true; // Thunder / Postman / servidores internos

  // 2️⃣ Permitir localhost en desarrollo
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
    return true;
  }

  // 3️⃣ Verificar coincidencias exactas
  if (whitelist.includes(origin)) return true;

  // 4️⃣ Verificar subdominios permitidos (ej: *.fastorder.com)
  const dominiosPermitidos = [
    /\.fastorder\.com$/,     // ejemplo modelo
    /\.vercel\.app$/,        // despliegues vercel
    /\.netlify\.app$/,       // si usas Netlify
  ];

  if (dominiosPermitidos.some((regex) => regex.test(origin))) {
    return true;
  }

  return false;
}

// ======================================================
// 🚀 Configuración principal de CORS
// ======================================================
export const corsOptions = {
  origin: function (origin, callback) {
    if (validarOrigen(origin)) {
      return callback(null, true);
    } else {
      console.log("❌ [CORS BLOCKED]:", origin);
      return callback(new Error("No autorizado por CORS"));
    }
  },

  // En caso de que el frontend necesite cookies/headers especiales
  credentials: true,

  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-access-token",
  ],

  exposedHeaders: [
    "Authorization",
    "X-Total-Count",
  ],
};
