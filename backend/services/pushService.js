// backend/services/pushService.js
// ======================================================
// 📲 Servicio de Notificaciones Push – FASTORDER (UTF-8)
// ------------------------------------------------------
// Nivel enterprise: Uber Eats / Rappi / Shopify.
// Soporta WebPush y puede ampliarse a Firebase.
// ======================================================

"use strict";

const webpush = require("web-push");
const logger = require("../utils/logger");

// ======================================================
// 🔐 Configuración VAPID
// ------------------------------------------------------
webpush.setVapidDetails(
  "mailto:admin@fastorder.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ======================================================
// 📩 Enviar notificación a un suscriptor
// ======================================================
async function enviarPush(suscripcion, payload) {
  try {
    await webpush.sendNotification(
      suscripcion,
      JSON.stringify(payload),
      { TTL: 20 }
    );

    return { ok: true };
  } catch (error) {
    logger.error("❌ Error al enviar push:", error.message);
    return { ok: false, error: error.message };
  }
}

// ======================================================
// 👨‍🍳 Notificar a cocina que hay un nuevo pedido
// ======================================================
async function notificarCocina(pedidoId) {
  const payload = {
    title: "Nuevo Pedido 🛎️",
    body: `Pedido #${pedidoId} recibido`,
    data: { pedidoId }
  };

  // TODO: obtener suscripciones desde BD
  return payload;
}

// ======================================================
// 🚚 Notificar estado del pedido al cliente
// ======================================================
async function notificarCambioEstado(pedidoId, estado, suscripcion) {
  const payload = {
    title: "Actualización del pedido 📦",
    body: `Tu pedido #${pedidoId} ahora está: ${estado}`,
    data: { pedidoId, estado }
  };

  return enviarPush(suscripcion, payload);
}

// ======================================================
// 📦 Exportación
// ======================================================
module.exports = {
  enviarPush,
  notificarCocina,
  notificarCambioEstado
};
