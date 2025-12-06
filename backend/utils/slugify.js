// backend/utils/slugify.js
// ======================================================
// 🔤 Slugify Profesional – FASTORDER Enterprise (2026)
// ======================================================

"use strict";

// ------------------------------------------------------
// ✨ Función base de slugify
// ------------------------------------------------------
export function slugify(texto = "") {
  if (!texto) return "";

  return texto
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // quitar acentos
    .replace(/ß/g, "ss")
    .replace(/ñ/g, "n")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ------------------------------------------------------
// 🆔 slugify único (opcional)
// ------------------------------------------------------
export function slugifyUnique(nombre, existentes = []) {
  let base = slugify(nombre);
  if (!existentes.includes(base)) return base;

  let contador = 1;
  let nuevoSlug = `${base}-${contador}`;

  while (existentes.includes(nuevoSlug)) {
    contador++;
    nuevoSlug = `${base}-${contador}`;
  }

  return nuevoSlug;
}

// ------------------------------------------------------
// ✅ Export default (requerido por tus modelos)
// ------------------------------------------------------
export default slugify;
