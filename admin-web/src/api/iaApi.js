// admin-web/src/api/iaApi.js
// ======================================================================
// 🤖 IA API — COMANDA ADMIN WEB 2026
// Centraliza TODAS las llamadas a IA de negocio
// Evita llamadas directas desde componentes
// Arquitectura limpia · Escalable · Enterprise
// ======================================================================

'use strict';

import api from './api';

const IA_PROPOSAL_TIMEOUT_MS = 45000;

export const organizarProductosDesdeFotos = async (items) => {
  const response = await api.post('/ia/menu/organizar-productos', { items }, { timeout: IA_PROPOSAL_TIMEOUT_MS });
  return response.data;
};

// ======================================================================
// ✨ Mejorar descripción existente
// POST /api/ia/mejorar-descripcion
// ======================================================================
export const mejorarDescripcion = async ({ texto, nombre, categoria }) => {
  const res = await api.post('/ia/mejorar-descripcion', {
    texto,
    nombre,
    categoria
  });

  return res.data;
};

// ======================================================================
// ✨ Generar descripción desde cero
// POST /api/ia/generar-descripcion
// ======================================================================
export const generarDescripcion = async ({ nombre, categoria, ingredientes, tipo }) => {
  const res = await api.post('/ia/generar-descripcion', {
    nombre,
    categoria,
    ingredientes,
    tipo
  });

  return res.data;
};

// ======================================================================
// 💰 Sugerir precio óptimo
// POST /api/ia/sugerir-precio
// ======================================================================
export const sugerirPrecio = async ({ nombre, categoria, costo, mercado }) => {
  const res = await api.post('/ia/sugerir-precio', {
    nombre,
    categoria,
    costo,
    mercado
  });

  return res.data;
};

// ======================================================================
// 🍔 Sugerir combos / upsell
// POST /api/ia/sugerir-combos
// ======================================================================
export const sugerirCombos = async ({ productos, objetivo }) => {
  const res = await api.post('/ia/sugerir-combos', {
    productos,
    objetivo
  });

  return res.data;
};

export const obtenerUltimaPropuestaCatalogo = async (
  tipoPropuesta = 'mixto',
  { bypassCache = true } = {}
) => {
  const res = await api.get('/ia/menu/propuesta/ultima', {
    params: {
      tipoPropuesta,
      ...(bypassCache ? { _t: Date.now() } : {})
    },
    timeout: 15000
  });

  return res.data;
};

export const obtenerWorkspaceCatalogoIA = async (tipoPropuesta = 'mixto') => {
  const res = await api.get('/ia/menu/workspace', {
    params: {
      tipoPropuesta,
      _t: Date.now()
    },
    timeout: 20000
  });

  return res.data;
};

export const generarPropuestaCatalogo = async ({
  briefPrincipal,
  objetivo,
  estilo,
  restricciones,
  tipoPropuesta,
  forceRegenerate = false
}) => {
  const res = await api.post(
    '/ia/menu/propuesta',
    {
      briefPrincipal,
      objetivo,
      estilo,
      restricciones,
      tipoPropuesta,
      forceRegenerate
    },
    {
      timeout: IA_PROPOSAL_TIMEOUT_MS
    }
  );

  return res.data;
};

export const aplicarPropuestaCatalogo = async ({ proposalId, sectionIds, promotionIds }) => {
  const res = await api.post(
    '/ia/menu/propuesta/aplicar',
    {
      proposalId,
      sectionIds,
      promotionIds
    },
    {
      timeout: 20000
    }
  );

  return res.data;
};
