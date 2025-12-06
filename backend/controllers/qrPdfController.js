// backend/controllers/qrPdfController.js
// ======================================================
// 🧾 Controlador PDF de Códigos QR – FASTORDER (2026 Enterprise)
// --------------------------------------------------------------
// Genera PDFs premium listos para impresión física:
//  • Restaurante (QR general de menú)
//  • Mesas (QR por mesa para sala)
//  • Productos (QR por ítem de carta)
//
// Características nivel Rappi / Shopify / Didi:
//  - Reutiliza el mismo motor QR que la API JSON (qrService)
//  - Branding completo (logo, colores, nombre)
//  - QR en alta definición listo para imprenta
//  - Preparado para kioscos, porta-menús y stickers
// ======================================================

"use strict";

import Mesa from "../models/Mesa.js";
import Producto from "../models/Producto.js";
import Restaurante from "../models/Restaurante.js";

import {
  pdfQRMesa,
  pdfQRProducto,
  pdfQRRestaurante
} from "../services/qrPdfService.js";

import {
  buildPayloadFirmado,
  generarQRUniversal
} from "../services/qrService.js";

import logger from "../utils/logger.js";

// ======================================================
// 🧼 Sanitización simple para títulos y textos
// ======================================================
const clean = (str) => {
  if (!str) return str;
  return str.replace(/[<>]/g, "");
};

// ======================================================
// 📌 PDF Restaurante – Menú general
// GET /api/qr/pdf/restaurante
// ======================================================
export const generarPdfQRRestaurante = async (req, res) => {
  try {
    const restaurante = await Restaurante.findOne();

    if (!restaurante) {
      return res.status(404).json({
        success: false,
        message: "Restaurante no configurado"
      });
    }

    // Payload firmado igual que en la API QR JSON
    const payloadFirmado = buildPayloadFirmado("restaurante", {
      id: restaurante.id,
      nombre: clean(restaurante.nombre),
      slug: restaurante.slug
    });

    // Generar PNG base64 (misma estética que QR normal)
    const { png } = await generarQRUniversal(payloadFirmado);

    // PDF corporativo (logo, colores, etc.)
    const pdfBuffer = await pdfQRRestaurante({
      restaurante,
      qrPng: png
    });

    logger.info("🧾 PDF QR Restaurante generado correctamente");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=qr_restaurante_${restaurante.id}.pdf`
    );

    return res.send(pdfBuffer);
  } catch (err) {
    logger.error("❌ Error generando PDF QR Restaurante:", err);
    return res.status(500).json({
      success: false,
      message: "Error interno generando PDF QR Restaurante"
    });
  }
};

// ======================================================
// 📌 PDF Mesa – QR para sala
// GET /api/qr/pdf/mesas/:id
// ======================================================
export const generarPdfQRMesa = async (req, res) => {
  try {
    const { id } = req.params;

    const mesa = await Mesa.findByPk(id);
    if (!mesa) {
      return res.status(404).json({
        success: false,
        message: "Mesa no encontrada"
      });
    }

    // Branding (si existe restaurante configurado)
    const restaurante = await Restaurante.findOne().catch(() => null);

    const payloadFirmado = buildPayloadFirmado("mesa", {
      id: mesa.id,
      numero: mesa.numero
    });

    const { png } = await generarQRUniversal(payloadFirmado);

    const pdfBuffer = await pdfQRMesa({
      mesa,
      restaurante,
      qrPng: png
    });

    logger.info(`🧾 PDF QR Mesa generado → Mesa Nº ${mesa.numero}`);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=qr_mesa_${mesa.id}.pdf`
    );

    return res.send(pdfBuffer);
  } catch (err) {
    logger.error("❌ Error generando PDF QR Mesa:", err);
    return res.status(500).json({
      success: false,
      message: "Error interno generando PDF QR Mesa"
    });
  }
};

// ======================================================
// 📌 PDF Producto – QR para carta o góndola
// GET /api/qr/pdf/productos/:id
// ======================================================
export const generarPdfQRProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      });
    }

    const restaurante = await Restaurante.findOne().catch(() => null);

    const payloadFirmado = buildPayloadFirmado("producto", {
      id: producto.id,
      nombre: clean(producto.nombre),
      precio: Number(producto.precio),
      slug: producto.slug
    });

    const { png } = await generarQRUniversal(payloadFirmado);

    const pdfBuffer = await pdfQRProducto({
      producto,
      restaurante,
      qrPng: png
    });

    logger.info(`🧾 PDF QR Producto generado → ${producto.nombre}`);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=qr_producto_${producto.id}.pdf`
    );

    return res.send(pdfBuffer);
  } catch (err) {
    logger.error("❌ Error generando PDF QR Producto:", err);
    return res.status(500).json({
      success: false,
      message: "Error interno generando PDF QR Producto"
    });
  }
};
