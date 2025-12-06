// backend/routes/pedidoRoutes.js
// ======================================================
// 🧾 Rutas de Pedidos – FASTORDER (ESM Enterprise 2026)
// ------------------------------------------------------
// Manejo completo de pedidos internos para POS, cocina,
// meseros y administración. Nivel Rappi / McDonalds KDS.
// ======================================================

import { Router } from "express";

// Middlewares
import auth from "../middlewares/auth.js";     // ✔ CORREGIDO: import default
import { rol } from "../middlewares/rol.js";
import validarCampos from "../middlewares/validarCampos.js";

// Validadores
import {
  validarCrearPedido,
  validarCambioEstado,
  validarIdPedido
} from "../validators/pedidoValidator.js";

// Controladores
import {
  crearPedido,
  obtenerPedidos,
  obtenerPedidoPorId,
  cambiarEstado
} from "../controllers/pedidoController.js";

const router = Router();

// ======================================================
// GET /api/pedidos
// Listar pedidos (admin, owner, staff)
// ======================================================
router.get("/", auth, obtenerPedidos);

// ======================================================
// GET /api/pedidos/:id
// Obtener pedido por ID
// ======================================================
router.get(
  "/:id",
  auth,
  validarIdPedido,
  validarCampos,
  obtenerPedidoPorId
);

// ======================================================
// POST /api/pedidos
// Crear un pedido (POS, mesero o QR)
// ======================================================
router.post(
  "/",
  auth,
  validarCrearPedido,
  validarCampos,
  crearPedido
);

// ======================================================
// PUT /api/pedidos/:id/estado
// Cambiar estado → Cocina (staff), owner, admin
// Estados: pendiente → preparación → listo → entregado
// ======================================================
router.put(
  "/:id/estado",
  auth,
  rol("admin", "owner", "staff"),
  validarCambioEstado,
  validarCampos,
  cambiarEstado
);

export default router;
