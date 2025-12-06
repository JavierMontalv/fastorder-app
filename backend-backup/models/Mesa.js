// backend/models/Mesa.js
// ======================================================
// 🍽️ Modelo Mesa – FASTORDER (Enterprise 2026)
// ------------------------------------------------------
// • Número único por mesa
// • Estado POS estilo restaurante
// • Campos listos para QR dinámico
// • Sanitización y normalización automática
// ======================================================

"use strict";

import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class Mesa extends Model {}

Mesa.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    // Número identificador visible para clientes y meseros
    numero: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: { notEmpty: true },
    },

    // Nombre opcional ("Terraza 1", "VIP 2", etc.)
    nombre: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },

    // Cantidad máxima de personas
    capacidad: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 1,
    },

    // Estados POS reales
    estado: {
      type: DataTypes.ENUM("disponible", "ocupada", "reservada", "inactiva"),
      defaultValue: "disponible",
    },

    // QR dinámico (opcional)
    qrCodigo: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Mesa",
    tableName: "mesas",
    timestamps: true,

    indexes: [
      { name: "idx_mesa_numero", fields: ["numero"], unique: true },
      { name: "idx_mesa_estado", fields: ["estado"] },
    ],

    hooks: {
      // Sanitización
      beforeValidate: (mesa) => {
        if (mesa.numero) mesa.numero = String(mesa.numero).trim();
        if (mesa.nombre) mesa.nombre = mesa.nombre.trim();
      },
    },
  }
);

export default Mesa;
