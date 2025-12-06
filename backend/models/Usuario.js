// backend/models/Usuario.js
// ======================================================
// 👤 Modelo Usuario – FASTORDER (Enterprise 2026)
// ------------------------------------------------------
// Roles RBAC, hashing seguro, multi-sesión, auditoría,
// recuperación de contraseña y soporte multi-restaurante.
// ======================================================

"use strict";

import { DataTypes, Model } from "sequelize";
import bcrypt from "bcryptjs";
import { sequelize } from "../config/db.js";
import logger from "../utils/logger.js";

class Usuario extends Model {
  // ======================================================
  // 🔐 Validar contraseña (método de instancia)
  // ======================================================
  async validarPassword(passwordPlano) {
    return bcrypt.compare(passwordPlano, this.password);
  }
}

Usuario.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    // ---------------------------------------------
    // DATOS BÁSICOS
    // ---------------------------------------------
    nombre: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: { notEmpty: true },
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
      set(value) {
        this.setDataValue("email", value.toLowerCase().trim());
      },
    },

    password: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    // ---------------------------------------------
    // ROLES Y PERMISOS
    // ---------------------------------------------
    rol: {
      type: DataTypes.ENUM("admin", "staff", "owner", "superadmin"),
      defaultValue: "admin",
    },

    permisos: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },

    // ---------------------------------------------
    // ASOCIACIÓN A RESTAURANTE (multi-tienda)
    // ---------------------------------------------
    restauranteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    // ---------------------------------------------
    // CONTACTO
    // ---------------------------------------------
    telefono: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    // ---------------------------------------------
    // ESTADO DEL USUARIO
    // ---------------------------------------------
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    // ---------------------------------------------
    // AUDITORÍA Y SEGURIDAD
    // ---------------------------------------------
    ultimoLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    ipRegistro: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    ipUltimoLogin: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    passwordResetToken: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },

    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Usuario",
    tableName: "usuarios",
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",

    hooks: {
      // ======================================================
      // 🧂 Antes de crear → hash
      // ======================================================
      async beforeCreate(usuario) {
        if (usuario.password) {
          const salt = await bcrypt.genSalt(10);
          usuario.password = await bcrypt.hash(usuario.password, salt);
        }
      },

      // ======================================================
      // 🧂 Antes de actualizar → hash si cambió
      // ======================================================
      async beforeUpdate(usuario) {
        if (usuario.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          usuario.password = await bcrypt.hash(usuario.password, salt);
        }
      },

      // ======================================================
      // 📝 Logging de creación
      // ======================================================
      afterCreate(usuario) {
        logger.info(`🟢 Usuario creado: ${usuario.email}`);
      },
    },
  }
);

export default Usuario;
