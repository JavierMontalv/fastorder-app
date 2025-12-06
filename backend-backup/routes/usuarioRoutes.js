// backend/routes/usuarioRoutes.js
// ======================================================
// 👤 Rutas de Usuarios – FASTORDER (2026 Enterprise)
// ------------------------------------------------------
// Manejo profesional de usuarios estilo Shopify / Rappi
// ======================================================

"use strict";

import { Router } from "express";

// Middlewares (✔ IMPORTACIÓN CORRECTA)
import auth from "../middlewares/auth.js";
import { rol } from "../middlewares/rol.js";
import validarCampos from "../middlewares/validarCampos.js";


// Validadores
import {
  validarActualizarUsuario,
  validarCambioPassword,
  validarLogin,
  validarRegistro,
} from "../validators/usuarioValidator.js";

// Controladores
import {
  actualizarUsuario,
  cambiarPassword,
  desactivarUsuario,
  login,
  obtenerPerfil,
  registrar,
} from "../controllers/usuarioController.js";

const router = Router();

// ======================================================
// 🟢 PUBLIC: Login
// ======================================================
router.post("/login", validarLogin, validarCampos, login);

// ======================================================
// 🟢 PUBLIC (opcional): Registro
// ======================================================
router.post("/registro", validarRegistro, validarCampos, registrar);

// ======================================================
// 👤 PRIVATE: Perfil del usuario autenticado
// ======================================================
router.get("/perfil", auth, obtenerPerfil);

// ======================================================
// ✏️ PRIVATE: Actualizar usuario
// ======================================================
router.put(
  "/:id",
  auth,
  validarActualizarUsuario,
  validarCampos,
  actualizarUsuario
);

// ======================================================
// 🔑 PRIVATE: Cambiar contraseña
// ======================================================
router.put(
  "/:id/password",
  auth,
  validarCambioPassword,
  validarCampos,
  cambiarPassword
);

// ======================================================
// 🗑️ PRIVATE: Desactivar usuario (solo admin)
// ======================================================
router.delete("/:id", auth, rol("admin"), desactivarUsuario);

// ======================================================
// EXPORT DEFAULT
// ======================================================
export default router;
