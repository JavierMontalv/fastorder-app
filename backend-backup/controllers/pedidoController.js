// backend/controllers/pedidoController.js
// ======================================================
// 🧾 Controlador de Pedidos – FASTORDER (2026 Enterprise)
// ------------------------------------------------------
// Manejo completo, transaccional y profesional del ciclo
// de vida del pedido. Nivel Rappi Cocina / Shopify POS.
// ======================================================

"use strict";

import Pedido from "../models/Pedido.js";
import PedidoItem from "../models/PedidoItem.js";
import Producto from "../models/Producto.js";
import Mesa from "../models/Mesa.js";
import { sequelize } from "../config/db.js";
import logger from "../utils/logger.js";
import { Op } from "sequelize";

// ======================================================
// ➕ Crear pedido (con transacción + validaciones)
// ======================================================
export const crearPedido = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { mesaId, items, nota } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "El pedido debe contener al menos un producto",
      });
    }

    // ======================================================
    // 🪑 Validar mesa (si se envía)
    // ======================================================
    let mesa = null;
    if (mesaId) {
      mesa = await Mesa.findByPk(mesaId);
      if (!mesa) {
        return res.status(404).json({
          success: false,
          message: "Mesa no encontrada",
        });
      }

      // Evitar pedidos en mesas cerradas
      if (mesa.estado === "cerrada") {
        return res.status(400).json({
          success: false,
          message: "La mesa está cerrada y no recibe pedidos",
        });
      }
    }

    // ======================================================
    // 🧾 Crear pedido base
    // ======================================================
    const pedido = await Pedido.create(
      {
        usuarioId: req.usuario.id,
        mesaId: mesa?.id || null,
        nota: nota || "",
        estado: "pendiente",
        total: 0,
        tiempoPreparacion: 0, // tiempo total dinámico
      },
      { transaction: t }
    );

    let total = 0;
    let tiempoTotal = 0;

    // ======================================================
    // 🛒 Crear items del pedido
    // ======================================================
    for (const item of items) {
      const producto = await Producto.findByPk(item.productoId);

      if (!producto) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: `Producto ID ${item.productoId} no existe`,
        });
      }

      // Validar estado
      if (producto.estado === "agotado" || producto.estado === "inactivo") {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `El producto '${producto.nombre}' no está disponible`,
        });
      }

      // Subtotal
      const subtotal = Number(producto.precio) * item.cantidad;
      total += subtotal;

      // Calcular tiempo total de preparación
      if (producto.preparacionMinutos) {
        tiempoTotal += producto.preparacionMinutos * item.cantidad;
      }

      await PedidoItem.create(
        {
          pedidoId: pedido.id,
          productoId: producto.id,
          cantidad: item.cantidad,
          subtotal,
        },
        { transaction: t }
      );
    }

    // ======================================================
    // 🔁 Actualizar pedido final (total + tiempo)
    // ======================================================
    await pedido.update(
      {
        total,
        tiempoPreparacion: tiempoTotal,
      },
      { transaction: t }
    );

    await t.commit();

    logger.info(
      `🟢 Pedido creado → ID ${pedido.id} | Mesa: ${
        mesaId || "N/A"
      } | Total: $${total} | ETA: ${tiempoTotal} min`
    );

    return res.status(201).json({
      success: true,
      message: "Pedido creado correctamente",
      data: pedido,
    });

  } catch (error) {
    await t.rollback();
    logger.error("❌ Error creando pedido:", error);

    return res.status(500).json({
      success: false,
      message: "Error interno creando el pedido",
    });
  }
};

// ======================================================
// 📄 Listar pedidos (con filtros por estado, mesa, fechas)
// ======================================================
export const obtenerPedidos = async (req, res) => {
  try {
    const { estado = "todos", mesaId, desde, hasta } = req.query;

    const where = {};

    if (estado !== "todos") where.estado = estado;
    if (mesaId) where.mesaId = mesaId;
    if (desde && hasta) {
      where.createdAt = {
        [Op.between]: [new Date(desde + " 00:00"), new Date(hasta + " 23:59")],
      };
    }

    const pedidos = await Pedido.findAll({
      where,
      order: [["createdAt", "DESC"]],
      include: [
        { model: PedidoItem, as: "items", include: ["producto"] },
        { model: Mesa, as: "mesa" },
      ],
    });

    return res.json({
      success: true,
      message: "Pedidos obtenidos correctamente",
      data: pedidos,
    });

  } catch (error) {
    logger.error("❌ Error listando pedidos:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno obteniendo pedidos",
    });
  }
};

// ======================================================
// 🔍 Obtener pedido por ID
// ======================================================
export const obtenerPedidoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await Pedido.findByPk(id, {
      include: [
        { model: PedidoItem, as: "items", include: ["producto"] },
        { model: Mesa, as: "mesa" },
      ],
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    return res.json({
      success: true,
      message: "Pedido obtenido",
      data: pedido,
    });

  } catch (error) {
    logger.error("❌ Error obteniendo pedido:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno",
    });
  }
};

// ======================================================
// 🔁 Cambiar estado (con validación de flujo correcto)
// ======================================================
const ESTADOS_VALIDOS = {
  pendiente: ["cocina", "cancelado"],
  cocina: ["listo", "cancelado"],
  listo: ["entregado"],
};

export const cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const pedido = await Pedido.findByPk(id);

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    // Validar flujo de estado (reglas POS)
    const permitidos = ESTADOS_VALIDOS[pedido.estado] || [];
    if (!permitidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Transición de estado no permitida: ${pedido.estado} → ${estado}`,
      });
    }

    await pedido.update({ estado });

    logger.info(`🔄 Pedido actualizado → ID ${id} → Estado: ${estado}`);

    return res.json({
      success: true,
      message: "Estado actualizado correctamente",
      data: pedido,
    });

  } catch (error) {
    logger.error("❌ Error cambiando estado de pedido:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno",
    });
  }
};
