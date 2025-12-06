// backend/middlewares/validarCampos.js
// ======================================================
// 📏 Middleware de Validación – FASTORDER (UTF-8)
// ------------------------------------------------------
// Procesa los resultados de express-validator.
// Devuelve errores limpios y en formato estandarizado.
// ======================================================

"use strict";

import { validationResult } from "express-validator";
import logger from "../utils/logger.js";

const validarCampos = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    logger.warn("⚠️ Error de validación:", errors.array());

    return res.status(400).json({
      success: false,
      message: "Solicitud inválida",
      errors: errors.array().map((e) => ({
        campo: e.param,
        mensaje: e.msg,
      })),
    });
  }

  next();
};

export default validarCampos;
