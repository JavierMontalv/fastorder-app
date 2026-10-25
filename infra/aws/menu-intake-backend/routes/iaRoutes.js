import { organizarCargaProductos } from '../controllers/productIntakeController.js';
'use strict';

import { Router } from 'express';

// 🔐 Auth & contexto
import auth from '../middlewares/auth.js';
import inyectarRestaurante from '../middlewares/inyectarRestaurante.js';

// 🤖 IA guards
import { requerirIAActiva } from '../middlewares/requerirIAActiva.js';
import { verificarLimiteIA } from '../middlewares/verificarLimiteIA.js';
import { verificarModoIA } from '../middlewares/verificarModoIA.js';
import { requerirFuncionIA } from '../middlewares/requerirFuncionIA.js';

// 🧠 Servicios IA
import {
  generarDescripcionIA,
  mejorarDescripcionIA,
  sugerirCombosIA,
  sugerirPrecioIA,
  traducirMenuIA
} from '../services/iaService.js';
import {
  aplicarPropuestaCatalogo,
  crearPropuestaCatalogo,
  getCatalogoIAWorkspace,
  getUltimaPropuestaCatalogo
} from '../controllers/iaMenuController.js';

const router = Router();

// ======================================================================
// 🧠 Helper — definir modo IA (FUENTE ÚNICA)
// ======================================================================
const setModoIA = (modoIA) => (req, res, next) => {
  req.modoIA = modoIA;
  next();
};

// ======================================================================
// 🔐 Middlewares BASE (sin modo)
// ======================================================================
router.use(auth);
router.use(inyectarRestaurante);

router.get(
  '/menu/workspace',
  setModoIA('menu_propuesta'),
  getCatalogoIAWorkspace
);

router.get(
  '/menu/propuesta/ultima',
  setModoIA('menu_propuesta'),
  getUltimaPropuestaCatalogo
);

router.use(requerirIAActiva);

router.post('/menu/organizar-productos', setModoIA('menu_propuesta'), verificarModoIA, verificarLimiteIA, requerirFuncionIA('propuestaCatalogoIA'), organizarCargaProductos);


router.post(
  '/menu/propuesta',
  setModoIA('menu_propuesta'),
  verificarModoIA,
  verificarLimiteIA,
  requerirFuncionIA('propuestaCatalogoIA'),
  crearPropuestaCatalogo
);

router.post(
  '/menu/propuesta/aplicar',
  setModoIA('menu_propuesta'),
  verificarModoIA,
  requerirFuncionIA('propuestaCatalogoIA'),
  aplicarPropuestaCatalogo
);

// ======================================================================
// ✨ GENERAR DESCRIPCIÓN
// POST /api/ia/descripcion/generar
// ======================================================================
router.post(
  '/descripcion/generar',
  setModoIA('descripcion_generada'),
  verificarModoIA,
  verificarLimiteIA,
  async (req, res, next) => {
    try {
      const resultado = await generarDescripcionIA({
        usuarioId: req.usuario.id,
        restauranteId: req.restaurante.id,
        origen: req.usuario.rol || 'admin',
        modoIA: req.modoIA,
        params: req.body
      });

      return res.status(200).json({
        success: true,
        message: 'Descripción generada correctamente',
        data: resultado.resultado
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================================
// ✨ MEJORAR DESCRIPCIÓN
// ======================================================================
router.post(
  '/descripcion/mejorar',
  setModoIA('descripcion_mejorada'),
  verificarModoIA,
  verificarLimiteIA,
  async (req, res, next) => {
    try {
      const resultado = await mejorarDescripcionIA({
        usuarioId: req.usuario.id,
        restauranteId: req.restaurante.id,
        origen: req.usuario.rol || 'admin',
        modoIA: req.modoIA,
        params: req.body
      });

      return res.status(200).json({
        success: true,
        message: 'Descripción mejorada correctamente',
        data: resultado.resultado
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================================
// 💰 SUGERIR PRECIO
// ======================================================================
router.post(
  '/precio/sugerir',
  setModoIA('precio'),
  verificarModoIA,
  verificarLimiteIA,
  async (req, res, next) => {
    try {
      const resultado = await sugerirPrecioIA({
        usuarioId: req.usuario.id,
        restauranteId: req.restaurante.id,
        origen: req.usuario.rol || 'admin',
        modoIA: req.modoIA,
        params: req.body
      });

      return res.status(200).json({
        success: true,
        message: 'Precio sugerido correctamente',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================================
// 🍔 SUGERIR COMBOS
// ======================================================================
router.post(
  '/combos/sugerir',
  setModoIA('combos'),
  verificarModoIA,
  verificarLimiteIA,
  async (req, res, next) => {
    try {
      const resultado = await sugerirCombosIA({
        usuarioId: req.usuario.id,
        restauranteId: req.restaurante.id,
        origen: req.usuario.rol || 'admin',
        modoIA: req.modoIA,
        params: req.body
      });

      return res.status(200).json({
        success: true,
        message: 'Combos sugeridos correctamente',
        data: resultado.resultado
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================================
// 🌍 TRADUCIR MENÚ
// ======================================================================
router.post(
  '/menu/traducir',
  setModoIA('traduccion'),
  verificarModoIA,
  verificarLimiteIA,
  async (req, res, next) => {
    try {
      const resultado = await traducirMenuIA({
        usuarioId: req.usuario.id,
        restauranteId: req.restaurante.id,
        origen: req.usuario.rol || 'admin',
        modoIA: req.modoIA,
        params: req.body
      });

      return res.status(200).json({
        success: true,
        message: 'Menú traducido correctamente',
        data: resultado.resultado
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
