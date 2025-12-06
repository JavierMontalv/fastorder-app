// backend/routes/categoriaRoutes.js
// ======================================================
// 🗂️ Rutas de Categorías – FASTORDER (Enterprise 2026)
// ------------------------------------------------------
// CRUD premium con autenticación + roles + validadores.
// Nivel Shopify / Rappi Aliado.
// ======================================================

"use strict";

import { Router } from "express";
import { body, param, query } from "express-validator";

import {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  obtenerCategoriaPorId
} from "../controllers/categoriaController.js";

import auth from "../middlewares/auth.js";
import { rol } from "../middlewares/rol.js";
import validarCampos from "../middlewares/validarCampos.js";

const router = Router();

// ======================================================
// GET /api/categorias  (listar con filtros/paginación)
// ======================================================
router.get(
  "/",
  auth,
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("estado")
      .optional()
      .isIn(["activo", "inactivo", "todos"])
      .withMessage("Estado inválido"),
    query("q").optional().trim().isLength({ max: 120 })
  ],
  validarCampos,
  obtenerCategorias
);

// ======================================================
// GET /api/categorias/:id  (obtener una)
// ======================================================
router.get(
  "/:id",
  auth,
  [param("id").isInt({ min: 1 }).withMessage("ID inválido")],
  validarCampos,
  obtenerCategoriaPorId
);

// ======================================================
// POST /api/categorias  (crear)
// ======================================================
router.post(
  "/",
  auth,
  rol("admin", "owner"),
  [
    body("nombre")
      .notEmpty()
      .withMessage("El nombre es obligatorio")
      .isLength({ min: 2, max: 120 }),
    body("descripcion").optional().isLength({ max: 500 }),
    body("icono").optional().isString(),
    body("estado")
      .optional()
      .isIn(["activo", "inactivo"])
      .withMessage("Estado inválido")
  ],
  validarCampos,
  crearCategoria
);

// ======================================================
// PUT /api/categorias/:id  (actualizar)
// ======================================================
router.put(
  "/:id",
  auth,
  rol("admin", "owner"),
  [
    param("id").isInt({ min: 1 }).withMessage("ID inválido"),
    body("nombre").optional().isLength({ min: 2, max: 120 }),
    body("descripcion").optional().isLength({ max: 500 }),
    body("icono").optional().isString(),
    body("estado")
      .optional()
      .isIn(["activo", "inactivo"])
      .withMessage("Estado inválido")
  ],
  validarCampos,
  actualizarCategoria
);

// ======================================================
// DELETE /api/categorias/:id  (eliminar)
// ======================================================
router.delete(
  "/:id",
  auth,
  rol("admin", "owner"),
  [param("id").isInt({ min: 1 }).withMessage("ID inválido")],
  validarCampos,
  eliminarCategoria
);

// ======================================================
// EXPORT DEFAULT (ESM REQUIRED)
// ======================================================
export default router;
