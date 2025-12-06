// backend/middlewares/upload.js
// ======================================================
// 📤 Upload Middleware – FASTORDER Enterprise (UTF-8)
// ------------------------------------------------------
// Subida de imágenes altamente segura.
// Compatible con:
//  ✓ Productos
//  ✓ Categorías
//  ✓ Restaurante (branding)
//  ✓ Migración futura a S3 / Cloudinary
//
// Estilo Shopify / Stripe Files API.
// ======================================================

"use strict";

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ======================================================
// 📁 Ruta raíz de uploads
// ======================================================
const ROOT_UPLOAD = path.join(process.cwd(), "storage", "uploads");

if (!fs.existsSync(ROOT_UPLOAD)) {
  fs.mkdirSync(ROOT_UPLOAD, { recursive: true });
}

// ======================================================
// 🗂️ Crear carpetas por tipo dinámicamente
// ------------------------------------------------------
// Ejemplo: /uploads/productos /uploads/categorias /uploads/restaurante
// ======================================================
function obtenerDirectorio(tipo = "general") {
  const clean = tipo.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const dir = path.join(ROOT_UPLOAD, clean);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return dir;
}

// ======================================================
// 🏷️ Limpieza PRO estilo AWS (filenames)
// ------------------------------------------------------
// Convierte cualquier nombre en algo seguro y único
// ======================================================
function limpiarNombreArchivo(nombreOriginal) {
  const ext = path.extname(nombreOriginal);
  const base = path
    .basename(nombreOriginal, ext)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

  return `${Date.now()}-${base}${ext}`;
}

// ======================================================
// ⚙️ Configuración de Multer: Storage Engine
// ======================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tipo = req.uploadType || "general"; // definido por la ruta
    const dir = obtenerDirectorio(tipo);
    cb(null, dir);
  },

  filename: (req, file, cb) => {
    const seguro = limpiarNombreArchivo(file.originalname);
    cb(null, seguro);
  }
});

// ======================================================
// 🛡️ Validación estricta de tipos MIME
// ======================================================
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(new Error("❌ Formato no permitido. Solo JPG, PNG o WEBP."), false);
  }
  cb(null, true);
}

// ======================================================
// 🎚️ Límites de subida
// ======================================================
const LIMITS = {
  fileSize: 5 * 1024 * 1024, // 5 MB
  files: 1
};

// ======================================================
// 📦 Instancia Multer final
// ======================================================
const upload = multer({
  storage,
  fileFilter,
  limits: LIMITS
});

// ======================================================
// 🧩 Helper para rutas: upload.single('imagen', 'productos')
// ------------------------------------------------------
// Uso:
//
// router.post('/productos', setUploadType('productos'), upload.single('imagen'), (req,res)=>{})
// ======================================================
function setUploadType(tipo) {
  return (req, res, next) => {
    req.uploadType = tipo;
    next();
  };
}

// ======================================================
// 📦 Exportación
// ======================================================
module.exports = {
  upload,
  setUploadType
};
