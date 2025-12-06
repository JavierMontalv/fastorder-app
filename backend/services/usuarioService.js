// ======================================================
// 👤 usuarioService.js – FASTORDER Enterprise 2026
// ------------------------------------------------------
// Servicios profesionales de usuarios:
//  • Búsqueda por email / ID
//  • Creación segura con hash
//  • Actualización idempotente
//  • Cambio de contraseña
//  • Desactivación (soft delete)
//  • Limpieza de datos sensibles
// ======================================================

import Usuario from "../models/Usuario.js";
import bcrypt from "bcryptjs";

// ======================================================
// 🧹 Helper para limpiar datos al devolverlos
// ======================================================
const limpiar = (usuario) => {
  const data = usuario.toJSON();
  delete data.password;
  return data;
};

// ======================================================
// 🔍 Buscar por email
// ======================================================
export async function buscarPorEmail(email) {
  const usuario = await Usuario.findOne({ where: { email } });
  return usuario;
}

// ======================================================
// 🔍 Buscar por ID
// ======================================================
export async function buscarPorId(id) {
  return await Usuario.findByPk(id);
}

// ======================================================
// 🔑 Comparar passwords
// ======================================================
export async function compararPassword(passwordPlano, hash) {
  return await bcrypt.compare(passwordPlano, hash);
}

// ======================================================
// ➕ Crear usuario
// ======================================================
export async function crearUsuario(data) {
  const hash = await bcrypt.hash(data.password, 10);

  const usuario = await Usuario.create({
    ...data,
    password: hash,
    estado: "activo",
  });

  return limpiar(usuario);
}

// ======================================================
// ✏️ Actualizar usuario
// ======================================================
export async function actualizarUsuarioServicio(id, data) {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) return null;

  await usuario.update(data);
  return limpiar(usuario);
}

// ======================================================
// 🔑 Cambiar contraseña
// ======================================================
export async function cambiarPasswordServicio(id, actual, nuevaPassword) {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw new Error("Usuario no existe");

  const coincide = await bcrypt.compare(actual, usuario.password);
  if (!coincide) throw new Error("La contraseña actual es incorrecta");

  const hash = await bcrypt.hash(nuevaPassword, 10);
  usuario.password = hash;
  await usuario.save();

  return true;
}

// ======================================================
// 🗑️ Desactivar usuario (soft delete corporativo)
// ======================================================
export async function eliminarUsuarioServicio(id) {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) return false;

  usuario.estado = "inactivo";
  await usuario.save();

  return true;
}

// ======================================================
// 📋 Listar usuarios
// ======================================================
export async function listarUsuarios({ page = 1, limit = 20, rol, estado }) {
  const offset = (page - 1) * limit;

  const where = {};
  if (rol) where.rol = rol;
  if (estado) where.estado = estado;

  const { rows, count } = await Usuario.findAndCountAll({
    where,
    offset,
    limit,
    attributes: { exclude: ["password"] },
    order: [["createdAt", "DESC"]],
  });

  return {
    usuarios: rows,
    total: count,
    page,
    pages: Math.ceil(count / limit),
  };
}
