// backend/config/db.js
// ======================================================
// ⚙️ Sequelize + MariaDB AWS RDS – FASTORDER Enterprise 2026
// ======================================================

"use strict";

// 🟢 Cargar variables de entorno AQUÍ también
import dotenv from "dotenv";
dotenv.config();

import { Sequelize } from "sequelize";

// ======================================================
// 🔍 LOG DE CONFIG INICIAL
// ======================================================
console.log("====================================================");
console.log(" 🔌 Inicializando conexión con AWS RDS (MariaDB)...");
console.log(" DB_HOST:", process.env.DB_HOST);
console.log(" DB_USER:", process.env.DB_USER);
console.log(" DB_NAME:", process.env.DB_NAME);
console.log(" DB_PORT:", process.env.DB_PORT);
console.log(" NODE_ENV:", process.env.NODE_ENV || "development");
console.log("====================================================");

// ======================================================
// 🧠 CONFIGURACIÓN PRINCIPAL SEQUELIZE
// ======================================================
export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mariadb",

    logging: process.env.NODE_ENV === "development" ? console.log : false,

    pool: {
      max: 15,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },

    dialectOptions: {
      connectTimeout: 20000,
      supportBigNumbers: true,
      bigNumberStrings: true,
      ssl:
        process.env.DB_SSL === "true"
          ? { require: true, rejectUnauthorized: false }
          : false,
    },

    timezone: "-05:00",

    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
      timestamps: true,
    },
  }
);

// ======================================================
// 🔄 RECONEXIÓN AUTOMÁTICA
// ======================================================
export const probarConexionDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("🟢 Conexión establecida correctamente con AWS RDS");
  } catch (error) {
    console.error("🔴 Error conectando a la base de datos:", error.message);
    console.log("Reintentando en 5 segundos…");

    setTimeout(() => probarConexionDB(), 5000);
  }
};
