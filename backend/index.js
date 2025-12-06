// backend/index.js
// ======================================================
// 🚀 FastOrder Backend – Entry Point (Enterprise 2026)
// ------------------------------------------------------
// Express + Sequelize (AWS RDS) + Socket.IO tiempo real
// Seguridad nivel Stripe, arquitectura Shopify, rendimiento
// Rappi Aliado PRO.
// ======================================================

"use strict";

import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import xss from "xss-clean";
import hpp from "hpp";
import { Server as SocketServer } from "socket.io";

import { sequelize } from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import logger from "./utils/logger.js";

// 🔌 Socket handlers
import { configurarSocketsPedidos } from "./sockets/pedidosSocket.js";

// 🌱 Variables de entorno
dotenv.config();

console.log("------------ VARIABLES .ENV -------------");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS:", process.env.DB_PASS ? "(oculta)" : "NO LEÍDA");
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("NODE_ENV:", process.env.NODE_ENV || "development");
console.log("PORT:", process.env.PORT || 4000);
console.log("----------------------------------------");

// ======================================================
// 🔥 Conexión a AWS RDS (Sequelize)
// ======================================================
const conectarDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("🟢 Conexión a RDS (MariaDB) exitosa");

    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync({ alter: true });
      console.log("🧩 Modelos sincronizados automáticamente (DEV MODE)");
    }
  } catch (error) {
    console.error("🔴 Error conectando a RDS:", error);
    process.exit(1);
  }
};

await conectarDB();

// ======================================================
// ⚙️ Configuración del servidor Express (Enterprise)
// ======================================================
const app = express();

// ----------------------------------
// 🚀 Middlewares de rendimiento
// ----------------------------------
app.use(compression()); // optimiza respuestas ↓40%
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ----------------------------------
// 🛡 Seguridad nivel Shopify
// ----------------------------------
app.use(xss()); // evita scripts maliciosos
app.use(hpp()); // evita parámetros duplicados peligrosos

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// ----------------------------------
// 🌍 CORS PRO
// ----------------------------------
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);

// ----------------------------------
// ⛔ Rate Limit – Anti DDoS / Anti Fuerza Bruta
// ----------------------------------
app.use(
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: "Demasiadas solicitudes, intente nuevamente" },
  })
);

// ----------------------------------
// 📝 Logs PRO
// ----------------------------------
app.use(
  morgan("combined", {
    skip: () => process.env.NODE_ENV === "test",
  })
);

// ======================================================
// 🛣️ Importación de rutas enterprise
// ======================================================

// Auth / Usuarios
import authRoutes from "./routes/authRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";

// Core de negocio
import restauranteRoutes from "./routes/restauranteRoutes.js";
import mesaRoutes from "./routes/mesaRoutes.js";
import categoriaRoutes from "./routes/categoriaRoutes.js";
import productoRoutes from "./routes/productoRoutes.js";
import platoRoutes from "./routes/platoRoutes.js";
import pedidoRoutes from "./routes/pedidoRoutes.js";

// Extra: QR + Estadísticas
import qrRoutes from "./routes/qrRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";

// ======================================================
// 🛣️ Registro de rutas
// ======================================================

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/restaurante", restauranteRoutes);
app.use("/api/mesas", mesaRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/platos", platoRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/stats", statsRoutes);

// Healthcheck
app.get("/api/status", (req, res) => {
  res.json({
    ok: true,
    mensaje: "Servidor FastOrder funcionando 🚀",
    version: "2026-enterprise",
    timestamp: new Date().toISOString(),
    ip: req.ip,
  });
});

// ======================================================
// 🧨 Middleware de errores global
// ======================================================
app.use(errorHandler);

// ======================================================
// 🔌 HTTP + Socket.IO tiempo real
// ======================================================
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
  },
});

// Inicializar sockets
configurarSocketsPedidos(io);
logger.info("📡 Sockets de pedidos inicializados");

// Guardarlo global para usar desde controladores
global.io = io;

// ======================================================
// 🚀 Iniciar servidor
// ======================================================
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`🚀 FASTORDER Backend corriendo en puerto ${PORT} (Enterprise Mode)`);
});
