// backend/controllers/authController.js
// ======================================================
// 🔐 Controlador de Autenticación – FASTORDER (Enterprise 2026)
// ------------------------------------------------------
// Seguridad avanzada tipo Shopify / UberEats Partner / Rappi Aliado.
// JWT robusto, logs estructurados, sanitización estricta,
// protección contra enumeración y ataques de fuerza bruta.
// ======================================================

"use strict";

import Usuario from "../models/Usuario.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import logger from "../utils/logger.js";
import { success, error as errorResponse } from "../utils/responses.js";

// ======================================================
// 🎟️ Generar JWT seguro (listo para Refresh Tokens futuro)
// ======================================================
const generarToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
      issuer: "fastorder.io",
      audience: "fastorder-users",
    }
  );
};

// ======================================================
// 🧠 Delay anti fuerza bruta / anti enumeración
// ======================================================
const securityDelay = (ms = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ======================================================
// 🔑 LOGIN
// ======================================================
export const login = async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const email = req.body.email?.toLowerCase().trim();
  const password = req.body.password;

  logger.info("Intento de login", { email, ip });

  if (!email || !password) {
    return errorResponse(res, "Email y contraseña son requeridos", 400);
    }

  try {
    const usuario = await Usuario.findOne({ where: { email } });

    // Protección contra enumeración
    const hashFalso = "$2a$10$abcdefghijklmnopqrstuv";
    const passValida = usuario
      ? await bcrypt.compare(password, usuario.password)
      : await bcrypt.compare(password, hashFalso);

    if (!usuario || !passValida) {
      await securityDelay(350);
      logger.warn("Login fallido", { email, ip });
      return errorResponse(res, "Credenciales incorrectas", 400);
    }

    const token = generarToken(usuario);

    logger.info("Login exitoso", {
      usuarioId: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      ip,
    });

    return success(res, "Login exitoso", {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (err) {
    logger.error("Error en login", { error: err.stack || err, email, ip });
    return errorResponse(res, "Error interno en el servidor", 500);
  }
};

// ======================================================
// 👤 PERFIL DEL USUARIO AUTENTICADO
// ======================================================
export const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id);

    if (!usuario) {
      logger.warn("Perfil no encontrado", { usuarioId: req.usuario.id });
      return errorResponse(res, "Usuario no encontrado", 404);
    }

    logger.info("Perfil entregado", { usuarioId: usuario.id });

    return success(res, "Perfil obtenido", {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    });
  } catch (err) {
    logger.error("Error obteniendo perfil", { error: err.stack });
    return errorResponse(res, "Error interno", 500);
  }
};
