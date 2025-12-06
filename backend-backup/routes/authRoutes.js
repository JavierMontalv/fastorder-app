// backend/routes/authRoutes.js
// ======================================================
// 🔐 Rutas de Autenticación – FASTORDER (2026 Enterprise)
// ------------------------------------------------------
// Login + Perfil con JWT. Nivel Shopify Admin / Rappi Aliado.
// ======================================================

"use strict";

import { Router } from "express";
import { body } from "express-validator";

import { login, obtenerPerfil } from "../controllers/authController.js";
import auth from "../middlewares/auth.js";
import validarCampos from "../middlewares/validarCampos.js";

const router = Router();

// ======================================================
// POST /api/auth/login
// ======================================================
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email no válido"),
    body("password").notEmpty().withMessage("La contraseña es obligatoria"),
  ],
  validarCampos,
  login
);

// ======================================================
// GET /api/auth/profile
// ======================================================
router.get("/profile", auth, obtenerPerfil);

// ======================================================
// EXPORTACIÓN ESM
// ======================================================
export default router;
