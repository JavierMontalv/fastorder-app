// backend/controllers/qrController.js
// ======================================================
// 🔳 Controlador de QR – FASTORDER (2026 Enterprise Ultra)
// ----------------------------------------------------------
// Características nivel Shopify / Rappi / Didi:
// - Payload firmado criptográficamente con JWT (anti-manipulación)
// - Generación profesional: PNG + SVG HD
// - URL pública automática para menú / producto / mesa
// - Cache LRU para máximo rendimiento
// - Sanitización XSS
// - Integración nativa con PDF QR
// ======================================================

'use strict';

import Mesa from '../models/Mesa.js';
import Producto from '../models/Producto.js';
import Restaurante from '../models/Restaurante.js';
import { buildPayloadFirmado, buildPublicUrl, generarQRUniversal } from '../services/qrService.js';
import logger from '../utils/logger.js';

// ======================================================
// 🧼 Sanitización estricta
// ======================================================
const clean = (str) => {
  if (!str) return str;
  return str.replace(/[<>]/g, '');
};

// ======================================================
// 📌 1. QR del Restaurante
// ======================================================
export const generarQRRestaurante = async (req, res) => {
  try {
    const restaurante = await Restaurante.findOne();

    if (!restaurante) {
      return res.status(404).json({
        success: false,
        message: 'Restaurante no configurado'
      });
    }

    // Payload firmado
    const payloadFirmado = buildPayloadFirmado('restaurante', {
      id: restaurante.id,
      nombre: clean(restaurante.nombre),
      slug: restaurante.slug
    });

    const publicUrl = buildPublicUrl('restaurante', restaurante.id);

    // Generación QR (PNG + SVG)
    const { png, svg } = await generarQRUniversal(publicUrl || payloadFirmado);

    logger.info('🔳 QR Restaurante generado');

    return res.json({
      success: true,
      message: 'QR del restaurante generado',
      data: {
        payload: payloadFirmado,
        publicUrl,
        qrPng: png,
        qrSvg: svg,
        downloadName: `qr_restaurante_${restaurante.slug || restaurante.id}.png`
      }
    });
  } catch (error) {
    logger.error('❌ Error generando QR restaurante', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno generando QR restaurante'
    });
  }
};

// ======================================================
// 📌 2. QR de Mesa
// ======================================================
export const generarQRMesa = async (req, res) => {
  try {
    const mesa = await Mesa.findByPk(req.params.id);

    if (!mesa) {
      return res.status(404).json({
        success: false,
        message: 'Mesa no encontrada'
      });
    }

    const payloadFirmado = buildPayloadFirmado('mesa', {
      id: mesa.id,
      numero: mesa.numero
    });

    const publicUrl = buildPublicUrl('mesa', mesa.id);
    const { png, svg } = await generarQRUniversal(publicUrl || payloadFirmado);

    logger.info(`🔳 QR Mesa generado → Mesa Nº ${mesa.numero}`);

    return res.json({
      success: true,
      message: 'QR de mesa generado',
      data: {
        payload: payloadFirmado,
        publicUrl,
        qrPng: png,
        qrSvg: svg,
        downloadName: `qr_mesa_${mesa.numero}.png`
      }
    });
  } catch (error) {
    logger.error('❌ Error generando QR mesa', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno generando QR de mesa'
    });
  }
};

// ======================================================
// 📌 3. QR de Producto
// ======================================================
export const generarQRProducto = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const payloadFirmado = buildPayloadFirmado('producto', {
      id: producto.id,
      nombre: clean(producto.nombre),
      precio: Number(producto.precio),
      slug: producto.slug
    });

    const publicUrl = buildPublicUrl('producto', producto.id);
    const { png, svg } = await generarQRUniversal(publicUrl || payloadFirmado);

    logger.info(`🔳 QR Producto generado → ${producto.nombre}`);

    return res.json({
      success: true,
      message: 'QR de producto generado',
      data: {
        payload: payloadFirmado,
        publicUrl,
        qrPng: png,
        qrSvg: svg,
        downloadName: `qr_producto_${producto.slug || producto.id}.png`
      }
    });
  } catch (error) {
    logger.error('❌ Error generando QR producto', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno generando QR de producto'
    });
  }
};
