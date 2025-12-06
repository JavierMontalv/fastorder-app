// backend/utils/logger.js
// ======================================================
// 📜 Sistema de Logging Empresarial – FASTORDER 2026
// ------------------------------------------------------
// Logging estructurado en JSON, niveles profesionales,
// rotación diaria, canal de errores, soporte cloud-ready.
// ======================================================

"use strict";

import winston from "winston";
import "winston-daily-rotate-file";

// ======================================================
// 🎯 Nombre del servicio (útil para microservicios)
// ======================================================
const SERVICE_NAME = "fastorder-backend";

// ======================================================
// 🎨 Formato JSON profesional (para CloudWatch / Loki)
// ======================================================
const jsonFormat = winston.format.printf(
  ({ level, message, timestamp, stack, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      service: SERVICE_NAME,
      message,
      stack: stack || undefined,
      meta: Object.keys(meta).length ? meta : undefined,
    });
  }
);

// ======================================================
// 📁 Rotación diaria de logs (Producción)
// ======================================================
const rotateTransport = new winston.transports.DailyRotateFile({
  dirname: "logs",
  filename: "%DATE%-fastorder.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "30d", // 🆙 Guardar 30 días
});

// Canal separado para errores críticos
const rotateErrors = new winston.transports.DailyRotateFile({
  dirname: "logs",
  filename: "%DATE%-errors.log",
  datePattern: "YYYY-MM-DD",
  level: "error",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "30d",
});

// ======================================================
// 🛠️ Crear instancia principal del logger
// ======================================================
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    jsonFormat
  ),

  transports: [
    ...(process.env.NODE_ENV === "production"
      ? [rotateTransport, rotateErrors] // Solo en producción
      : []),

    // Consola para desarrollo
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ level, message, timestamp }) =>
            `${timestamp} [${level}] → ${message}`
        )
      ),
    }),
  ],
});

// ======================================================
// 🧪 Modo Test — Sin ruido en consola
// ======================================================
if (process.env.NODE_ENV === "test") {
  logger.silent = true;
}

// ======================================================
// 📦 Exportar logger
// ======================================================
export default logger;
