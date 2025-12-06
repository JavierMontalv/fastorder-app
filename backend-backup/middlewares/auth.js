// backend/middlewares/auth.js
// ======================================================
// 🔐 Middleware de Autenticación JWT – FASTORDER (UTF-8)
// ------------------------------------------------------
// Verifica token JWT, extrae usuario y protege rutas privadas.
// Compatible con ESM (import/export default).
// ======================================================

import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";
import logger from "../utils/logger.js";

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No autorizado: falta token",
      });
    }

    const token = header.split(" ")[1];

    // Validar firma del token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuario
    const usuario = await Usuario.findByPk(decoded.id);

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: "Token inválido: usuario no existe",
      });
    }

    // Guardar en req para siguiente middleware/controlador
    req.usuario = {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      nombre: usuario.nombre,
    };

    logger.debug(`🔐 Usuario autenticado → ID ${usuario.id}`);

    return next();

  } catch (error) {
    logger.error("❌ Error autenticando usuario:", error);

    return res.status(401).json({
      success: false,
      message: "Token inválido o expirado",
    });
  }
};

// ======================================================
// 📦 Exportación correcta para ESM
// ======================================================
export default auth;
