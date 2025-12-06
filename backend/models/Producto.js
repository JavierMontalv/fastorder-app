// backend/models/Producto.js
// ======================================================
// 🛒 Modelo: Producto – FASTORDER (Enterprise 2026)
// ------------------------------------------------------
// Compatible con:
//  ✓ Inventario estilo Shopify
//  ✓ Menú restaurante tipo Rappi/UberEats
//  ✓ POS para meseros/caja
//  ✓ QR dinámico
//  ✓ Stats avanzados
// ======================================================

"use strict";

import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";
import Categoria from "./Categoria.js";

// Generar SKU profesional
const generarSKU = () =>
  `SKU-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 9999)}`;

class Producto extends Model {}

Producto.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    nombre: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: { notEmpty: true, len: [2, 120] },
    },

    sku: {
      type: DataTypes.STRING(40),
      unique: true,
      allowNull: false,
      defaultValue: generarSKU,
    },

    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0.01 },
    },

    costo: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    stock: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },

    controlarStock: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    stockMinimo: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },

    alertaStockBajo: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    descripcion: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    imagenUrl: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },

    estado: {
      type: DataTypes.ENUM("activo", "inactivo", "agotado"),
      defaultValue: "activo",
    },

    preparacionMinutos: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      validate: { min: 1 },
    },

    destacado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    visibleEnMenu: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    visibleEnPOS: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "Producto",
    tableName: "productos",
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",
  }
);

// ======================================================
// Relaciones
// ======================================================
Producto.belongsTo(Categoria, {
  foreignKey: "categoriaId",
  as: "categoria",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Categoria.hasMany(Producto, {
  foreignKey: "categoriaId",
  as: "productos",
});

// ======================================================
// Hook para activar alerta de stock bajo
// ======================================================
Producto.addHook("afterUpdate", (producto) => {
  if (producto.controlarStock) {
    producto.alertaStockBajo = producto.stock <= producto.stockMinimo;
  }
});

// ======================================================
// Exportación ESM
// ======================================================
export default Producto;
