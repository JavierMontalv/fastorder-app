// backend/controllers/platoController.js
// ======================================================
// 🍽️ Controlador de Platos – FASTORDER (2026 Enterprise)
// ------------------------------------------------------
// Alias del módulo Producto con lógica PRO adaptada
// para restaurantes. Totalmente compatible con el
// ecosistema FASTORDER (menú, QR, POS, inventario).
// ======================================================

"use strict";

import Producto from "../models/Producto.js";
import Categoria from "../models/Categoria.js";
import slugify from "../utils/slugify.js";
import logger from "../utils/logger.js";
import { Op } from "sequelize";

// ======================================================
// 📄 Listar platos (con búsqueda, filtros y paginación)
// ======================================================
export const obtenerPlatos = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 20,
      estado = "todos",
      categoriaId,
      q = "",
      orderBy = "createdAt",
      orderDirection = "DESC",
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const where = {};

    // Filtrar estado
    if (estado !== "todos") where.estado = estado;

    // Filtrar categoría
    if (categoriaId) where.categoriaId = categoriaId;

    // Búsqueda por nombre
    if (q) {
      where.nombre = {
        [Op.like]: `%${q}%`
      };
    }

    const platos = await Producto.findAndCountAll({
      where,
      include: [{ model: Categoria, as: "categoria" }],
      order: [[orderBy, orderDirection]],
      limit,
      offset: (page - 1) * limit,
    });

    return res.json({
      success: true,
      message: "Platos obtenidos correctamente",
      data: {
        total: platos.count,
        page,
        pages: Math.ceil(platos.count / limit),
        items: platos.rows,
      },
    });

  } catch (error) {
    logger.error("❌ Error obteniendo platos:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno al obtener platos",
    });
  }
};

// ======================================================
// ➕ Crear plato (validación + slug + consistencia)
// ======================================================
export const crearPlato = async (req, res) => {
  try {
    const { nombre, categoriaId } = req.body;

    // Validar categoría
    const categoria = await Categoria.findByPk(categoriaId);
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "La categoría seleccionada no existe",
      });
    }

    // Evitar duplicados
    const existente = await Producto.findOne({ where: { nombre } });
    if (existente) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un plato con ese nombre",
      });
    }

    const slug = slugify(nombre);

    const nuevo = await Producto.create({
      ...req.body,
      slug,
    });

    logger.info(`🍽️ Plato creado → ${nuevo.nombre}`);

    return res.status(201).json({
      success: true,
      message: "Plato creado correctamente",
      data: nuevo,
    });

  } catch (error) {
    logger.error("❌ Error creando plato:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno al crear plato",
    });
  }
};

// ======================================================
// ✏️ Actualizar plato (regenera slug si cambia nombre)
// ======================================================
export const actualizarPlato = async (req, res) => {
  try {
    const { id } = req.params;

    const plato = await Producto.findByPk(id);
    if (!plato) {
      return res.status(404).json({
        success: false,
        message: "Plato no encontrado",
      });
    }

    // Si cambia nombre, actualizar slug
    if (req.body.nombre) {
      req.body.slug = slugify(req.body.nombre);
    }

    // Validar categoría si se envía
    if (req.body.categoriaId) {
      const categoria = await Categoria.findByPk(req.body.categoriaId);
      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: "La nueva categoría no existe",
        });
      }
    }

    await plato.update(req.body);

    logger.info(`🍽️ Plato actualizado → ID ${id}`);

    return res.json({
      success: true,
      message: "Plato actualizado correctamente",
      data: plato,
    });

  } catch (error) {
    logger.error("❌ Error actualizando plato:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno actualizando plato",
    });
  }
};

// ======================================================
// 🗑️ Eliminar plato
// ======================================================
export const eliminarPlato = async (req, res) => {
  try {
    const { id } = req.params;

    const plato = await Producto.findByPk(id);
    if (!plato) {
      return res.status(404).json({
        success: false,
        message: "Plato no encontrado",
      });
    }

    await plato.destroy();

    logger.warn(`🍽️ Plato eliminado → ID ${id}`);

    return res.json({
      success: true,
      message: "Plato eliminado correctamente",
    });

  } catch (error) {
    logger.error("❌ Error eliminando plato:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno eliminando plato",
    });
  }
};
