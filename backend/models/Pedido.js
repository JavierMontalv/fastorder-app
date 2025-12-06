// backend/models/Pedido.js
// ======================================================
// 🧾 Modelo: Pedido – FASTORDER (Enterprise 2026)
// ------------------------------------------------------
// Estilo Rappi / Shopify POS:
// • Estados POS de cocina
// • Origen del pedido (mesa, qr, domicilio, mostrador)
// • Método de pago y tracking de tiempos
// • Sanitización de notas
// ======================================================

"use strict";

import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";
import Usuario from "./Usuario.js";
import Mesa from "./Mesa.js";

class Pedido extends Model {}

Pedido.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    // Total a pagar
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },

    // Estados POS completos
    estado: {
      type: DataTypes.ENUM(
        "pendiente",
        "aceptado",
        "preparacion",
        "listo",
        "entregado",
        "cancelado"
      ),
      defaultValue: "pendiente",
    },

    // Nota del cliente o mesero
    nota: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },

    // De dónde vino el pedido
    origenPedido: {
      type: DataTypes.ENUM("mesa", "qr", "mostrador", "domicilio"),
      defaultValue: "mesa",
    },

    // Método de pago
    metodoPago: {
      type: DataTypes.ENUM(
        "efectivo",
        "nequi",
        "daviplata",
        "tarjeta",
        "transferencia",
        "sin_pago"
      ),
      defaultValue: "sin_pago",
    },

    pagado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // Tiempos de estado (muy útil para dashboard)
    fechaAceptado: { type: DataTypes.DATE, allowNull: true },
    fechaPreparacion: { type: DataTypes.DATE, allowNull: true },
    fechaListo: { type: DataTypes.DATE, allowNull: true },
    fechaEntregado: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: "Pedido",
    tableName: "pedidos",
    timestamps: true,

    hooks: {
      // Sanitización de nota
      beforeSave: (pedido) => {
        if (pedido.nota) {
          pedido.nota = pedido.nota.replace(/<[^>]+>/g, "").trim();
        }
      },
    },

    indexes: [
      { fields: ["estado"] },
      { fields: ["mesaId"] },
      { fields: ["origenPedido"] },
      { fields: ["metodoPago"] },
    ],
  }
);

// ======================================================
// Relaciones
// ======================================================

// Usuario que creó el pedido
Pedido.belongsTo(Usuario, {
  foreignKey: "usuarioId",
  as: "usuario",
});

// Pedido asociado a una mesa
Pedido.belongsTo(Mesa, {
  foreignKey: "mesaId",
  as: "mesa",
});

export default Pedido;
