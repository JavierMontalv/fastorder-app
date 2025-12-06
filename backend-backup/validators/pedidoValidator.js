// backend/validators/pedidoValidator.js
// ======================================================
// 🧾 Validadores de Pedido – FASTORDER (Enterprise 2026)
// ------------------------------------------------------
// Nivel Shopify POS / Rappi Cocina / UberEats Orders.
// Reglas anti-fraude + validación estricta + flujo seguro.
// ======================================================

"use strict";

import { body, param } from "express-validator";
import validarCampos from "../middlewares/validarCampos.js"; // ✔ CORRECTO (default import)

import Producto from "../models/Producto.js";
import Pedido from "../models/Pedido.js";
import Mesa from "../models/Mesa.js";

// ======================================================
// 🔍 HELPERS ENTERPRISE
// ======================================================

/** Verifica si un producto existe */
const existeProducto = async (id) => {
  const prod = await Producto.findByPk(id);
  if (!prod) throw new Error("Producto no existe en el inventario");
  return true;
};

/** Verifica existencia del pedido */
const existePedido = async (id) => {
  const p = await Pedido.findByPk(id);
  if (!p) throw new Error("Pedido no encontrado");
  return true;
};

/** Verifica que la mesa sea válida */
const existeMesa = async (mesaId) => {
  const mesa = await Mesa.findByPk(mesaId);
  if (!mesa) throw new Error("Mesa no válida");
  return true;
};

/** Valida que no existan items repetidos */
const validarItemsUnicos = (items) => {
  const ids = items.map((i) => i.productoId);
  const repetidos = ids.filter((id, i) => ids.indexOf(id) !== i);

  if (repetidos.length > 0) {
    throw new Error(
      `El pedido contiene productos duplicados: ${[...new Set(repetidos)].join(", ")}`
    );
  }

  return true;
};

/** Anti-XSS para notas */
const validarNotaSegura = (nota) => {
  if (/<|>|script|onload|onerror/i.test(nota)) {
    throw new Error("La nota contiene caracteres no permitidos");
  }
  return true;
};

// ======================================================
// 🛒 VALIDAR CREACIÓN DE PEDIDO – Nivel UberEats/Kitchen
// ======================================================

export const validarCrearPedido = [
  body("items")
    .isArray({ min: 1, max: 60 })
    .withMessage("El pedido debe incluir entre 1 y 60 productos")
    .custom(validarItemsUnicos),

  body("mesaId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("mesaId inválido")
    .bail()
    .custom(existeMesa),

  body("items.*.productoId")
    .notEmpty()
    .withMessage("productoId es obligatorio")
    .isInt({ min: 1 })
    .withMessage("productoId inválido")
    .custom(existeProducto),

  body("items.*.cantidad")
    .notEmpty()
    .withMessage("La cantidad es obligatoria")
    .isInt({ min: 1, max: 99 }),

  body("items.*.precio").custom(() => {
    throw new Error("El cliente no puede enviar precios manualmente");
  }),

  body("nota")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .custom(validarNotaSegura),

  validarCampos,
];

// ======================================================
// 🔄 VALIDAR CAMBIO DE ESTADO – Nivel Rappi Cocina PRO
// ======================================================

const validarSecuenciaEstado = async (estadoNuevo, { req }) => {
  const id = req.params.id;
  const pedido = await Pedido.findByPk(id);

  if (!pedido) throw new Error("Pedido no encontrado");

  const actual = pedido.estado;
  const next = estadoNuevo;

  const flujos = {
    pendiente: ["preparacion", "cancelado"],
    preparacion: ["listo", "cancelado"],
    listo: ["entregado"],
    entregado: [],
    cancelado: [],
  };

  if (!flujos[actual].includes(next)) {
    throw new Error(
      `Transición inválida: ${actual} → ${next}. Flujo permitido: ${flujos[actual].join(", ")}`
    );
  }

  return true;
};

export const validarCambioEstado = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID inválido de pedido")
    .custom(existePedido),

  body("estado")
    .isIn(["pendiente", "preparacion", "listo", "entregado", "cancelado"])
    .withMessage("Estado inválido")
    .custom(validarSecuenciaEstado),

  validarCampos,
];

// ======================================================
// 🔍 VALIDAR ID
// ======================================================

export const validarIdPedido = [
  param("id").isInt({ min: 1 }).custom(existePedido),
  validarCampos,
];

// ======================================================
// 📦 EXPORT FINAL
// ======================================================

export default {
  validarCrearPedido,
  validarCambioEstado,
  validarIdPedido,
};
