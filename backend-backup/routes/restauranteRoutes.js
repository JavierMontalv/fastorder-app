// backend/routes/restauranteRoutes.js
// ======================================================
// 🏪 Rutas del Restaurante – FASTORDER (ESM Enterprise 2026)
// ------------------------------------------------------
// Configuración general del negocio (Shopify Admin Style)
// ======================================================

"use strict";

import { Router } from "express";
import { body } from "express-validator";

import {
  obtenerRestaurante,
  actualizarRestaurante,
} from "../controllers/restauranteController.js";

import auth from "../middlewares/auth.js";
import { rol } from "../middlewares/rol.js";
import validarCampos from "../middlewares/validarCampos.js"; // ✔ CORREGIDO

const router = Router();

// ======================================================
// GET /api/restaurante
// Obtener configuración del restaurante
// ======================================================
router.get("/", auth, obtenerRestaurante);

// ======================================================
// PUT /api/restaurante
// Admin / Owner pueden editar la configuración
// ======================================================
router.put(
  "/",
  auth,
  rol("admin", "owner"),
  [
    body("nombre").optional().notEmpty(),
    body("estado").optional().isIn(["abierto", "cerrado"]),
    body("metodosPago")
      .optional()
      .isObject()
      .withMessage("metodosPago debe ser un objeto"),
    body("colorPrimario").optional().isString(),
    body("colorSecundario").optional().isString(),
  ],
  validarCampos,
  actualizarRestaurante
);

// ======================================================
// EXPORT DEFAULT (ESM REQUIRED)
// ======================================================
export default router;
