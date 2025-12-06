// backend/controllers/productoController.js
// ======================================================
// 🛒 Controlador de Productos – FASTORDER (2026 Enterprise)
// --------------------------------------------------------
// Versión 100% ESM – compatible con todo tu backend.
// ======================================================

"use strict";

import Producto from "../models/Producto.js";
import Categoria from "../models/Categoria.js";
import PedidoItem from "../models/PedidoItem.js";
import slugify from "../utils/slugify.js";
import logger from "../utils/logger.js";
import { Op } from "sequelize";

// ======================================================
// 🧹 Sanitizador anti HTML
// ======================================================
const clean = (value) => {
  if (!value) return value;
  return value.toString().replace(/<[^>]+>/g, "").trim();
};

// ======================================================
// 🔍 Obtener producto por ID
// ======================================================
export const obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findByPk(id, {
      include: [{ model: Categoria, as: "categoria" }],
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    logger.info(`🟢 Producto consultado → ID ${id}`);

    return res.json({
      success: true,
      message: "Producto obtenido correctamente",
      data: producto,
    });
  } catch (error) {
    logger.error("❌ Error obteniendo producto por ID:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno obteniendo producto",
    });
  }
};

// ======================================================
// 📄 Listar productos con filtros
// ======================================================
export const obtenerProductos = async (req, res) => {
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

    if (estado !== "todos") where.estado = estado;
    if (categoriaId) where.categoriaId = categoriaId;
    if (q) where.nombre = { [Op.like]: `%${q}%` };

    const productos = await Producto.findAndCountAll({
      where,
      include: [{ model: Categoria, as: "categoria" }],
      order: [[orderBy, orderDirection]],
      limit,
      offset: (page - 1) * limit,
    });

    return res.json({
      success: true,
      message: "Productos obtenidos correctamente",
      data: {
        total: productos.count,
        page,
        pages: Math.ceil(productos.count / limit),
        items: productos.rows,
      },
    });
  } catch (error) {
    logger.error("❌ Error obteniendo productos:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno obteniendo productos",
    });
  }
};

// ======================================================
// ➕ Crear producto
// ======================================================
export const crearProducto = async (req, res) => {
  try {
    let { nombre, categoriaId } = req.body;
    nombre = clean(nombre);

    const categoria = await Categoria.findByPk(categoriaId);
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "La categoría seleccionada no existe",
      });
    }

    const existente = await Producto.findOne({ where: { nombre } });
    if (existente) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un producto con ese nombre",
      });
    }

    const slug = slugify(nombre);

    const nuevo = await Producto.create({
      ...req.body,
      nombre,
      slug,
    });

    logger.info(`🟢 Producto creado → ${nuevo.nombre}`);

    return res.status(201).json({
      success: true,
      message: "Producto creado correctamente",
      data: nuevo,
    });
  } catch (error) {
    logger.error("❌ Error creando producto:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno creando producto",
    });
  }
};

// ======================================================
// ✏️ Actualizar producto
// ======================================================
export const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    const payload = { ...req.body };

    if (payload.nombre) {
      payload.nombre = clean(payload.nombre);

      const otro = await Producto.findOne({
        where: {
          nombre: payload.nombre,
          id: { [Op.ne]: id },
        },
      });

      if (otro) {
        return res.status(400).json({
          success: false,
          message: "Ya existe otro producto con ese nombre",
        });
      }

      payload.slug = slugify(payload.nombre);
    }

    if (payload.categoriaId) {
      const cat = await Categoria.findByPk(payload.categoriaId);
      if (!cat) {
        return res.status(400).json({
          success: false,
          message: "La categoría enviada no existe",
        });
      }
    }

    await producto.update(payload);

    logger.info(`🟡 Producto actualizado → ID ${id}`);

    return res.json({
      success: true,
      message: "Producto actualizado correctamente",
      data: producto,
    });
  } catch (error) {
    logger.error("❌ Error actualizando producto:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno actualizando producto",
    });
  }
};

// ======================================================
// 🗑️ Eliminar (Soft-delete si tiene ventas)
// ======================================================
export const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    const vendido = await PedidoItem.findOne({ where: { productoId: id } });

    if (vendido) {
      await producto.update({ estado: "inactivo" });

      logger.warn(
        `🛑 Soft-delete aplicado → Producto ID ${id} (tiene historial de ventas)`
      );

      return res.json({
        success: true,
        message:
          "El producto tiene ventas, por lo tanto se desactivó (soft delete).",
      });
    }

    await producto.destroy();

    logger.warn(`🗑️ Producto eliminado físicamente → ID ${id}`);

    return res.json({
      success: true,
      message: "Producto eliminado correctamente",
    });
  } catch (error) {
    logger.error("❌ Error eliminando producto:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno eliminando producto",
    });
  }
};
