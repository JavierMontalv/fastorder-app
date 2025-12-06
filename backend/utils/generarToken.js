// backend/utils/generarToken.js
// ======================================================
// 🔐 Generar Token JWT – FASTORDER Enterprise (2026)
// ------------------------------------------------------
// Tokens seguros para autenticación de:
//  ✓ Panel Admin-Pro
//  ✓ App Cliente
//  ✓ App de Meseros
//  ✓ Servicios internos (POS, Cocina, QR)
// ------------------------------------------------------
// Totalmente compatible con ESM (export default)
// ======================================================

import jwt from "jsonwebtoken";
import logger from "./logger.js";

const TOKEN_EXP = process.env.JWT_EXPIRES || "8h";
const ISSUER = process.env.JWT_ISSUER || "fastorder.backend";
const AUDIENCE = process.env.JWT_AUDIENCE || "fastorder.users";

// ======================================================
// 🔐 FUNCIÓN PRINCIPAL (versión correcta para tu backend)
// ======================================================
export default function generarToken(id, email, rol = "user") {
  if (!id || !email) {
    throw new Error("ID y email son requeridos para generar token");
  }

  const payload = {
    id,
    email,
    rol,
  };

  logger.info(`🔑 Generando JWT para usuario ID=${id} rol=${rol}`);

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: TOKEN_EXP,
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithm: "HS256",
  });
}
