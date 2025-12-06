// backend/services/qrPdfService.js
// ======================================================
// 🧾 Servicio PDF para QR – FASTORDER (Enterprise 2026)
// ------------------------------------------------------
// Produce PDFs corporativos listos para imprimir con:
// • Branding (logo, colores, fuentes)
// • QR HD centrado
// • Títulos profesionales
// ======================================================

'use strict';

import axios from 'axios';
import PDFDocument from 'pdfkit';
import logger from '../utils/logger.js';

// ======================================================
// 🧩 Descargar logo desde URL (opcional)
// ======================================================
async function loadImageBuffer(url) {
  if (!url) return null;

  try {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(res.data);
  } catch (e) {
    logger.warn('⚠️ No se pudo cargar el logo desde URL:', url);
    return null;
  }
}

// ======================================================
// 🎨 Tipografías
// ======================================================
const FONT = {
  regular: 'Helvetica',
  bold: 'Helvetica-Bold'
};

// ======================================================
// 🧾 Plantilla base de PDF con QR
// ======================================================
export async function generarPDFConQR({
  titulo = 'QR FASTORDER',
  subtitulo = '',
  qrPngBase64,
  logoUrl = null,
  colorPrimario = '#000000',
  colorSecundario = '#666666'
}) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40
      });

      const buffers = [];
      doc.on('data', (b) => buffers.push(b));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // ======================================================
      // LOGO
      // ======================================================
      const logoBuffer = await loadImageBuffer(logoUrl);
      if (logoBuffer) {
        doc.image(logoBuffer, 40, 40, { width: 110 });
      }

      // ======================================================
      // TÍTULO PRINCIPAL
      // ======================================================
      doc.fillColor(colorPrimario).font(FONT.bold).fontSize(28).text(titulo, 40, 160);

      // Subtítulo (opcional)
      if (subtitulo) {
        doc.fillColor(colorSecundario).font(FONT.regular).fontSize(16).text(subtitulo, 40, 195);
      }

      // Línea decorativa
      doc.moveTo(40, 225).lineTo(555, 225).strokeColor(colorPrimario).lineWidth(1).stroke();

      // ======================================================
      // QR centrado
      // ======================================================
      if (!qrPngBase64) throw new Error('qrPngBase64 es requerido');

      const qrBuffer = Buffer.from(qrPngBase64.split(',')[1], 'base64');

      const QR_WIDTH = 300;
      const QR_X = (595 - QR_WIDTH) / 2; // centro horizontal
      const QR_Y = 270;

      doc.image(qrBuffer, QR_X, QR_Y, { width: QR_WIDTH });

      // ======================================================
      // FOOTER
      // ======================================================
      doc
        .fillColor('#777')
        .font(FONT.regular)
        .fontSize(12)
        .text('Generado automáticamente por FASTORDER © 2026', 40, 780, {
          width: 515,
          align: 'center'
        });

      doc.end();
    } catch (err) {
      logger.error('❌ Error generando PDF QR:', err);
      reject(err);
    }
  });
}

// ======================================================
// 🧾 VERSIONES PRECONFIGURADAS (RESTAURANTE, MESA, PRODUCTO)
// ======================================================

// Restaurante
export async function pdfQRRestaurante({ qrPng, restaurante }) {
  return generarPDFConQR({
    titulo: restaurante.nombre || 'Restaurante',
    subtitulo: 'QR general – Menú digital',
    qrPngBase64: qrPng,
    logoUrl: restaurante.logoUrl,
    colorPrimario: restaurante.colorPrimario || '#000000',
    colorSecundario: restaurante.colorSecundario || '#666666'
  });
}

// Mesa
export async function pdfQRMesa({ qrPng, mesa, restaurante }) {
  return generarPDFConQR({
    titulo: `Mesa ${mesa.numero}`,
    subtitulo: restaurante?.nombre || '',
    qrPngBase64: qrPng,
    logoUrl: restaurante?.logoUrl,
    colorPrimario: restaurante?.colorPrimario || '#000000',
    colorSecundario: restaurante?.colorSecundario || '#666666'
  });
}

// Producto
export async function pdfQRProducto({ qrPng, producto, restaurante }) {
  return generarPDFConQR({
    titulo: producto.nombre,
    subtitulo: restaurante?.nombre || '',
    qrPngBase64: qrPng,
    logoUrl: restaurante?.logoUrl,
    colorPrimario: restaurante?.colorPrimario || '#000000',
    colorSecundario: restaurante?.colorSecundario || '#666666'
  });
}
