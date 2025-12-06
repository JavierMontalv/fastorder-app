// backend/routes/qrRoutes.js
// ======================================================
// 🔳 Rutas QR – FASTORDER (2026 Enterprise)
// ------------------------------------------------------
// Generación de QR para restaurante, mesas y productos.
// Solo accesibles por usuarios autenticados con rol admin.
// ======================================================

"use strict";

import { Router } from "express";

// Middlewares CORRECTOS (auth es default)
import auth from "../middlewares/auth.js";
import { rol } from "../middlewares/rol.js";

// Controladores
import {
  generarQRMesa,
  generarQRProducto,
  generarQRRestaurante,
} from "../controllers/qrController.js";

const router = Router();

// ======================================================
// 📌 QR del Restaurante (Configuración general)
// ======================================================
router.get("/restaurante", auth, rol("admin"), generarQRRestaurante);

// ======================================================
// 📌 QR de Mesa
// ======================================================
router.get("/mesas/:id", auth, rol("admin"), generarQRMesa);

// ======================================================
// 📌 QR de Producto
// ======================================================
router.get("/productos/:id", auth, rol("admin"), generarQRProducto);

// ======================================================
// Exportación ESM Default
// ======================================================
export default router;
