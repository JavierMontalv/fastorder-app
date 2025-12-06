// backend/middlewares/errorHandler.js
// ======================================================
// 🧨 Middleware Global de Errores – FASTORDER (2026 PRO)
// ------------------------------------------------------
// Manejo profesional de:
//  ✓ JWT inválido / expirado
//  ✓ Errores Sequelize (Unique, FK, Validation)
//  ✓ Errores de validación express-validator
//  ✓ Errores de negocio personalizados
//  ✓ Fallas internas con logs estructurados
// ======================================================

import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  const ambiente = process.env.NODE_ENV || 'development';

  logger.error('🔥 Error capturado por errorHandler', {
    name: err.name,
    message: err.message,
    stack: ambiente === 'development' ? err.stack : undefined
  });

  // ======================================================
  // 🔐 JWT inválido o expirado
  // ======================================================
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }

  // ======================================================
  // 🧰 Error personalizado de negocio
  // (ej: throw { type: "BUSINESS", message: "No hay stock" })
  // ======================================================
  if (err.type === 'BUSINESS') {
    return res.status(err.status || 400).json({
      success: false,
      message: err.message,
      code: err.code || 'BUSINESS_ERROR'
    });
  }

  // ======================================================
  // 📝 Errores de express-validator
  // (Cuando next(err) se dispara con err.status === 400)
  // ======================================================
  if (err.status === 400 && Array.isArray(err.errors)) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: err.errors
    });
  }

  // ======================================================
  // 🛢️ Errores de Sequelize – Unique Constraint
  // ======================================================
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'El registro ya existe (unique constraint)',
      fields: err.errors?.map((e) => e.path)
    });
  }

  // ======================================================
  // 🔗 Errores de Sequelize – Foreign Key Constraint
  // ======================================================
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'No se puede completar la operación por dependencia FK',
      field: err.index
    });
  }

  // ======================================================
  // 📌 Errores de validación Sequelize
  // ======================================================
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación de datos',
      errors: err.errors?.map((e) => e.message)
    });
  }

  // ======================================================
  // ❌ Errores 400 enviados manualmente
  // ======================================================
  if (err.status === 400) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Solicitud inválida'
    });
  }

  // ======================================================
  // 🟥 Error interno desconocido
  // ======================================================
  return res.status(500).json({
    success: false,
    message: 'Error interno en el servidor',
    detail: ambiente === 'development' ? err.message : undefined
  });
};
