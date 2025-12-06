// backend/controllers/statsController.js
// ======================================================
// 📊 StatsController – FASTORDER (Enterprise 2026)
// ------------------------------------------------------
// Panel analítico tipo Shopify / Rappi Aliado.
// KPIs incluidos:
// - Pedidos hoy / semana / mes
// - Ventas netas (totales - cancelados)
// - Ticket promedio
// - Pedidos por estado
// - Pedidos por hora (heatmap)
// - Top productos (cantidad y valor)
// - Cancelaciones y ratio
// - Mesas activas / ocupación
// - Cache inteligente (auto-expira)
// ======================================================

"use strict";

import { Op, fn, col, literal } from "sequelize";
import Pedido from "../models/Pedido.js";
import PedidoItem from "../models/PedidoItem.js";
import Producto from "../models/Producto.js";
import Mesa from "../models/Mesa.js";
import logger from "../utils/logger.js";

// ======================================================
// 🕒 Utilidades de tiempo
// ======================================================
const inicioFin = (inicio, fin) => ({ i: inicio, f: fin });

const rangoHoy = () => {
  const i = new Date(); i.setHours(0, 0, 0, 0);
  const f = new Date(); f.setHours(23, 59, 59, 999);
  return inicioFin(i, f);
};

const rangoSemana = () => {
  const f = new Date();
  const i = new Date(f);
  i.setDate(f.getDate() - 7);
  i.setHours(0, 0, 0, 0);
  return inicioFin(i, f);
};

const rangoMes = () => {
  const now = new Date();
  const i = new Date(now.getFullYear(), now.getMonth(), 1);
  const f = now;
  return inicioFin(i, f);
};

// ======================================================
// 🔥 Cache Inteligente
// ======================================================
let cache = null;
let cacheTTL = 0;

// ======================================================
// 📌 Controlador principal – Enterprise Analytics
// ======================================================
export const obtenerStatsDashboard = async (req, res) => {
  try {
    const now = Date.now();

    // ⚡ Cache 20 segundos
    if (cache && cacheTTL > now) {
      return res.json({
        success: true,
        cached: true,
        message: "Stats obtenidos (cache)",
        data: cache,
      });
    }

    // ================================
    // RANGOS DE TIEMPO
    // ================================
    const hoy = rangoHoy();
    const semana = rangoSemana();
    const mes = rangoMes();

    // ================================
    // 1️⃣ PEDIDOS – HOY / SEMANA / MES
    // ================================
    const countPedidos = async (r) =>
      await Pedido.count({
        where: { createdAt: { [Op.between]: [r.i, r.f] } },
      });

    const pedidosHoy = await countPedidos(hoy);
    const pedidosSemana = await countPedidos(semana);
    const pedidosMes = await countPedidos(mes);

    // ================================
    // 2️⃣ VENTAS NETAS
    // ================================
    const ventas = async (r) => {
      const raw = await Pedido.findOne({
        attributes: [[fn("SUM", col("total")), "monto"]],
        where: {
          createdAt: { [Op.between]: [r.i, r.f] },
          estado: { [Op.notIn]: ["cancelado"] },
        },
        raw: true,
      });

      return Number(raw?.monto || 0);
    };

    const ventasHoy = await ventas(hoy);
    const ventasSemana = await ventas(semana);
    const ventasMes = await ventas(mes);

    // ================================
    // 3️⃣ Ticket Promedio
    // ================================
    const ticketPromedio = pedidosHoy > 0 ? ventasHoy / pedidosHoy : 0;

    // ================================
    // 4️⃣ Pedidos por estado (funnel)
    // ================================
    const pedidosPorEstado = await Pedido.findAll({
      attributes: ["estado", [fn("COUNT", col("id")), "total"]],
      where: { createdAt: { [Op.between]: [hoy.i, hoy.f] } },
      group: ["estado"],
      raw: true,
    });

    // Ratio de cancelación (%)
    const canceladosHoy =
      pedidosPorEstado.find((x) => x.estado === "cancelado")?.total || 0;

    const ratioCancelacion =
      pedidosHoy > 0 ? (canceladosHoy / pedidosHoy) * 100 : 0;

    // ================================
    // 5️⃣ Pedidos por hora
    // ================================
    const pedidosPorHora = await Pedido.findAll({
      attributes: [
        [fn("HOUR", col("createdAt")), "hora"],
        [fn("COUNT", col("id")), "total"],
      ],
      where: {
        createdAt: { [Op.between]: [hoy.i, hoy.f] },
        estado: { [Op.notIn]: ["cancelado"] },
      },
      group: [literal("hora")],
      raw: true,
    });

    // ================================
    // 6️⃣ Top Productos (cantidad y valor)
    // ================================
    const topProductos = await PedidoItem.findAll({
      attributes: [
        "productoId",
        [fn("SUM", col("cantidad")), "cantidadVendida"],
        [fn("SUM", col("subtotal")), "valorTotal"],
      ],
      include: [
        {
          model: Producto,
          as: "producto",
          attributes: ["id", "nombre", "precio"],
        },
      ],
      group: ["productoId", "producto.id", "producto.nombre", "producto.precio"],
      order: [[literal("cantidadVendida"), "DESC"]],
      limit: 5,
    });

    // ================================
    // 7️⃣ Mesas activas
    // ================================
    const mesasActivasRaw = await Pedido.findAll({
      attributes: [[fn("DISTINCT", col("mesaId")), "mesaId"]],
      where: {
        createdAt: { [Op.between]: [hoy.i, hoy.f] },
        estado: { [Op.notIn]: ["cancelado"] },
        mesaId: { [Op.not]: null },
      },
      raw: true,
    });

    const mesasIds = mesasActivasRaw.map((m) => m.mesaId);

    const mesasActivas = mesasIds.length
      ? await Mesa.findAll({
          where: { id: { [Op.in]: mesasIds } },
        })
      : [];

    // ======================================================
    // REPORTE COMPLETO
    // ======================================================
    const stats = {
      resumen: {
        pedidos: { hoy: pedidosHoy, semana: pedidosSemana, mes: pedidosMes },
        ventas: { hoy: ventasHoy, semana: ventasSemana, mes: ventasMes },
        ticketPromedio,
        ratioCancelacion,
      },

      analitica: {
        pedidosPorEstado,
        pedidosPorHora,
        topProductos,
        mesasActivas,
      },
    };

    // Guardar cache
    cache = stats;
    cacheTTL = now + 20000; // 20 segundos

    return res.json({
      success: true,
      message: "Stats del dashboard generados correctamente",
      data: stats,
    });

  } catch (error) {
    logger.error("❌ Error obteniendo stats dashboard:", error);

    return res.status(500).json({
      success: false,
      message: "Error interno obteniendo estadísticas",
    });
  }
};
