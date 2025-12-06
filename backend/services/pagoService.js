// backend/services/pagoService.js
// ======================================================
// 💳 Servicio de Pagos – FASTORDER (UTF-8)
// ------------------------------------------------------
// Compatible con:
//  ✓ MercadoPago
//  ✓ Wompi
//  ✓ Stripe
//  ✓ Nequi / Daviplata (QR y API futuro)
//  ✓ Webhook para confirmar estado
//
// Arquitectura enterprise tipo Shopify Payment Gateway.
// ======================================================

"use strict";

const axios = require("axios");
const logger = require("../utils/logger");

// ======================================================
// 🔧 Selección dinámica del proveedor de pagos
// ======================================================
function getProvider() {
  return process.env.PAYMENT_PROVIDER || "wompi"; // wompi | mp | stripe | nequi
}

// ======================================================
// 🔗 Crear link de pago (checkout)
// ------------------------------------------------------
// Devuelve un link que el cliente puede abrir para pagar.
// ======================================================
async function crearPago({ monto, moneda = "COP", descripcion, referencia }) {
  const provider = getProvider();

  try {
    switch (provider) {
      // -------------------------------------------------
      // WOMPI
      // -------------------------------------------------
      case "wompi": {
        const resp = await axios.post(
          "https://production.wompi.co/v1/transactions",
          {
            amount_in_cents: Math.round(monto * 100),
            currency: moneda,
            customer_email: "cliente@correo.com",
            reference: referencia,
            payment_method: {
              type: "CARD"
            }
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`
            }
          }
        );

        return {
          provider,
          checkoutUrl: resp.data?.data?.payment_method?.extra?.async_payment_url,
          raw: resp.data
        };
      }

      // -------------------------------------------------
      // MERCADOPAGO
      // -------------------------------------------------
      case "mp": {
        const resp = await axios.post(
          "https://api.mercadopago.com/checkout/preferences",
          {
            items: [
              {
                title: descripcion,
                currency_id: moneda,
                unit_price: monto,
                quantity: 1
              }
            ],
            back_urls: {
              success: process.env.FRONTEND_URL + "/pago/success",
              failure: process.env.FRONTEND_URL + "/pago/failure"
            }
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
            }
          }
        );

        return {
          provider,
          checkoutUrl: resp.data.init_point,
          raw: resp.data
        };
      }

      // -------------------------------------------------
      // STRIPE
      // -------------------------------------------------
      case "stripe": {
        const resp = await axios.post(
          "https://api.stripe.com/v1/checkout/sessions",
          new URLSearchParams({
            payment_method_types: "card",
            line_items: JSON.stringify([
              {
                price_data: {
                  currency: moneda.toLowerCase(),
                  product_data: { name: descripcion },
                  unit_amount: monto * 100
                },
                quantity: 1
              }
            ]),
            mode: "payment",
            success_url: process.env.FRONTEND_URL + "/pago/success",
            cancel_url: process.env.FRONTEND_URL + "/pago/failure"
          }),
          {
            headers: {
              Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
              "Content-Type": "application/x-www-form-urlencoded"
            }
          }
        );

        return {
          provider,
          checkoutUrl: resp.data.url,
          raw: resp.data
        };
      }

      // -------------------------------------------------
      // NEQUI / DAVIPLATA (QR futuro)
      // -------------------------------------------------
      case "nequi":
      case "daviplata":
        return {
          provider,
          message: "Integración QR para Nequi/Daviplata pendiente",
          qrUrl: null
        };

      default:
        throw new Error("Proveedor de pagos no soportado");
    }
  } catch (error) {
    logger.error("❌ Error creando pago:", error.response?.data || error.message);
    throw new Error("No se pudo generar el pago");
  }
}

// ======================================================
// 🔍 Confirmar estado de pago desde Webhook
// ======================================================
async function procesarWebhookPago(data) {
  logger.info("📥 Webhook recibido:", data);

  // Aquí lógica de verificación según proveedor
  // Actualizar pedido, estado o inventario

  return { ok: true };
}

// ======================================================
// 📦 Exportación
// ======================================================
module.exports = {
  crearPago,
  procesarWebhookPago
};
