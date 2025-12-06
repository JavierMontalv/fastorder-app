// backend/routes/platoRoutes.js
// ======================================================
// 🍽️ Rutas de Platos – FASTORDER (2026 Enterprise)
// ------------------------------------------------------
// Alias del módulo Producto. Diseñado para restaurantes
// que manejan “platos” pero usando el modelo Producto.
// ======================================================

"use strict";

import { Router } from "express";
import { body, param } from "express-validator";

import {
  obtenerPlatos,
  crearPlato,
  actualizarPlato,
  eliminarPlato
} from "../controllers/platoController.js";

// Middlewares (✔ CORREGIDOS: todos son default excepto rol)
import auth from "../middlewares/auth.js";
import { rol } from "../middlewares/rol.js";
import validarCampos from "../middlewares/validarCampos.js";

const router = Router();

// ======================================================
// GET /api/platos
// ======================================================
router.get("/", auth, obtenerPlatos);

// ======================================================
// POST /api/platos  (crear plato)
// ======================================================
router.post(
  "/",
  auth,
  rol("admin", "owner"),
  [
    body("nombre")
      .notEmpty()
      .withMessage("El nombre del plato es obligatorio")
      .isLength({ min: 2, max: 120 }),

    body("precio")
      .notEmpty()
      .withMessage("El precio es obligatorio")
      .isFloat({ min: 0.01 })
      .withMessage("El precio debe ser mayor a $0"),

    body("categoriaId")
      .notEmpty()
      .withMessage("La categoría es obligatoria")
      .isInt({ min: 1 })
      .withMessage("ID de categoría inválido"),

    body("descripcion")
      .optional()
      .isLength({ max: 500 }),

    body("imagenUrl")
      .optional()
      .isURL()
      .withMessage("La imagen debe ser una URL válida"),

    body("estado")
      .optional()
      .isIn(["activo", "inactivo", "agotado"])
      .withMessage("Estado inválido"),
  ],
  validarCampos,
  crearPlato
);

// ======================================================
// PUT /api/platos/:id  (actualizar plato)
// ======================================================
router.put(
  "/:id",
  auth,
  rol("admin", "owner"),
  [
    param("id").isInt({ min: 1 }).withMessage("ID inválido"),

    body("nombre").optional().isLength({ min: 2, max: 120 }),

    body("precio").optional().isFloat({ min: 0.01 }),

    body("categoriaId").optional().isInt({ min: 1 }),

    body("descripcion").optional().isLength({ max: 500 }),

    body("estado")
      .optional()
      .isIn(["activo", "inactivo", "agotado"])
  ],
  validarCampos,
  actualizarPlato
);

// ======================================================
// DELETE /api/platos/:id
// ======================================================
router.delete(
  "/:id",
  auth,
  rol("admin", "owner"),
  [param("id").isInt({ min: 1 }).withMessage("ID inválido")],
  validarCampos,
  eliminarPlato
);

// ======================================================
// EXPORT DEFAULT
// ======================================================
export default router;
