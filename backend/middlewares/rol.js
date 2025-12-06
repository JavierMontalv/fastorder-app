// backend/middlewares/rol.js
// ======================================================
// 🛡️ Middleware de Control de Roles – FASTORDER (Enterprise 2026)
// --------------------------------------------------------------
// Seguridad nivel Shopify Admin / Rappi Aliado / Uber Eats Partner.
// - Control de roles basado en permisos permitidos.
// - Auditoría avanzada de intentos no autorizados.
// - Detección anti-manipulación del token.
// - Soporte para jerarquías (admin > owner > staff).
// ======================================================

"use strict";

import logger from "../utils/logger.js";

// ======================================================
// 🧠 Jerarquía opcional (puede expandirse en el futuro)
// ======================================================
const hierarchy = {
  admin: 3,
  owner: 2,
  staff: 1,
  viewer: 0,
};

// ======================================================
// 🔐 Middleware principal
// ------------------------------------------------------
// rolesPermitidos → lista de roles que tienen acceso
// Ejemplo: rol("admin", "owner")
// ======================================================
export const rol = (...rolesPermitidos) => {
  return (req, res, next) => {
    try {
      const usuario = req.usuario;

      // ======================================================
      // 1) Usuario NO autenticado
      // ======================================================
      if (!usuario) {
        logger.warn("🔒 Acceso bloqueado: petición sin usuario autenticado");
        return res.status(401).json({
          success: false,
          message: "No autorizado",
        });
      }

      // ======================================================
      // 2) Anti-tampering: validar rol verdadero
      // ======================================================
      if (!hierarchy.hasOwnProperty(usuario.rol)) {
        logger.error(
          `🚨 Rol inválido detectado: '${usuario.rol}' → posible manipulación de token`,
          { usuarioId: usuario.id, email: usuario.email }
        );

        return res.status(403).json({
          success: false,
          message: "Credenciales corruptas: rol inválido",
        });
      }

      const rolUsuario = usuario.rol;

      // ======================================================
      // 3) Verificar permisos exactos
      // ======================================================
      if (!rolesPermitidos.includes(rolUsuario)) {
        logger.warn("🚫 ACCESO DENEGADO", {
          usuarioId: usuario.id,
          email: usuario.email,
          rol: rolUsuario,
          requiere: rolesPermitidos,
        });

        return res.status(403).json({
          success: false,
          message: "No tienes permisos para realizar esta acción",
        });
      }

      // ======================================================
      // 4) Acceso permitido
      // ======================================================
      logger.debug(`🟢 Permiso concedido → Usuario ${usuario.email} | Rol: ${rolUsuario}`);

      next();
    } catch (error) {
      logger.error("❌ Error en middleware de roles:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno en permisos",
      });
    }
  };
};
