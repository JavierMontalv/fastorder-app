import { Router } from 'express';
import { Op } from 'sequelize';
import auth from '../middlewares/auth.js';
import Auditoria from '../models/Auditoria.js';
import { parseQuery, boundedMetadata, routeCategory } from '../utils/auditPolicy.mjs';

const router = Router();
router.use(auth);
router.get('/', async (req,res) => {
  if (!req.usuario) return res.status(401).json({ message: 'Inicia sesión' });
  if (!['admin','owner'].includes(req.usuario.rol) || !req.usuario.restauranteId)
    return res.status(403).json({ message: 'Solo administradores de esta sede' });
  let query;
  try { query = parseQuery(req.query); } catch(e) { return res.status(400).json({ message: e.message }); }
  try {
    const where = { entidad: 'restaurante', entidadId: req.usuario.restauranteId, fecha: { [Op.gte]: query.since } };
    if (query.cursor) where.id = { [Op.lt]: query.cursor };
    const rows = await Auditoria.findAll({ where, order: [['id','DESC']], limit: query.limit + 1,
      attributes: ['id','accion','actorId','ip','metadata','fecha'] });
    const items = rows.slice(0,query.limit).map(row => {
      let metadata = row.metadata;
      if (typeof metadata === 'string') { try { metadata = JSON.parse(metadata); } catch { metadata = {}; } }
      metadata = boundedMetadata(metadata || {});
      return { id: String(row.id), accion: row.accion, actorId: row.actorId, ip: row.ip, fecha: row.fecha, metadata,
        categoria: metadata.categoria || routeCategory(metadata.ruta || row.accion),
        resultado: metadata.resultado || 'registrado' };
    });
    res.set('Cache-Control','private, no-store');
    return res.json({ items, nextCursor: rows.length > query.limit ? String(items.at(-1).id) : null,
      coverage: 'Cambios autenticados por API y eventos explícitos del sistema; no incluye clics ni lecturas.' });
  } catch { return res.status(503).json({ message: 'No se pudo consultar la auditoría. Intenta nuevamente.' }); }
});
export default router;
