// backend/controllers/categoriaController.js
// ======================================================
// 🏷️ Controlador de Categorías – FASTORDER (Enterprise 2026)
// ======================================================

"use strict";

import Categoria from "../models/Categoria.js";
import slugify from "../utils/slugify.js";
import logger from "../utils/logger.js";
import { Op } from "sequelize";

// ======================================================
// Sanitizar strings (anti XSS)
// ======================================================
const clean = (str) => {
  if (!str) return str;
  return str.replace(/<[^>]+>/g, "");
};

let categoriaCache = null;

// ======================================================
// CREAR CATEGORÍA
// ======================================================
export const crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion, icono, estado } = req.body;

    const nombreLimpio = clean(nombre);
    const slug = slugify(nombreLimpio);

    const existe = await Categoria.findOne({ where: { slug } });
    if (existe) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una categoría con ese nombre",
      });
    }

    const nueva = await Categoria.create({
      nombre: nombreLimpio,
      slug,
      descripcion: clean(descripcion),
      icono: clean(icono),
      estado: estado || "activo",
    });

    categoriaCache = null;

    return res.status(201).json({
      success: true,
      message: "Categoría creada correctamente",
      data: nueva,
    });
  } catch (error) {
    logger.error("❌ Error creando categoría:", error);
    return res.status(500).json({ success: false, message: "Error interno" });
  }
};

// ======================================================
// LISTAR CATEGORÍAS
// ======================================================
export const obtenerCategorias = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 20,
      estado = "todos",
      q = "",
      orderBy = "createdAt",
      orderDirection = "DESC",
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const where = {};
    if (estado !== "todos") where.estado = estado;
    if (q) where.nombre = { [Op.like]: `%${q}%` };

    const categorias = await Categoria.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [[orderBy, orderDirection]],
    });

    return res.json({
      success: true,
      message: "Categorías obtenidas",
      data: {
        total: categorias.count,
        page,
        pages: Math.ceil(categorias.count / limit),
        items: categorias.rows,
      },
    });
  } catch (error) {
    logger.error("❌ Error obteniendo categorías:", error);
    return res.status(500).json({ success: false, message: "Error interno" });
  }
};

// ======================================================
// OBTENER POR ID
// ======================================================
export const obtenerCategoriaPorId = async (req, res) => {
  try {
    const categoria = await Categoria.findByPk(req.params.id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });
    }

    return res.json({
      success: true,
      message: "Categoría obtenida",
      data: categoria,
    });
  } catch (error) {
    logger.error("❌ Error obteniendo categoría:", error);
    return res.status(500).json({ success: false, message: "Error interno" });
  }
};

// ======================================================
// ACTUALIZAR
// ======================================================
export const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const categoria = await Categoria.findByPk(id);
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });
    }

    if (req.body.nombre) {
      const nombreLimpio = clean(req.body.nombre);
      const slug = slugify(nombreLimpio);

      const otra = await Categoria.findOne({ where: { slug } });

      if (otra && otra.id !== Number(id)) {
        return res.status(400).json({
          success: false,
          message: "Ya existe otra categoría con ese nombre",
        });
      }

      req.body.nombre = nombreLimpio;
      req.body.slug = slug;
    }

    req.body.descripcion = clean(req.body.descripcion);
    req.body.icono = clean(req.body.icono);

    await categoria.update(req.body);

    categoriaCache = null;

    return res.json({
      success: true,
      message: "Categoría actualizada",
      data: categoria,
    });
  } catch (error) {
    logger.error("❌ Error actualizando categoría:", error);
    return res.status(500).json({ success: false, message: "Error interno" });
  }
};

// ======================================================
// ELIMINAR
// ======================================================
export const eliminarCategoria = async (req, res) => {
  try {
    const categoria = await Categoria.findByPk(req.params.id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });
    }

    await categoria.destroy();
    categoriaCache = null;

    return res.json({
      success: true,
      message: "Categoría eliminada correctamente",
    });
  } catch (error) {
    logger.error("❌ Error eliminando categoría:", error);
    return res.status(500).json({ success: false, message: "Error interno" });
  }
};
