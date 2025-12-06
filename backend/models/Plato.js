// backend/models/Plato.js
// ======================================================
// 🍽️ Modelo: Plato – FASTORDER (Enterprise 2026)
// ------------------------------------------------------
// Alias avanzado de Producto para el módulo de restaurante.
// Permite extender comportamientos solo de platos sin duplicar
// estructura de Producto.
// ======================================================

"use strict";

import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import Producto from "./Producto.js";

// ------------------------------------------------------
// 🧠 Plato hereda estructura de Producto (1:1 mapping)
// ------------------------------------------------------
const Plato = sequelize.define(
  "Plato",
  {
    // 🔗 Mantiene el ID del producto
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: false, // no usar autoincrement
      references: {
        model: Producto,
        key: "id",
      },
    },

    // 🔥 Campo opcional EXTENSIÓN exclusiva para platos
    tiempoPreparacion: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true, // minutos
      comment: "Tiempo de preparación del plato",
    },

    visibleEnMenu: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    alergenos: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "Ej: gluten, lactosa, frutos secos",
    },
  },
  {
    tableName: "platos",
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",
  }
);

// ------------------------------------------------------
// 📎 Relación 1:1 con Producto
// ------------------------------------------------------
Plato.belongsTo(Producto, {
  foreignKey: "id",
  as: "producto",
  onDelete: "CASCADE",
});

Producto.hasOne(Plato, {
  foreignKey: "id",
  as: "plato",
  onDelete: "CASCADE",
});

export default Plato;
