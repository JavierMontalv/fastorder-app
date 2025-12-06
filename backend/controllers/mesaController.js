// backend/controllers/mesaController.js
// ======================================================
// 🍽️ Controlador de Mesas – FASTORDER (2026 Enterprise)
// ------------------------------------------------------
// CRUD avanzado tipo RappiAliado / Shopify POS:
//  ✓ Validación de unicidad
//  ✓ Limpieza de payload
//  ✓ Filtros avanzados (estado + búsqueda)
//  ✓ Prevención de eliminación con pedidos activos
//  ✓ Integración WebSocket (si io está disponible)
//  ✓ Logs empresariales
// ======================================================

"use strict";

import Mesa from "../models/Mesa.js";
import Pedido from "../models/Pedido.js";
import logger from "../utils/logger.js";
import { Op } from "sequelize";

// Opcional: socket global (si lo usas)
let io = null;
export const setMesaSocket = (socketInstance) => {
  io = socketInstance;
};

// ======================================================
// 🧹 Sanitizar texto (anti XSS ligero)
// ======================================================
const clean = (str) => {
  if (!str) return str;
  return String(str).replace(/<[^>]+>/g, "").trim();
};

// ======================================================
// ➕ Crear mesa (única por número)
// ======================================================
export const crearMesa = async (req, res) => {
  try {
    const numero = clean(req.body.numero);
    const capacidad = req.body.capacidad || 4;
    const estado = req.body.estado || "libre";

    if (!numero) {
      return res.status(400).json({
        success: false,
        message: "El número de mesa es obligatorio",
      });
    }

    // Validar número único
    const existe = await Mesa.findOne({ where: { numero } });
    if (existe) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una mesa con este número",
      });
    }

    const nueva = await Mesa.create({
      numero,
      capacidad,
      estado,
    });

    logger.info(`🟢 Mesa creada → Nº ${numero}`);

    // Emitir evento WebSocket opcional
    io?.to("admin").emit("mesa:nueva", nueva);

    return res.status(201).json({
      success: true,
      message: "Mesa creada correctamente",
      data: nueva,
    });
  } catch (error) {
    logger.error("❌ Error creando mesa:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno creando mesa",
    });
  }
};

// ======================================================
// 📄 Listar mesas (filtros por estado y búsqueda)
// ======================================================
export const obtenerMesas = async (req, res) => {
  try {
    let { estado = "todas", q = "" } = req.query;

    const where = {};

    if (estado !== "todas") {
      where.estado = estado;
    }

    if (q) {
      where.numero = { [Op.like]: `%${clean(q)}%` };
    }

    const mesas = await Mesa.findAll({
      where,
      order: [["numero", "ASC"]],
    });

    return res.json({
      success: true,
      message: "Mesas obtenidas correctamente",
      data: mesas,
    });
  } catch (error) {
    logger.error("❌ Error obteniendo mesas:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno al obtener mesas",
    });
  }
};

// ======================================================
// 🔍 Obtener mesa por ID
// ======================================================
export const obtenerMesaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const mesa = await Mesa.findByPk(id);

    if (!mesa) {
      return res.status(404).json({
        success: false,
        message: "Mesa no encontrada",
      });
    }

    return res.json({
      success: true,
      message: "Mesa obtenida correctamente",
      data: mesa,
    });
  } catch (error) {
    logger.error("❌ Error obteniendo mesa:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno",
    });
  }
};

// ======================================================
// ✏️ Actualizar mesa (con validación de número único)
// ======================================================
export const actualizarMesa = async (req, res) => {
  try {
    const { id } = req.params;

    const mesa = await Mesa.findByPk(id);
    if (!mesa) {
      return res.status(404).json({
        success: false,
        message: "Mesa no encontrada",
      });
    }

    const { numero, capacidad, estado } = req.body;

    // Validar número único si cambia
    if (numero && numero !== mesa.numero) {
      const existe = await Mesa.findOne({ where: { numero } });
      if (existe) {
        return res.status(400).json({
          success: false,
          message: "Ya existe otra mesa con este número",
        });
      }
    }

    await mesa.update({
      numero: clean(numero ?? mesa.numero),
      capacidad: capacidad ?? mesa.capacidad,
      estado: estado ?? mesa.estado,
    });

    logger.info(`🟡 Mesa actualizada → ID ${id}`);

    io?.to("admin").emit("mesa:actualizada", mesa);

    return res.json({
      success: true,
      message: "Mesa actualizada correctamente",
      data: mesa,
    });
  } catch (error) {
    logger.error("❌ Error actualizando mesa:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno",
    });
  }
};

// ======================================================
// 🗑️ Eliminar mesa (si no tiene pedidos activos)
// ======================================================
export const eliminarMesa = async (req, res) => {
  try {
    const { id } = req.params;

    const mesa = await Mesa.findByPk(id);
    if (!mesa) {
      return res.status(404).json({
        success: false,
        message: "Mesa no encontrada",
      });
    }

    // Validar pedidos activos en esa mesa
    const pedidoActivo = await Pedido.findOne({
      where: {
        mesaId: id,
        estado: { [Op.notIn]: ["entregado", "cancelado"] },
      },
    });

    if (pedidoActivo) {
      return res.status(400).json({
        success: false,
        message: "No se puede eliminar una mesa con pedidos activos",
      });
    }

    await mesa.destroy();

    logger.warn(`🔴 Mesa eliminada → ID ${id}`);

    io?.to("admin").emit("mesa:eliminada", id);

    return res.json({
      success: true,
      message: "Mesa eliminada correctamente",
    });
  } catch (error) {
    logger.error("❌ Error eliminando mesa:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno eliminando mesa",
    });
  }
};
