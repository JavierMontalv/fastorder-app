// backend/controllers/usuarioController.js
// ======================================================
// 👤 Controlador de Usuarios – FASTORDER (Enterprise 2026)
// ------------------------------------------------------
// Compatible 100% con ESM para routes modernas.
// Seguridad de nivel Shopify / Stripe Dashboard / Rappi.
// ======================================================

"use strict";

import {
  actualizarUsuarioServicio,
  buscarPorEmail,
  buscarPorId,
  cambiarPasswordServicio,
  compararPassword,
  crearUsuario,
  eliminarUsuarioServicio,
} from "../services/usuarioService.js";

import generarToken from "../utils/generarToken.js";
import logger from "../utils/logger.js";

// ======================================================
// 🧼 Helper sanitizador
// ======================================================
const clean = (v) =>
  typeof v === "string" ? v.trim().replace(/<[^>]+>/g, "") : v;

// ======================================================
// 🔐 LOGIN
// ======================================================
export const login = async (req, res) => {
  try {
    const email = clean(req.body.email?.toLowerCase());
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar email y contraseña",
      });
    }

    logger.info(`🔐 Intento de login → ${email}`);

    const usuario = await buscarPorEmail(email);
    const mensajeError = "Credenciales inválidas";

    if (!usuario) {
      logger.warn(`❌ Login fallido (usuario no existe): ${email}`);
      return res.status(400).json({ success: false, message: mensajeError });
    }

    if (usuario.estado === "inactivo") {
      return res.status(403).json({
        success: false,
        message: "El usuario está desactivado",
      });
    }

    const coincide = await compararPassword(password, usuario.password);

    if (!coincide) {
      logger.warn(`❌ Login fallido (contraseña incorrecta): ${email}`);
      return res.status(400).json({ success: false, message: mensajeError });
    }

    const token = generarToken(usuario.id, usuario.email, usuario.rol);

    logger.info(`🟢 Login exitoso → ${email}`);

    return res.json({
      success: true,
      message: "Login exitoso",
      data: {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          telefono: usuario.telefono,
          rol: usuario.rol,
          estado: usuario.estado,
        },
        token,
      },
    });
  } catch (error) {
    logger.error("🔥 Error procesando login:", error);
    return res.status(500).json({ success: false, message: "Error interno" });
  }
};

// ======================================================
// 🟩 REGISTRO
// ======================================================
export const registrar = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      nombre: clean(req.body.nombre),
      email: clean(req.body.email?.toLowerCase()),
    };

    const nuevo = await crearUsuario(payload);

    logger.info(`👤 Usuario registrado → ${nuevo.email}`);

    return res.status(201).json({
      success: true,
      message: "Usuario registrado correctamente",
      data: {
        id: nuevo.id,
        nombre: nuevo.nombre,
        email: nuevo.email,
        rol: nuevo.rol,
        estado: nuevo.estado,
      },
    });
  } catch (error) {
    logger.error("❌ Error registrando usuario:", error);
    return res.status(500).json({
      success: false,
      message: "Error registrando usuario",
    });
  }
};

// ======================================================
// 👤 PERFIL
// ======================================================
export const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await buscarPorId(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    return res.json({
      success: true,
      data: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        rol: usuario.rol,
        estado: usuario.estado,
        creado: usuario.createdAt,
      },
    });
  } catch (error) {
    logger.error("❌ Error obteniendo perfil:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno",
    });
  }
};

// ======================================================
// ✏️ ACTUALIZAR USUARIO
// ======================================================
export const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const payload = {
      ...req.body,
      nombre: clean(req.body.nombre),
      email: clean(req.body.email),
      telefono: clean(req.body.telefono),
    };

    const actualizado = await actualizarUsuarioServicio(id, payload);

    if (!actualizado) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    logger.info(`👤 Usuario actualizado → ID ${id}`);

    return res.json({
      success: true,
      message: "Usuario actualizado correctamente",
      data: actualizado,
    });
  } catch (error) {
    logger.error("❌ Error actualizando usuario:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno al actualizar usuario",
    });
  }
};

// ======================================================
// 🔑 CAMBIAR PASSWORD
// ======================================================
export const cambiarPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { passwordActual, nuevaPassword } = req.body;

    if (!passwordActual || !nuevaPassword) {
      return res.status(400).json({
        success: false,
        message: "Debe enviar la contraseña actual y la nueva contraseña",
      });
    }

    await cambiarPasswordServicio(id, passwordActual, nuevaPassword);

    logger.info(`🔐 Contraseña actualizada → ID ${id}`);

    return res.json({
      success: true,
      message: "Contraseña cambiada correctamente",
    });
  } catch (error) {
    logger.error("❌ Error cambiando contraseña:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// 🚫 DESACTIVAR USUARIO
// ======================================================
export const desactivarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const ok = await eliminarUsuarioServicio(id);

    if (!ok) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    logger.warn(`🛑 Usuario desactivado → ID ${id}`);

    return res.json({
      success: true,
      message: "Usuario desactivado correctamente",
    });
  } catch (error) {
    logger.error("❌ Error desactivando usuario:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno",
    });
  }
};
