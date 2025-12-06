// backend/services/iaService.js
// ======================================================
// 🤖 Servicio de Inteligencia Artificial – FASTORDER (UTF-8)
// ------------------------------------------------------
// Nivel enterprise: Rappi / Shopify / UberEats.
// Permite:
//  ✓ Generar descripciones de productos
//  ✓ Traducir menú automáticamente
//  ✓ Sugerir categorías inteligentes
//  ✓ Optimizar precios según demanda (futuro)
//  ✓ Resumir pedidos o notas especiales
// ======================================================

"use strict";

const axios = require("axios");

// ======================================================
// 🔐 KEY DE IA (OpenAI o cualquier proveedor compatible)
// ======================================================
const IA_API_KEY = process.env.IA_API_KEY;
const IA_API_URL = process.env.IA_API_URL || "https://api.openai.com/v1/chat/completions";

// Seguridad
if (!IA_API_KEY) {
  console.warn("⚠️ ADVERTENCIA: IA_API_KEY no está configurada en el .env");
}

// ======================================================
// 🔧 Cliente Genérico IA
// ------------------------------------------------------
// Función base para enviar prompts a OpenAI o proveedor.
// ======================================================
async function enviarPrompt(prompt, options = {}) {
  try {
    const response = await axios.post(
      IA_API_URL,
      {
        model: options.model || "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: options.temperature ?? 0.6,
        max_tokens: options.max_tokens ?? 300
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${IA_API_KEY}`
        }
      }
    );

    return response.data.choices[0].message.content;

  } catch (error) {
    console.error("❌ Error en enviarPrompt:", error.response?.data || error.message);
    throw new Error("Error consultando el servicio de IA");
  }
}

// ======================================================
// 📝 Generar descripción automática de producto
// ------------------------------------------------------
// Ejemplo: “Pizza hawaiana” → descripción rica para el menú.
// ======================================================
async function generarDescripcionProducto(nombre, categoria) {
  const prompt = `
Eres un redactor gastronómico profesional.
Genera una descripción atractiva y breve (máx 30 palabras) para el producto:

Nombre: ${nombre}
Categoría: ${categoria || "general"}

Debe ser clara, vendedora y amigable para un menú digital.
`;
  return await enviarPrompt(prompt);
}

// ======================================================
// 🌎 Traducir textos del menú
// ------------------------------------------------------
// Soporta: es → en, es → fr, es → pt, etc.
// ======================================================
async function traducirTexto(texto, idiomaDestino = "en") {
  const prompt = `
Traduce el siguiente texto al idioma "${idiomaDestino}":
"${texto}"
Respeta el estilo, tono y contexto gastronómico.
`;
  return await enviarPrompt(prompt);
}

// ======================================================
// 🧠 Categoría sugerida automáticamente
// ------------------------------------------------------
// Basado en el nombre del producto.
// ======================================================
async function sugerirCategoria(nombreProducto) {
  const prompt = `
A partir del siguiente nombre de producto:
"${nombreProducto}"

Sugiere la categoría más adecuada.
Responde solamente con el nombre de la categoría.
Ejemplos: "Bebidas", "Postres", "Hamburguesas", "Snacks", "Carnes".
`;
  return await enviarPrompt(prompt, { temperature: 0.3 });
}

// ======================================================
// 💲 Sugerencia de precio (futuro avanzado)
// ------------------------------------------------------
// Basado en categoría, ingredientes, tendencia y tamaño.
// ======================================================
async function sugerirPrecio(nombre, categoria, descripcion) {
  const prompt = `
Sugiere un precio aproximado en pesos colombianos para este producto:

Nombre: ${nombre}
Categoría: ${categoria}
Descripción: ${descripcion}

Responde SOLO con un número entero, sin símbolo de moneda.
`;
  return await enviarPrompt(prompt, { temperature: 0.4 });
}

// ======================================================
// 📦 EXPORTACIÓN
// ======================================================
module.exports = {
  enviarPrompt,
  generarDescripcionProducto,
  traducirTexto,
  sugerirCategoria,
  sugerirPrecio
};
