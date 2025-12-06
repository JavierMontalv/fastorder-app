// backend/config/env.js
// ======================================================
// 🔐 Validación y Carga de Variables de Entorno – FASTORDER
// ------------------------------------------------------
// Garantiza que el backend NO arranque sin configuración
// esencial. Seguridad estilo Shopify / Uber Eats.
// ======================================================

"use strict";

import dotenv from "dotenv";
dotenv.config();

// ======================================================
// ⭐ Variables críticas que NO permiten iniciar el backend
// ======================================================
const requiredVars = [
  "DB_HOST",
  "DB_USER",
  "DB_PASS",
  "DB_NAME",
  "DB_PORT",
  "JWT_SECRET",
];

// Validación estricta
requiredVars.forEach((key) => {
  if (!process.env[key]) {
    console.error("===============================================");
    console.error(`❌ ERROR FATAL: Falta variable obligatoria → ${key}`);
    console.error("➡ Agrega este valor en tu archivo .env");
    console.error("===============================================");
    process.exit(1);
  }
});

// ======================================================
// ⭐ Variables opcionales (no rompen el backend)
// ======================================================
const optionalVars = {
  IA_API_KEY: process.env.IA_API_KEY || null,
  IA_API_URL: process.env.IA_API_URL || "https://api.openai.com/v1/chat/completions",

  FRONTEND_URL: process.env.FRONTEND_URL || "*",
  FRONTEND_PUBLIC: process.env.FRONTEND_PUBLIC || "*",

  // WebSockets
  WS_ENABLED: process.env.WS_ENABLED === "true",

  // AWS S3 (futuro upload de imágenes)
  S3_BUCKET: process.env.S3_BUCKET || null,
  S3_REGION: process.env.S3_REGION || null,

  // Seguridad avanzada
  JWT_EXPIRES: process.env.JWT_EXPIRES || "8h",

  // SSL for RDS (si usas certificado)
  DB_SSL: process.env.DB_SSL === "true",

  // Puerto API
  PORT: process.env.PORT || 4000,
};

// Logging elegante
console.log("===============================================");
console.log(" FASTORDER – Variables de entorno cargadas");
console.log(" ENTORNO:", process.env.NODE_ENV || "development");
console.log(" API PORT:", optionalVars.PORT);
console.log(" FRONTEND:", optionalVars.FRONTEND_URL);
console.log(" IA ACTIVADA:", optionalVars.IA_API_KEY ? "Sí" : "No");
console.log(" WEBSOCKETS:", optionalVars.WS_ENABLED ? "ON" : "OFF");
console.log("===============================================");

// ======================================================
// ⭐ Exportación final
// ======================================================
export const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  // Base de datos
  dbHost: process.env.DB_HOST,
  dbUser: process.env.DB_USER,
  dbPass: process.env.DB_PASS,
  dbName: process.env.DB_NAME,
  dbPort: process.env.DB_PORT,

  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpires: optionalVars.JWT_EXPIRES,

  // Frontend
  frontendUrl: optionalVars.FRONTEND_URL,
  frontendPublic: optionalVars.FRONTEND_PUBLIC,

  // IA
  iaKey: optionalVars.IA_API_KEY,
  iaUrl: optionalVars.IA_API_URL,

  // WebSockets
  wsEnabled: optionalVars.WS_ENABLED,

  // AWS S3
  s3Bucket: optionalVars.S3_BUCKET,
  s3Region: optionalVars.S3_REGION,

  // SSL RDS
  dbSSL: optionalVars.DB_SSL,

  port: optionalVars.PORT,
};
