// backend/routes/mesaRoutes.js
// ======================================================
// 🍽️ Rutas de Mesas – FASTORDER (ESM 2026 Enterprise)
// ------------------------------------------------------
// CRUD de mesas internas del restaurante.
// Compatible con modelo real y controller completo.
// ======================================================

import { Router } from "express";
import { body, param } from "express-validator";

import {
  crearMesa,
  obtenerMesas,
  obtenerMesaPorId,
  actualizarMesa,
  eliminarMesa
} from "../controllers/mesaController.js";

import auth from "../middlewares/auth.js";
import { rol } from "../middlewares/rol.js";
import validarCampos from "../middlewares/validarCampos.js";

const router = Router();

// ======================================================
// GET /api/mesas  → listar todas
// ======================================================
router.get("/", auth, obtenerMesas);

// ======================================================
// GET /api/mesas/:id  → obtener una mesa
// ======================================================
router.get(
  "/:id",
  auth,
  [param("id").isInt({ min: 1 }).withMessage("ID inválido")],
  validarCampos,
  obtenerMesaPorId
);

// ======================================================
// POST /api/mesas  → crear mesa (admin / owner)
// ======================================================
router.post(
  "/",
  auth,
  rol("admin", "owner"),
  [
    body("numero")
      .notEmpty()
      .withMessage("El número de mesa es obligatorio")
      .isInt({ min: 1 })
      .withMessage("Número inválido"),

    body("capacidad")
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage("Capacidad inválida"),

    body("estado")
      .optional()
      .isIn(["libre", "ocupada", "reservada"])
      .withMessage("Estado inválido"),
  ],
  validarCampos,
  crearMesa
);

// ======================================================
// PUT /api/mesas/:id → actualizar mesa
// ======================================================
router.put(
  "/:id",
  auth,
  rol("admin", "owner"),
  [
    param("id").isInt({ min: 1 }).withMessage("ID inválido"),

    body("numero")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Número inválido"),

    body("capacidad")
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage("Capacidad inválida"),

    body("estado")
      .optional()
      .isIn(["libre", "ocupada", "reservada"])
      .withMessage("Estado inválido"),
  ],
  validarCampos,
  actualizarMesa
);

// ======================================================
// DELETE /api/mesas/:id → eliminar mesa
// ======================================================
router.delete(
  "/:id",
  auth,
  rol("admin", "owner"),
  [param("id").isInt({ min: 1 }).withMessage("ID inválido")],
  validarCampos,
  eliminarMesa
);

export default router;
