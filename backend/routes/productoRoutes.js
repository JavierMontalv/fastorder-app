// backend/routes/productoRoutes.js
// ======================================================
// 🛒 Rutas de Productos – FASTORDER (ESM Enterprise 2026)
// ------------------------------------------------------
// CRUD premium estilo Shopify / Rappi Aliado.
// Validación avanzada, RBAC profesional y ESM 100% correcto.
// ======================================================

import { Router } from "express";

import {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  eliminarProducto
} from "../controllers/productoController.js";

// Middlewares (✔ CORRECTOS)
import auth from "../middlewares/auth.js";
import { rol } from "../middlewares/rol.js";
import validarCampos from "../middlewares/validarCampos.js";   // ✅ FIX

// Validadores
import {
  validarCrearProducto,
  validarActualizarProducto,
  validarIdProducto,
  validarListarProductos
} from "../validators/productoValidator.js";

const router = Router();

// ======================================================
// 📌 LISTAR PRODUCTOS (con filtros + paginación)
// GET /api/productos
// ======================================================
router.get(
  "/",
  auth,
  validarListarProductos,
  validarCampos,
  obtenerProductos
);

// ======================================================
// 📌 OBTENER PRODUCTO POR ID
// GET /api/productos/:id
// ======================================================
router.get(
  "/:id",
  auth,
  validarIdProducto,
  validarCampos,
  obtenerProductoPorId
);

// ======================================================
// ➕ CREAR PRODUCTO
// POST /api/productos
// Roles permitidos: admin, owner
// ======================================================
router.post(
  "/",
  auth,
  rol("admin", "owner"),
  validarCrearProducto,
  validarCampos,
  crearProducto
);

// ======================================================
// ✏️ ACTUALIZAR PRODUCTO
// PUT /api/productos/:id
// Roles permitidos: admin, owner
// ======================================================
router.put(
  "/:id",
  auth,
  rol("admin", "owner"),
  validarActualizarProducto,
  validarCampos,
  actualizarProducto
);

// ======================================================
// 🗑️ ELIMINAR PRODUCTO
// DELETE /api/productos/:id
// Roles permitidos: admin, owner
// ======================================================
router.delete(
  "/:id",
  auth,
  rol("admin", "owner"),
  validarIdProducto,
  validarCampos,
  eliminarProducto
);

// ======================================================
// EXPORT DEFAULT (ESM REQUIRED)
// ======================================================
export default router;
