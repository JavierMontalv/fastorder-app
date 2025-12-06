// backend/services/qrService.js
// ======================================================
// 🔳 Servicio de QR – FASTORDER Enterprise (2026, ESM)
// ------------------------------------------------------
// Generación universal de QR para:
//  ✓ Mesas
//  ✓ Productos
//  ✓ Menú digital
//  ✓ Checkout
//  ✓ Payloads firmados (anti-manipulación)
//  ✓ URLs públicas estandarizadas
//
// Compatible con Rappi / Shopify POS / UberEats Storefront.
// ======================================================

import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import logger from "../utils/logger.js";

// ------------------------------------------------------
// 📁 Directorio local para almacenar QR
// ------------------------------------------------------
const QR_DIR = path.join(process.cwd(), "storage", "qr");

if (!fs.existsSync(QR_DIR)) {
  fs.mkdirSync(QR_DIR, { recursive: true });
}

// ======================================================
// 🔐 1. Firmar payload → evita manipulación del QR
// ------------------------------------------------------
// Se firma usando una SECRET KEY para validar
// que nadie altere el contenido del QR.
// ======================================================
export function buildPayloadFirmado(data = {}) {
  const secret = process.env.QR_SECRET_KEY || "FASTORDER_SECRET_2026";

  const payloadString = JSON.stringify(data);
  const firma = crypto.createHmac("sha256", secret).update(payloadString).digest("hex");

  return {
    ...data,
    firma
  };
}

// ======================================================
// 🌐 2. Construir URL pública estándar FASTORDER
// ------------------------------------------------------
// Ejemplo:
// buildPublicUrl("menu", { restauranteId: 12 })
// → https://fastorder.app/menu?data=xxxxx
// ======================================================
export function buildPublicUrl(tipo, data) {
  const base = process.env.FRONTEND_CLIENT_URL || "https://fastorder.app";

  const payloadFirmado = buildPayloadFirmado({
    tipo,
    ...data
  });

  const encoded = encodeURIComponent(JSON.stringify(payloadFirmado));

  return `${base}/qr?data=${encoded}`;
}

// ======================================================
// 🔳 3. Generar QR Universal (base64)
// ------------------------------------------------------
// Entrada: cualquier URL o json firmado.
// ======================================================
export async function generarQRUniversal(texto) {
  try {
    return await QRCode.toDataURL(texto, {
      errorCorrectionLevel: "H",
      margin: 1,
      scale: 7
    });
  } catch (error) {
    logger.error("❌ Error generando QR Universal:", error);
    throw new Error("No se pudo generar el QR");
  }
}

// ======================================================
// 📁 4. Generar QR como archivo PNG
// ======================================================
export async function generarQRArchivo(nombreArchivo, texto) {
  try {
    const filePath = path.join(QR_DIR, `${nombreArchivo}.png`);

    await QRCode.toFile(filePath, texto, {
      color: { dark: "#000000", light: "#FFFFFF" },
      margin: 1,
      width: 450
    });

    return filePath;
  } catch (error) {
    logger.error("❌ Error guardando archivo QR:", error);
    throw new Error("No se pudo guardar QR");
  }
}

// ======================================================
// 🪑 5. QR de mesa
// ======================================================
export async function generarQRMesa(mesaId) {
  const url = buildPublicUrl("mesa", { mesaId });
  return await generarQRUniversal(url);
}

// ======================================================
// 🍽️ 6. QR de producto
// ======================================================
export async function generarQRProducto(productoId) {
  const url = buildPublicUrl("producto", { productoId });
  return await generarQRUniversal(url);
}

// ======================================================
// 📋 7. QR de menú digital
// ======================================================
export async function generarQRMenu(restauranteId) {
  const url = buildPublicUrl("menu", { restauranteId });
  return await generarQRUniversal(url);
}

// ======================================================
// 💳 8. QR de pago (checkout)
// ======================================================
export async function generarQRPago(pagoId, monto) {
  const url = buildPublicUrl("pago", { pagoId, monto });
  return await generarQRUniversal(url);
}
