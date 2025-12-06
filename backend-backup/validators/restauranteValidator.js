// backend/validators/restauranteValidator.js
// ======================================================
// 🏪 Validadores: Restaurante – FASTORDER (Enterprise 2026)
// ------------------------------------------------------
// Validación ultra estricta tipo Shopify / UberEats Manager.
// Branding, horarios, métodos de pago, identidad visual,
// canales de contacto, SEO y seguridad avanzada.
// ======================================================

"use strict";

import { body } from "express-validator";
import { validarCampos } from "../middlewares/validarCampos.js";

// ======================================================
// 🧠 Helpers semánticos avanzados
// ======================================================

const DIAS_PERMITIDOS = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];
const METODOS_PERMITIDOS = ["efectivo", "nequi", "daviplata", "tarjeta", "transferencia"];

const validarHex = (v) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);

// ----------------------------------------------
// 🕒 Validar horario estilo UberEats / DoorDash
// ----------------------------------------------
const validarHorario = (horarios) => {
  if (!Array.isArray(horarios)) {
    throw new Error("Horarios debe ser un arreglo");
  }

  const diasVistos = new Set();

  horarios.forEach((h) => {
    if (typeof h !== "object" || h === null) {
      throw new Error("Formato de horario inválido");
    }

    const { dia, apertura, cierre } = h;

    // Día válido
    if (!dia || !DIAS_PERMITIDOS.includes(dia)) {
      throw new Error(`Día inválido en horario: ${dia}`);
    }

    // Evitar días duplicados
    if (diasVistos.has(dia)) {
      throw new Error(`El día ${dia} está repetido en los horarios`);
    }
    diasVistos.add(dia);

    // Apertura / cierre requeridos
    if (!apertura || !cierre) {
      throw new Error("Cada horario debe incluir apertura y cierre");
    }

    // Formato de hora HH:mm
    const regexHora = /^\d{2}:\d{2}$/;
    if (!regexHora.test(apertura) || !regexHora.test(cierre)) {
      throw new Error("Formato de hora inválido (HH:MM)");
    }

    // Relación apertura < cierre
    if (apertura >= cierre) {
      throw new Error("La hora de apertura debe ser menor a la de cierre");
    }
  });

  return true;
};

// ----------------------------------------------
// 💳 Validar métodos de pago estilo Shopify
// ----------------------------------------------
const validarMetodosPago = (obj) => {
  if (typeof obj !== "object" || obj === null) {
    throw new Error("Métodos de pago inválidos");
  }

  const keys = Object.keys(obj);

  keys.forEach((k) => {
    if (!METODOS_PERMITIDOS.includes(k)) {
      throw new Error(`Método de pago no permitido: ${k}`);
    }
    if (typeof obj[k] !== "boolean") {
      throw new Error(`El método ${k} debe ser booleano`);
    }
  });

  return true;
};

// ----------------------------------------------
// 📞 Teléfono internacional LATAM/EU
// ----------------------------------------------
const validarTelefono = (value) => {
  if (!value) return true;
  const regex = /^\+?[0-9\s\-]{7,20}$/;
  if (!regex.test(value)) {
    throw new Error("Teléfono inválido");
  }
  return true;
};

// ----------------------------------------------
// 🧼 Texto seguro anti-XSS
// ----------------------------------------------
const validarTextoSeguro = (value) => {
  if (!value) return true;
  const forbidden = /<|>|script|onerror|onload|javascript:/i;
  if (forbidden.test(value)) {
    throw new Error("El campo contiene caracteres no permitidos");
  }
  return true;
};

// ======================================================
// 🔥 Validación principal – Crear/Actualizar restaurante
// ======================================================

export const validarActualizarRestaurante = [
  // ---------------------------------------
  // 🏷️ Nombre público del restaurante
  // ---------------------------------------
  body("nombre")
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage("El nombre debe tener entre 2 y 150 caracteres")
    .custom(validarTextoSeguro),

  // ---------------------------------------
  // 📄 Descripción SEO / menú
  // ---------------------------------------
  body("descripcion")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("La descripción no puede exceder 500 caracteres")
    .custom(validarTextoSeguro),

  // ---------------------------------------
  // 🖼️ Identidad visual (logo / portada)
  // ---------------------------------------
  body("logoUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("logoUrl debe ser una URL válida"),

  body("portadaUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("portadaUrl debe ser una URL válida"),

  // ---------------------------------------
  // 🔛 Estado operativo
  // ---------------------------------------
  body("estado")
    .optional()
    .isIn(["abierto", "cerrado", "preparando", "fuera_servicio"])
    .withMessage("Estado inválido (abierto/cerrado/preparando/fuera_servicio)"),

  // ---------------------------------------
  // 🎨 Branding personalizado
  // ---------------------------------------
  body("colorPrimario")
    .optional()
    .custom((v) => {
      if (!validarHex(v)) {
        throw new Error("colorPrimario debe ser un color HEX válido");
      }
      return true;
    }),

  body("colorSecundario")
    .optional()
    .custom((v) => {
      if (!validarHex(v)) {
        throw new Error("colorSecundario debe ser un color HEX válido");
      }
      return true;
    }),

  // ---------------------------------------
  // 🕒 Horarios de atención
  // ---------------------------------------
  body("horarios")
    .optional()
    .custom(validarHorario),

  // ---------------------------------------
  // 💳 Métodos de pago
  // ---------------------------------------
  body("metodosPago")
    .optional()
    .custom(validarMetodosPago),

  // ---------------------------------------
  // 📍 Dirección física
  // ---------------------------------------
  body("direccion")
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage("La dirección no puede superar 250 caracteres")
    .custom(validarTextoSeguro),

  // ---------------------------------------
  // 📞 Teléfono / WhatsApp
  // ---------------------------------------
  body("telefono")
    .optional()
    .trim()
    .custom(validarTelefono),

  // ---------------------------------------
  // 🌎 Redes sociales (extensibles)
  // ---------------------------------------
  body("instagram")
    .optional()
    .trim()
    .isURL()
    .withMessage("instagram debe ser una URL válida"),

  body("facebook")
    .optional()
    .trim()
    .isURL()
    .withMessage("facebook debe ser una URL válida"),

  body("whatsappLink")
    .optional()
    .trim()
    .isURL()
    .withMessage("whatsappLink debe ser una URL válida"),

  // ---------------------------------------
  // 🔒 Validación final
  // ---------------------------------------
  validarCampos,
];
