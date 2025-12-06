// backend/validators/usuarioValidator.js
// ======================================================
// 👤 Validadores de Usuario – FASTORDER (Enterprise 2026)
// ------------------------------------------------------
"use strict";

import { body, param } from "express-validator";
import validarCampos from "../middlewares/validarCampos.js";   // ✅ CORREGIDO
import Usuario from "../models/Usuario.js";

// ======================================================
// 🧠 Cache Inteligente para validación de email
// ======================================================
const emailPoolCache = new Map();

// ======================================================
// 🔧 Helpers de validación corporativa
// ======================================================

// Sanitización estricta anti-XSS
const validarTextoSeguro = (value) => {
  if (!value) return true;
  const forbidden = /<|>|script|onerror|onload|javascript:/i;
  if (forbidden.test(value)) throw new Error("El campo contiene caracteres no permitidos");
  return true;
};

// Email único (con aceleración cache)
const emailUnico = async (email) => {
  if (emailPoolCache.has(email)) return true;
  const existe = await Usuario.findOne({ where: { email } });
  if (existe) throw new Error("Ya existe un usuario registrado con este email");
  emailPoolCache.set(email, true);
  return true;
};

// Verifica existencia por ID
const existeUsuario = async (id) => {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw new Error("El usuario no existe");
  return true;
};

// Contraseña fuerte nivel Shopify/Stripe
const validarPasswordFuerte = (password) => {
  const regex =
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|:;"'<>,.?/~`]).{8,64}$/;

  if (!regex.test(password)) {
    throw new Error(
      "La contraseña debe tener 8+ caracteres, incluir mayúscula, minúscula, número y símbolo"
    );
  }
  return true;
};

// Teléfono internacional
const validarTelefono = (value) => {
  if (!value) return true;
  const regex = /^\+?[0-9\s\-]{7,20}$/;
  if (!regex.test(value)) throw new Error("Formato de teléfono no válido");
  return true;
};

const ROLES_PERMITIDOS = ["admin", "owner", "staff", "superadmin"];

// ======================================================
// 🟢 VALIDAR REGISTRO
// ======================================================
export const validarRegistro = [
  body("nombre")
    .notEmpty().withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 120 })
    .custom(validarTextoSeguro),

  body("email")
    .notEmpty().withMessage("El email es obligatorio")
    .isEmail().withMessage("Email inválido")
    .normalizeEmail()
    .custom(emailUnico),

  body("password")
    .notEmpty().withMessage("La contraseña es obligatoria")
    .custom(validarPasswordFuerte),

  body("telefono")
    .optional()
    .custom(validarTelefono),

  body("rol")
    .optional()
    .isIn(ROLES_PERMITIDOS),

  validarCampos,
];

// ======================================================
// 🔑 VALIDAR LOGIN
// ======================================================
export const validarLogin = [
  body("email").notEmpty().isEmail().normalizeEmail(),
  body("password").notEmpty(),
  validarCampos,
];

// ======================================================
// ✏️ VALIDAR ACTUALIZACIÓN
// ======================================================
export const validarActualizarUsuario = [
  param("id").isInt({ min: 1 }).custom(existeUsuario),

  body("nombre")
    .optional()
    .isLength({ min: 2, max: 120 })
    .custom(validarTextoSeguro),

  body("telefono")
    .optional()
    .custom(validarTelefono),

  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .custom(async (email, { req }) => {
      const usuario = await Usuario.findOne({ where: { email } });
      if (usuario && usuario.id !== Number(req.params.id)) {
        throw new Error("Ese correo ya está registrado por otro usuario");
      }
      return true;
    }),

  body("rol")
    .optional()
    .isIn(ROLES_PERMITIDOS),

  body("estado")
    .optional()
    .isIn(["activo", "inactivo"]),

  validarCampos,
];

// ======================================================
// 🔑 VALIDAR CAMBIO DE CONTRASEÑA
// ======================================================
export const validarCambioPassword = [
  param("id").isInt({ min: 1 }).custom(existeUsuario),
  body("passwordActual").notEmpty(),
  body("nuevaPassword").notEmpty().custom(validarPasswordFuerte),
  validarCampos,
];
