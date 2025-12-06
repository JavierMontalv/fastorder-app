// backend/services/restauranteStats.js
// ======================================================
// 📊 Servicio de Estadísticas – FASTORDER (UTF-8)
// ------------------------------------------------------
// KPIs para dashboard del restaurante:
//  ✓ Total pedidos
//  ✓ Ventas del día
//  ✓ Top productos
//  ✓ Horas pico
//  ✓ Pedidos recientes
//
// Optimizado para MariaDB + Sequelize.
// ======================================================

"use strict";

const { Op, fn, col, literal } = require("sequelize");
const Pedido = require("../models/Pedido");
const PedidoItem = require("../models/PedidoItem");
const Producto = require("../models/Producto");

// ======================================================
// 🧮 Pedidos y ventas del día
// ======================================================
async function obtenerResumenDiario(restauranteId) {
  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);

  const pedidosHoy = await Pedido.findAll({
    where: {
      restauranteId,
      createdAt: { [Op.gte]: inicioDia }
    }
  });

  const totalPedidos = pedidosHoy.length;
  const totalVentas = pedidosHoy.reduce((sum, p) => sum + Number(p.total), 0);

  return {
    totalPedidos,
    totalVentas
  };
}

// ======================================================
// ⭐ Productos más vendidos (top 5)
// ======================================================
async function obtenerTopProductos(restauranteId) {
  const resultados = await PedidoItem.findAll({
    attributes: [
      "productoId",
      [fn("SUM", col("cantidad")), "totalVendidos"]
    ],
    include: [
      {
        model: Producto,
        as: "producto",
        attributes: ["nombre", "precio", "categoriaId"],
        where: { restauranteId }
      }
    ],
    group: ["productoId"],
    order: [[literal("totalVendidos"), "DESC"]],
    limit: 5
  });

  return resultados;
}

// ======================================================
// 🕒 Horas pico del día
// ======================================================
async function obtenerHorasPico(restauranteId) {
  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);

  const resultados = await Pedido.findAll({
    where: {
      restauranteId,
      createdAt: { [Op.gte]: inicioDia }
    },
    attributes: [
      [fn("HOUR", col("createdAt")), "hora"],
      [fn("COUNT", "*"), "cantidad"]
    ],
    group: ["hora"],
    order: [[literal("cantidad"), "DESC"]],
    limit: 4
  });

  return resultados;
}

// ======================================================
// 🧾 Últimos pedidos realizados
// ======================================================
async function obtenerPedidosRecientes(restauranteId) {
  return await Pedido.findAll({
    where: { restauranteId },
    order: [["createdAt", "DESC"]],
    limit: 10
  });
}

// ======================================================
// 📦 Exportación
// ======================================================
module.exports = {
  obtenerResumenDiario,
  obtenerTopProductos,
  obtenerHorasPico,
  obtenerPedidosRecientes
};
