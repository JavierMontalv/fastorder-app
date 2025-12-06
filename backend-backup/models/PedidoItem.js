// backend/models/PedidoItem.js
// ======================================================
// 🧾 Modelo: PedidoItem – FASTORDER (Enterprise 2026)
// ------------------------------------------------------
// Snapshot completo del ítem del pedido:
//  • precioUnitario (congelado)
//  • nombreProducto (congelado)
//  • subtotal autocalculado
//  • índices para máximo rendimiento
// ======================================================

"use strict";

import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";
import Producto from "./Producto.js";
import Pedido from "./Pedido.js";

class PedidoItem extends Model {}

PedidoItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    cantidad: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: { min: 1 },
    },

    precioUnitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    nombreProducto: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "PedidoItem",
    tableName: "pedido_items",
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",

    hooks: {
      // Calcula subtotal automáticamente
      beforeValidate: (item) => {
        if (item.precioUnitario && item.cantidad) {
          item.subtotal = (item.precioUnitario * item.cantidad).toFixed(2);
        }
      },

      // Congela snapshot del producto
      beforeCreate: async (item) => {
        if (!item.productoId) return;

        const producto = await Producto.findByPk(item.productoId);
        if (producto) {
          item.precioUnitario = producto.precio;
          item.nombreProducto = producto.nombre;
          item.subtotal = (producto.precio * item.cantidad).toFixed(2);
        }
      },
    },

    indexes: [
      { fields: ["pedidoId"] },
      { fields: ["productoId"] },
    ],
  }
);

// ======================================================
// Relaciones
// ======================================================

PedidoItem.belongsTo(Pedido, {
  foreignKey: "pedidoId",
  as: "pedido",
  onDelete: "CASCADE",
});

PedidoItem.belongsTo(Producto, {
  foreignKey: "productoId",
  as: "producto",
  onDelete: "SET NULL",
});

Pedido.hasMany(PedidoItem, {
  foreignKey: "pedidoId",
  as: "items",
  onDelete: "CASCADE",
});

// ======================================================
// Exportación ESM (obligatoria para tu proyecto)
// ======================================================
export default PedidoItem;
