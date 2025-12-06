// ======================================================
// 📝 Logger Empresarial – FASTORDER (2026 Enterprise)
// ------------------------------------------------------
// Basado en Winston + Rotación de Logs.
// Compatible con producción, staging y desarrollo.
// ======================================================

import winston from 'winston';
import 'winston-daily-rotate-file';

// -----------------------------
// 🎨 Formato personalizado
// -----------------------------
const formato = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// -----------------------------
// 📁 Rotación de logs por día
// -----------------------------
const transportRotativo = new winston.transports.DailyRotateFile({
  dirname: 'logs',
  filename: 'fastorder-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d' // guarda 30 días
});

// -----------------------------
// 🖥️ Consola (solo en desarrollo)
// -----------------------------
const consola =
  process.env.NODE_ENV !== 'production'
    ? new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf((info) => {
            return `${info.timestamp} [${info.level}] → ${info.message}`;
          })
        )
      })
    : null;

// -----------------------------
// 🚀 Logger final
// -----------------------------
const logger = winston.createLogger({
  level: 'info',
  format: formato,
  transports: consola ? [consola, transportRotativo] : [transportRotativo]
});

// Exportar
export default logger;
