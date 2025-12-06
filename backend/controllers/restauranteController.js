// backend/controllers/restauranteController.js
// ======================================================
// 🏪 Controlador de Restaurante – FASTORDER (2026 Enterprise)
// ----------------------------------------------------------
// Configuración avanzada del negocio:
//  • Datos generales
//  • Logo / portada
//  • Horarios por día
//  • Métodos de pago dinámicos
//  • Estado operativo en tiempo real
//  • Modo instalación inicial
// ======================================================

"use strict";

import Restaurante from "../models/Restaurante.js";
import logger from "../utils/logger.js";

// -----------------------------
// Helpers corporativos
// -----------------------------
const clean = (v) =>
  typeof v === "string" ? v.trim().replace(/\s+/g, " ") : v;

const METODOS_PERMITIDOS = [
  "efectivo",
  "nequi",
  "daviplata",
  "tarjeta",
  "transferencia",
  "pse",
];

const ESTADOS_VALIDOS = ["abierto", "cerrado", "preparando", "fuera_servicio"];

const validarMetodosPago = (metodos) => {
  if (!Array.isArray(metodos)) return false;
  return metodos.every((m) => METODOS_PERMITIDOS.includes(m));
};

const validarEstado = (estado) => ESTADOS_VALIDOS.includes(estado);

const normalizarHorarios = (horarios) => {
  if (!horarios || typeof horarios !== "object") return null;

  const normalizados = {};

  for (const dia of Object.keys(horarios)) {
    const item = horarios[dia];

    normalizados[dia] = {
      abre: clean(item?.abre) || null,
      cierra: clean(item?.cierra) || null,
      cerrado: Boolean(item?.cerrado),
    };
  }

  return normalizados;
};

// ======================================================
// 🔍 Obtener configuración del restaurante
// ======================================================
export const obtenerRestaurante = async (req, res) => {
  try {
    const data = await Restaurante.findOne();

    return res.json({
      success: true,
      message: data
        ? "Configuración del restaurante obtenida correctamente"
        : "Restaurante aún no configurado",
      data,
    });
  } catch (err) {
    logger.error("❌ Error obteniendo restaurante:", err);

    return res.status(500).json({
      success: false,
      message: "Error interno obteniendo la configuración",
    });
  }
};

// ======================================================
// ✏️ Crear o actualizar restaurante
// ======================================================
export const actualizarRestaurante = async (req, res) => {
  try {
    const payload = { ...req.body };

    // Sanitización básica
    if (payload.nombre) payload.nombre = clean(payload.nombre);
    if (payload.direccion) payload.direccion = clean(payload.direccion);
    if (payload.descripcion) payload.descripcion = clean(payload.descripcion);

    // Estado operativo
    if (payload.estado && !validarEstado(payload.estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Permitidos: ${ESTADOS_VALIDOS.join(", ")}`,
      });
    }

    // Métodos de pago
    if (
      payload.metodosPago &&
      !validarMetodosPago(payload.metodosPago)
    ) {
      return res.status(400).json({
        success: false,
        message: `Métodos de pago inválidos. Permitidos: ${METODOS_PERMITIDOS.join(
          ", "
        )}`,
      });
    }

    // Horarios
    if (payload.horarios) {
      payload.horarios = normalizarHorarios(payload.horarios);
    }

    // Buscar restaurante
    let restaurante = await Restaurante.findOne();

    // Primera instalación
    if (!restaurante) {
      const nuevo = await Restaurante.create(payload);

      logger.info("🏪 Restaurante creado (instalación inicial)");

      return res.status(201).json({
        success: true,
        message: "Restaurante configurado por primera vez",
        data: nuevo,
      });
    }

    // Actualización normal
    await restaurante.update(payload);
    logger.info("🏪 Restaurante actualizado correctamente");

    return res.json({
      success: true,
      message: "Restaurante actualizado",
      data: restaurante,
    });
  } catch (err) {
    logger.error("❌ Error actualizando restaurante:", err);

    return res.status(500).json({
      success: false,
      message: "Error interno actualizando restaurante",
    });
  }
};
