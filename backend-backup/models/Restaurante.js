// backend/models/Restaurante.js
// ======================================================
// 🏪 Modelo: Restaurante – FASTORDER (Enterprise 2026)
// ------------------------------------------------------
// Configuración global del negocio, QR, branding,
// métodos de pago, horarios y opciones visuales.
// Totalmente ESM compatible.
// ======================================================

"use strict";

import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import slugify from "../utils/slugify.js";

const Restaurante = sequelize.define(
  "Restaurante",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },

    // -----------------------------------------
    // IDENTIDAD DEL RESTAURANTE
    // -----------------------------------------
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: { notEmpty: true }
    },

    slug: {
      type: DataTypes.STRING(200),
      unique: true,
      allowNull: false
    },

    descripcion: {
      type: DataTypes.STRING(500),
      allowNull: true
    },

    logoUrl: {
      type: DataTypes.STRING(300),
      allowNull: true
    },

    portadaUrl: {
      type: DataTypes.STRING(300),
      allowNull: true
    },

    telefono: {
      type: DataTypes.STRING(40),
      allowNull: true
    },

    direccion: {
      type: DataTypes.STRING(250),
      allowNull: true
    },

    // -----------------------------------------
    // URL para menú digital
    // -----------------------------------------
    urlMenuPublico: {
      type: DataTypes.STRING(300),
      allowNull: true
    },

    qrBaseUrl: {
      type: DataTypes.STRING(300),
      allowNull: true
    },

    // -----------------------------------------
    // HORARIOS
    // -----------------------------------------
    horarios: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null
    },

    horaCierreCocina: {
      type: DataTypes.STRING(10),
      allowNull: true
    },

    deliveryHabilitado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

    // -----------------------------------------
    // MÉTODOS DE PAGO
    // -----------------------------------------
    metodosPago: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: { efectivo: true }
    },

    aceptaPropinas: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    propinaSugerida: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0
    },

    // -----------------------------------------
    // TEMA / ESTILO
    // -----------------------------------------
    colorPrimario: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: "#FF4C29"
    },

    colorSecundario: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: "#1F1F1F"
    },

    tema: {
      type: DataTypes.ENUM("light", "dark", "auto"),
      defaultValue: "light"
    },

    // -----------------------------------------
    // OPCIONES DEL MENÚ DIGITAL
    // -----------------------------------------
    mostrarPrecios: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

    mostrarCategoriasVacias: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    idiomaMenu: {
      type: DataTypes.STRING(10),
      defaultValue: "es"
    },

    // -----------------------------------------
    // ESTADO GENERAL
    // -----------------------------------------
    estado: {
      type: DataTypes.ENUM("abierto", "cerrado"),
      defaultValue: "abierto"
    }
  },
  {
    tableName: "restaurantes",
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",

    hooks: {
      beforeCreate: (rest) => {
        rest.slug = slugify(rest.nombre);
      },
      beforeUpdate: (rest) => {
        if (rest.changed("nombre")) {
          rest.slug = slugify(rest.nombre);
        }
      }
    }
  }
);

export default Restaurante;
