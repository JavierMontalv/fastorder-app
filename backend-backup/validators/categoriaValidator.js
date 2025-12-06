// backend/validators/categoriaValidator.js
// ======================================================
// 🏷️ Validadores de Categorías – FASTORDER (Enterprise 2026)
// ----------------------------------------------------------
// Nivel: Shopify Collections / UberEats Menu Manager / Rappi Aliado.
// Validación estricta, semántica, anti-XSS, unicidad inteligente,
// slug automático y sanitización profunda.
// ======================================================

'use strict';

import { body, param } from 'express-validator';
import { validarCampos } from '../middlewares/validarCampos.js';

import Categoria from '../models/Categoria.js';
import slugify from '../utils/slugify.js';

// ======================================================
// 🧠 CACHE INTELIGENTE PARA UNICIDAD (5 min)
// ======================================================
let cacheCategorias = {};
let cacheTimestamp = 0;

const cacheTTL = 5 * 60 * 1000;

const validarNombreUnico = async (nombre, { req }) => {
  const now = Date.now();

  if (now - cacheTimestamp > cacheTTL) {
    cacheCategorias = {};
    cacheTimestamp = now;
  }

  const lower = nombre.trim().toLowerCase();

  if (cacheCategorias[lower]) return true;

  const existe = await Categoria.findOne({ where: { nombre: nombre.trim() } });

  if (existe && Number(req.params?.id) !== existe.id) {
    throw new Error('Ya existe una categoría con este nombre');
  }

  cacheCategorias[lower] = true;
  return true;
};

// ======================================================
// 🔍 VALIDAR EXISTENCIA DE ID
// ======================================================
const validarExisteCategoria = async (id) => {
  const c = await Categoria.findByPk(id);
  if (!c) throw new Error('La categoría no existe');
  return true;
};

// ======================================================
// 🧼 VALIDACIÓN ANTI-XSS
// ======================================================
const validarTextoSeguro = (value) => {
  if (!value) return true;

  const prohibido = /<|>|script|onload|onerror|javascript:/i;
  if (prohibido.test(value)) {
    throw new Error('El texto contiene caracteres no permitidos');
  }

  return true;
};

// ======================================================
// 🎨 VALIDAR ÍCONO (emoji / URL corta)
// ======================================================
const validarIcono = (icono) => {
  if (!icono) return true;

  // emoji o URL pequeña (<200 chars)
  if (icono.length > 200) throw new Error('El icono es demasiado largo');

  // bloquear HTML
  if (/<|>/g.test(icono)) throw new Error('Icono inválido');

  return true;
};

// ======================================================
// ➕ CREAR CATEGORÍA – Nivel Shopify Collections
// ======================================================
export const validarCrearCategoria = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 120 })
    .withMessage('Debe tener entre 2 y 120 caracteres')
    .custom(validarTextoSeguro)
    .custom(validarNombreUnico),

  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Máximo 500 caracteres')
    .custom(validarTextoSeguro),

  body('icono').optional().trim().custom(validarIcono),

  body('estado').optional().isIn(['activo', 'inactivo']).withMessage('Estado inválido'),

  // Generar slug automáticamente
  (req, _, next) => {
    if (req.body.nombre) req.body.slug = slugify(req.body.nombre);
    next();
  },

  validarCampos
];

// ======================================================
// ✏️ ACTUALIZAR CATEGORÍA – Enterprise 2026
// ======================================================
export const validarActualizarCategoria = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido').custom(validarExisteCategoria),

  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Debe tener entre 2 y 120 caracteres')
    .custom(validarTextoSeguro)
    .custom(validarNombreUnico),

  body('descripcion').optional().trim().isLength({ max: 500 }).custom(validarTextoSeguro),

  body('icono').optional().trim().custom(validarIcono),

  body('estado').optional().isIn(['activo', 'inactivo']).withMessage('Estado inválido'),

  // Slug automático si se cambia nombre
  (req, _, next) => {
    if (req.body.nombre) req.body.slug = slugify(req.body.nombre);
    next();
  },

  validarCampos
];

// ======================================================
// 🔗 VALIDAR ID (GET / DELETE)
// ======================================================
export const validarIdCategoria = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido').custom(validarExisteCategoria),

  validarCampos
];

// ======================================================
// 📦 EXPORT
// ======================================================
export default {
  validarCrearCategoria,
  validarActualizarCategoria,
  validarIdCategoria
};
