// backend/sockets/pedidosSocket.js
// ======================================================
// 🔌 WebSocket: Pedidos en Tiempo Real – FASTORDER (2026)
// ------------------------------------------------------
// Sistema profesional estilo Rappi / UberEats:
//  ✓ Cocina en tiempo real
//  ✓ Panel admin actualizado automáticamente
//  ✓ Meseros con cambios instantáneos
//  ✓ Rooms por restaurante / cocina / mesa
// ======================================================

"use strict";

import Mesa from "../models/Mesa.js";
import Pedido from "../models/Pedido.js";
import PedidoItem from "../models/PedidoItem.js";
import logger from "../utils/logger.js";

// ======================================================
// 🔧 Helper para cargar pedido con relaciones
// ======================================================
async function cargarPedidoCompleto(id) {
  return await Pedido.findByPk(id, {
    include: [
      { model: PedidoItem, as: "items", include: ["producto"] },
      { model: Mesa, as: "mesa" },
    ],
  });
}

// ======================================================
// ⚡ Configuración principal de WebSockets
// ======================================================
export function configurarSocketsPedidos(io) {
  logger.info("⚡ Canal WebSocket de pedidos iniciado");

  io.on("connection", (socket) => {
    logger.info(`🟢 Cliente conectado → ${socket.id}`);

    // ROOMS
    socket.join("cocina");
    socket.join("admin");

    socket.on("unirse:mesa", (mesaId) => {
      socket.join(`mesa_${mesaId}`);
      logger.info(`🪑 Cliente ${socket.id} unido a mesa_${mesaId}`);
    });

    // ======================================================
    // 🆕 NUEVO PEDIDO
    // ======================================================
    socket.on("pedido:nuevo", async (pedidoId, ack) => {
      try {
        logger.info(`🆕 Evento pedido:nuevo → ${pedidoId}`);

        const pedido = await cargarPedidoCompleto(pedidoId);
        if (!pedido) return ack?.({ ok: false, message: "Pedido no existe" });

        io.to("cocina").emit("pedido:nuevo", pedido);
        io.to("admin").emit("pedido:nuevo", pedido);

        if (pedido.mesaId) {
          io.to(`mesa_${pedido.mesaId}`).emit("pedido:nuevo", pedido);
        }

        ack?.({ ok: true });
      } catch (error) {
        logger.error("❌ Error en pedido:nuevo:", error);
        ack?.({ ok: false, message: "Error interno" });
      }
    });

    // ======================================================
    // ♻️ CAMBIO DE ESTADO
    // ======================================================
    socket.on("pedido:cambiarEstado", async ({ pedidoId, estado }, ack) => {
      try {
        logger.info(`♻️ pedido:cambiarEstado → ${pedidoId} → ${estado}`);

        const pedido = await cargarPedidoCompleto(pedidoId);
        if (!pedido) return ack?.({ ok: false, message: "Pedido no existe" });

        io.to("cocina").emit("pedido:actualizado", { pedidoId, estado, pedido });
        io.to("admin").emit("pedido:actualizado", { pedidoId, estado, pedido });

        if (pedido.mesaId) {
          io.to(`mesa_${pedido.mesaId}`).emit("pedido:actualizado", {
            pedidoId,
            estado,
            pedido,
          });
        }

        ack?.({ ok: true });
      } catch (error) {
        logger.error("❌ Error en pedido:cambiarEstado:", error);
        ack?.({ ok: false, message: "Error interno" });
      }
    });

    // ======================================================
    // ❌ ELIMINAR PEDIDO
    // ======================================================
    socket.on("pedido:eliminar", async (pedidoId, ack) => {
      try {
        logger.warn(`🗑️ pedido:eliminar → ${pedidoId}`);

        const pedido = await cargarPedidoCompleto(pedidoId);
        if (!pedido) return ack?.({ ok: false, message: "Pedido no existe" });

        io.to("cocina").emit("pedido:eliminado", pedidoId);
        io.to("admin").emit("pedido:eliminado", pedidoId);

        if (pedido.mesaId) {
          io.to(`mesa_${pedido.mesaId}`).emit("pedido:eliminado", pedidoId);
        }

        ack?.({ ok: true });
      } catch (error) {
        logger.error("❌ Error en pedido:eliminar:", error);
        ack?.({ ok: false, message: "Error interno" });
      }
    });

    // ======================================================
    // 🔴 DESCONEXIÓN
    // ======================================================
    socket.on("disconnect", () => {
      logger.info(`🔴 Cliente desconectado: ${socket.id}`);
    });
  });
}
