// backend/app.js
// ======================================================
// 🚀 FASTORDER – Servidor Principal (Enterprise 2026)
// ------------------------------------------------------
// Arquitectura tipo Shopify / Stripe / Rappi Aliado PRO.
// Seguridad avanzada, observabilidad, escalabilidad.
// Express + Sequelize + AWS RDS + Middlewares Enterprise.
// ======================================================

"use strict";

import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import compression from "compression";
import xss from "xss-clean";
import hpp from "hpp";

import { sequelize } from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";

// === Rutas ===
import authRoutes from "./routes/authRoutes.js";
import categoriaRoutes from "./routes/categoriaRoutes.js";
import productoRoutes from "./routes/productoRoutes.js";
import pedidoRoutes from "./routes/pedidoRoutes.js";
import restauranteRoutes from "./routes/restauranteRoutes.js";
import mesaRoutes from "./routes/mesaRoutes.js";

// ======================================================
// 🌱 Variables de entorno
// ======================================================
dotenv.config();

console.log("======================================");
console.log("      FASTORDER – ENTORNO INICIAL      ");
console.log("--------------------------------------");
console.log(" DB:", process.env.DB_NAME);
console.log(" ENV:", process.env.NODE_ENV || "development");
console.log(" CORS:", process.env.FRONTEND_URL || "Todos (*)");
console.log(" Puerto:", process.env.PORT || 4000);
console.log("======================================");

// ======================================================
// 🔥 Conexión a BD (Sequelize + AWS RDS)
// ======================================================
const conectarDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("🟢 Conexión a RDS establecida con éxito");

    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync({ alter: true });
      console.log("🧩 Modelos sincronizados (DEV MODE)");
    }
  } catch (error) {
    console.error("🔴 Error conectando a la base de datos:", error);
    process.exit(1);
  }
};

await conectarDB();

// ======================================================
// ⚙️ Configurar servidor Express
// ======================================================
const app = express();

// ------------------------------------------------------
// 📦 Compresión de respuestas (acelera 40%)
// ------------------------------------------------------
app.use(compression());

// ------------------------------------------------------
// 🧼 Protección Anti XSS (inyección de scripts)
// ------------------------------------------------------
app.use(xss());

// ------------------------------------------------------
// 🛡️ Protección contra parámetros duplicados (HPP)
// ------------------------------------------------------
app.use(hpp());

// ------------------------------------------------------
// 📥 Limitador de tamaño de JSON
// ------------------------------------------------------
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// ------------------------------------------------------
// 🛡️ Seguridad tipo Shopify / Stripe
// ------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false
  })
);

// ------------------------------------------------------
// 🌍 CORS PRO – listo para producción
// ------------------------------------------------------
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// ------------------------------------------------------
// ⛔ Rate Limit – Anti DDoS / Anti Fuerza Bruta
// ------------------------------------------------------
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 250, // mejor nivel PRO
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: "Demasiadas solicitudes, intente luego" }
  })
);

// ------------------------------------------------------
// 📝 Logs elegantes + IP del cliente
// ------------------------------------------------------
app.use(
  morgan("combined", {
    skip: () => process.env.NODE_ENV === "test"
  })
);

// ======================================================
// 🛣️ RUTAS PRINCIPALES FASTORDER
// ======================================================
app.get("/api/status", (req, res) => {
  res.json({
    ok: true,
    mensaje: "FASTORDER API online 🚀",
    timestamp: new Date().toISOString(),
    ip: req.ip,
    version: "2026-enterprise"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/restaurante", restauranteRoutes);
app.use("/api/mesas", mesaRoutes);

// ======================================================
// 🧨 Manejo Global de Errores
// ======================================================
app.use(errorHandler);

// ======================================================
// 🚀 Iniciar Servidor
// ======================================================
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 FASTORDER Backend corriendo en puerto ${PORT}`);
});

export default app;
