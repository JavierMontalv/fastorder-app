// backend/models/Categoria.js
// ======================================================
// 🗂️ Modelo Categoría – FASTORDER (Enterprise 2026)
// ======================================================

"use strict";

import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";
import slugify from "../utils/slugify.js";

class Categoria extends Model {}

Categoria.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    nombre: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: { notEmpty: true },
    },

    slug: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
    },

    descripcion: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    icono: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },

    estado: {
      type: DataTypes.ENUM("activo", "inactivo"),
      defaultValue: "activo",
    },
  },
  {
    sequelize,
    modelName: "Categoria",
    tableName: "categorias",
    timestamps: true,

    indexes: [
      { name: "idx_categoria_slug", fields: ["slug"] },
      { name: "idx_categoria_estado", fields: ["estado"] },
    ],

    hooks: {
      beforeValidate: (categoria) => {
        if (categoria.nombre) categoria.nombre = categoria.nombre.trim();
        if (categoria.descripcion) categoria.descripcion = categoria.descripcion.trim();
        if (categoria.icono) categoria.icono = categoria.icono.trim();
      },

      beforeCreate: (categoria) => {
        categoria.slug = slugify(categoria.nombre);
      },

      beforeUpdate: (categoria) => {
        if (categoria.changed("nombre")) {
          categoria.slug = slugify(categoria.nombre);
        }
      },
    },
  }
);

// 👈 ESTA LÍNEA ES LA CORRECTA PARA ESM
export default Categoria;
