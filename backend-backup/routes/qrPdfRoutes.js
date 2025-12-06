// backend/routes/qrPdfRoutes.js
// ======================================================
// 🧾 Rutas PDF de Códigos QR – FASTORDER (2026 Enterprise)
// ------------------------------------------------------
// Entrega PDFs totalmente profesionales de:
//   • Restaurante (menú general)
//   • Mesas individuales
//   • Productos (cartas QR, stands, stickers)
// ------------------------------------------------------
// Todas las rutas requieren autenticación y rol admin/owner.
// ======================================================

'use strict';

import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { rol } from '../middlewares/rol.js';

import {
  generarPdfQRMesa,
  generarPdfQRProducto,
  generarPdfQRRestaurante
} from '../controllers/qrPdfController.js';

const router = Router();

// 🔐 Roles permitidos (incluye propietarios y superadmins)
const rolesPermitidos = ['admin', 'owner'];

// ======================================================
// 📌 GET /api/qr/pdf/restaurante
// QR del restaurante (principal)
// ======================================================
router.get(
  '/restaurante',
  auth,
  rol(...rolesPermitidos),
  (req, res, next) => {
    console.log('📥 Solicitud PDF QR Restaurante');
    next();
  },
  generarPdfQRRestaurante
);

// ======================================================
// 📌 GET /api/qr/pdf/mesas/:id
// QR para una mesa específica
// ======================================================
router.get(
  '/mesas/:id',
  auth,
  rol(...rolesPermitidos),
  (req, res, next) => {
    console.log(`📥 Solicitud PDF QR Mesa → Mesa ID: ${req.params.id}`);
    next();
  },
  generarPdfQRMesa
);

// ======================================================
// 📌 GET /api/qr/pdf/productos/:id
// QR para un producto (carta QR / catálogo / stickers)
// ======================================================
router.get(
  '/productos/:id',
  auth,
  rol(...rolesPermitidos),
  (req, res, next) => {
    console.log(`📥 Solicitud PDF QR Producto → Producto ID: ${req.params.id}`);
    next();
  },
  generarPdfQRProducto
);

export default router;
