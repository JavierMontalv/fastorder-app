// backend/utils/responses.js
// ======================================================
// 📦 Respuestas estándar – FASTORDER Enterprise (2026)
// ------------------------------------------------------
// API Style: Shopify Admin / Stripe / Rappi Partner API.
// Formato unificado para todos los controladores.
// Incluye timestamp, trazabilidad y patrones consistentes.
// Compatible 100% con ES Modules.
// ======================================================

"use strict";

import logger from "./logger.js";

// ======================================================
// ✔ ÉXITO GENERAL
// ======================================================
export function success(res, message = "Operación exitosa", data = null, status = 200) {
  logger.info(`✔ SUCCESS: ${message}`);

  return res.status(status).json({
    ok: true,
    message,
    data,
    status,
    timestamp: new Date().toISOString(),
  });
}

// ======================================================
// ❌ ERROR CONTROLADO
// ======================================================
export function error(res, message = "Error interno del servidor", status = 500, details = null) {
  logger.error(`❌ ERROR: ${message}`, details || "");

  return res.status(status).json({
    ok: false,
    error: message,
    status,
    details: process.env.NODE_ENV === "production" ? undefined : details,
    timestamp: new Date().toISOString(),
  });
}

// ======================================================
// 🛑 ERROR 400 – VALIDACIÓN
// ======================================================
export function validationError(res, errores) {
  logger.warn("⚠️ VALIDATION ERROR:", errores);

  return res.status(400).json({
    ok: false,
    error: "Error de validación",
    detalles: errores,
    status: 400,
    timestamp: new Date().toISOString(),
  });
}

// ======================================================
// 🔒 ERROR 401 – NO AUTORIZADO
// ======================================================
export function unauthorized(res, message = "Token inválido o ausente") {
  logger.warn(`🔒 401 UNAUTHORIZED: ${message}`);

  return res.status(401).json({
    ok: false,
    error: message,
    status: 401,
    timestamp: new Date().toISOString(),
  });
}

// ======================================================
// 🚫 ERROR 403 – PROHIBIDO
// ======================================================
export function forbidden(res, message = "No tienes permiso para esta acción") {
  logger.warn(`🚫 403 FORBIDDEN: ${message}`);

  return res.status(403).json({
    ok: false,
    error: message,
    status: 403,
    timestamp: new Date().toISOString(),
  });
}
