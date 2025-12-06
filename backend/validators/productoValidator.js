// backend/validators/productoValidator.js
// ======================================================
// 🍽️ Validadores de Productos – FASTORDER (2026 Enterprise)
// ======================================================

"use strict";

import { body, param, query } from "express-validator";
import validarCampos from "../middlewares/validarCampos.js"; // ✔ CORRECTO: default import
import Categoria from "../models/Categoria.js";
import Producto from "../models/Producto.js";

// ======================================================
// 🔥 Cache inteligente con TTL 5 minutos
// ======================================================

let categoriaCache = new Map();
let categoriaCacheTTL = Date.now();
const CATEGORIA_TTL = 5 * 60 * 1000;

async function existeCategoria(id) {
  const now = Date.now();

  if (now - categoriaCacheTTL > CATEGORIA_TTL) {
    categoriaCache.clear();
    categoriaCacheTTL = now;
  }

  if (categoriaCache.has(id)) return true;

  const categoria = await Categoria.findByPk(id);
  if (!categoria) throw new Error("La categoría seleccionada no existe");

  categoriaCache.set(id, true);
  return true;
}

async function existeProducto(id) {
  const p = await Producto.findByPk(id);
  if (!p) throw new Error("El producto no existe");
  return true;
}

// ======================================================
// 🧠 Validación semántica del nombre
// ======================================================

const palabrasProhibidas = [
  "test", "producto", "item", "demo",
  "undefined", "null", "script", "prueba"
];

const validarNombreSemantico = (nombre) => {
  const lower = nombre.toLowerCase();

  if (palabrasProhibidas.some((p) => lower.includes(p))) {
    throw new Error("El nombre debe ser profesional, real y atractivo para clientes");
  }

  if (/<|>|script|onerror|onload/i.test(nombre)) {
    throw new Error("El nombre contiene caracteres no permitidos");
  }

  return true;
};

// ======================================================
// 🔄 Validaciones de unicidad
// ======================================================

const nombreUnicoCrear = async (nombre) => {
  const existe = await Producto.findOne({ where: { nombre: nombre.trim() } });
  if (existe) throw new Error("Ya existe un producto con ese nombre");
  return true;
};

const nombreUnicoActualizar = async (nombre, { req }) => {
  const id = Number(req.params.id);
  const existe = await Producto.findOne({ where: { nombre: nombre.trim() } });

  if (existe && existe.id !== id) {
    throw new Error("Ya existe otro producto con este nombre");
  }
  return true;
};

// ======================================================
// 🟢 VALIDAR CREACIÓN DE PRODUCTO
// ======================================================

export const validarCrearProducto = [
  body("nombre")
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 120 })
    .matches(/^[^<>]+$/)
    .custom(validarNombreSemantico)
    .custom(nombreUnicoCrear),

  body("precio")
    .notEmpty()
    .isFloat({ min: 100, max: 500000 }),

  body("categoriaId")
    .notEmpty()
    .isInt({ min: 1 })
    .custom(existeCategoria),

  body("descripcion")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .custom((v) => {
      if (v && v.length < 10) {
        throw new Error("La descripción debe ser más útil");
      }
      return true;
    }),

  body("estado")
    .optional()
    .isIn(["activo", "inactivo", "agotado"]),

  body("imagenUrl").optional().trim().isURL(),

  body("preparacionMinutos").optional().isInt({ min: 1, max: 180 }),

  body("destacado").optional().isBoolean(),

  validarCampos,
];

// ======================================================
// ✏️ VALIDAR ACTUALIZACIÓN DE PRODUCTO
// ======================================================

export const validarActualizarProducto = [
  param("id").isInt({ min: 1 }).custom(existeProducto),

  body("nombre")
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .matches(/^[^<>]+$/)
    .custom(validarNombreSemantico)
    .custom(nombreUnicoActualizar),

  body("precio").optional().isFloat({ min: 100, max: 500000 }),

  body("categoriaId").optional().isInt({ min: 1 }).custom(existeCategoria),

  body("descripcion").optional().trim().isLength({ max: 500 }),

  body("estado").optional().isIn(["activo", "inactivo", "agotado"]),

  body("imagenUrl").optional().trim().isURL(),

  body("preparacionMinutos").optional().isInt({ min: 1, max: 180 }),

  body("destacado").optional().isBoolean(),

  validarCampos,
];

// ======================================================
// 🔍 VALIDAR ID INDIVIDUAL
// ======================================================

export const validarIdProducto = [
  param("id").isInt({ min: 1 }).custom(existeProducto),
  validarCampos,
];

// ======================================================
// 📄 VALIDAR LISTADO DE PRODUCTOS
// ======================================================

export const validarListarProductos = [
  query("page").optional().toInt().isInt({ min: 1 }),
  query("limit").optional().toInt().isInt({ min: 1, max: 100 }),
  query("estado")
    .optional()
    .isIn(["activo", "inactivo", "agotado", "todos"]),
  query("categoriaId").optional().toInt().isInt({ min: 1 }),
  query("q").optional().trim().isLength({ max: 120 }),
  validarCampos,
];
