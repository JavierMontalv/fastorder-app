import { boundedMetadata, requestContext, shouldCapture, routeCategory } from '../utils/auditPolicy.mjs';
// ======================================================================
// 🧠 Middleware de auditoría — COMANDA ENTERPRISE 2026
// ----------------------------------------------------------------------
// • Inyecta req.auditar()
// • Persiste auditoría (inmutable)
// • Crea notificación IA SOLO para eventos críticos
// • Sin romper flujo principal
// ======================================================================

'use strict';

import { sequelize } from '../config/db.js';
import Auditoria from '../models/Auditoria.js';
import logger from '../utils/logger.js';

// ======================================================
// ⚠️ Acciones IA que generan NOTIFICACIÓN
// ======================================================
const ACCIONES_IA_CRITICAS = new Set([
  'ia_error',
  'ia_limite_superado',
  'ia_suscripcion_no_activa',
  'ia_bloqueada',
  'ia_timeout_recurrente'
]);

export default function auditarAccion(req, res, next) {
  let explicit = false;
  const context = requestContext(req);
  // Only the login controller's successful response supplies this identity.
  if (req.path === '/login') {
    const json = res.json;
    res.json = function(body) {
      const user = body?.data?.usuario;
      if (res.statusCode < 400 && user?.id && user?.restauranteId) {
        req.usuario = {id:user.id,nombre:user.nombre,rol:user.rol,restauranteId:user.restauranteId};
      }
      return json.call(this, body);
    };
  }
  res.once('finish', () => {
    if (explicit || !shouldCapture(req)) return;
    const path = String(req.originalUrl || '').split('?')[0];
    const user = req.usuario;
    void req.auditar({ entidad: 'restaurante', entidadId: user.restauranteId,
      accion: 'api_' + req.method.toLowerCase(),
      metadata: { tipo:'operacion', categoria:routeCategory(path), ruta:path.slice(0,180),
        resultado: res.statusCode < 400 ? 'correcto' : 'rechazado', codigo:res.statusCode,
        detalle: 'Solicitud API finalizada. No se dispone de comparación antes/después.',
        actor:{id:user.id,nombre:user.nombre,rol:user.rol}, requestId:context.requestId }
    });
  });
  req.auditar = async ({ entidad, entidadId, accion, metadata = {} }) => {
    explicit = true;
    metadata = boundedMetadata({ ...metadata, requestId:context.requestId,
      actor: metadata.actor || {id:req.usuario?.id || 0,nombre:req.usuario?.nombre || 'Sistema',rol:req.usuario?.rol || 'sistema'} });
    let auditoriaCreada = null;

    // ======================================================
    // 🧾 1️⃣ Registrar auditoría (SIEMPRE)
    // ======================================================
    try {
      auditoriaCreada = await Auditoria.create({
        entidad,
        entidadId,
        accion,
        actorId: req.usuario?.id || 0,
        ip: req.ip || null,
        metadata,
        fecha: new Date()
      });
    } catch (error) {
      // ❗ Auditoría jamás rompe el flujo
      logger.error('❌ Error registrando auditoría', {
        error,
        entidad,
        entidadId,
        accion
      });
      return;
    }

    // ======================================================
    // 🔔 2️⃣ Crear notificación IA (SOLO si aplica)
    // ======================================================
    try {
      if (entidad === 'restaurante' && ACCIONES_IA_CRITICAS.has(accion)) {
        await sequelize.query(
          `
          INSERT INTO notificaciones_ia
            (restauranteId, auditoriaId, tipo, severidad, accion, mensaje, leida, metadata, fecha, expiraEn)
          VALUES
            (:restauranteId, :auditoriaId, 'ia', :severidad, :accion, :mensaje, false, :metadata, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))
          `,
          {
            replacements: {
              restauranteId: entidadId,
              auditoriaId: auditoriaCreada.id,
              severidad: 'critica',
              accion,
              mensaje: generarMensajeIA(accion),
              metadata: JSON.stringify(metadata)
            }
          }
        );
      }
    } catch (error) {
      // ❗ Notificación JAMÁS rompe auditoría
      logger.error('❌ Error creando notificación IA', {
        error: error?.message,
        accion,
        entidadId
      });
    }
  };

  next();
}

// ======================================================
// 🧠 Mensajes humanos por acción IA
// ======================================================
function generarMensajeIA(accion) {
  switch (accion) {
    case 'ia_error':
      return 'Error crítico durante la ejecución de IA';
    case 'ia_limite_superado':
      return 'El restaurante superó el límite permitido de IA';
    case 'ia_suscripcion_no_activa':
      return 'Intento de uso de IA con suscripción no activa';
    case 'ia_bloqueada':
      return 'La IA fue bloqueada automáticamente por el sistema';
    case 'ia_timeout_recurrente':
      return 'Múltiples timeouts detectados en ejecuciones de IA';
    default:
      return 'Evento crítico de IA detectado';
  }
}

