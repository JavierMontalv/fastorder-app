// backend/services/iaService.js
// ======================================================================
// 🤖 IA Service — COMANDA ENTERPRISE 2026 (CEREBRO CENTRAL)
// ======================================================================

'use strict';

import OpenAI from 'openai';
import { createHash } from 'crypto';
import { sequelize } from '../config/db.js';
import { obtenerPresupuestoIAUSD } from '../config/pricingIA.js';
import { obtenerConsumoIAMensual } from '../helpers/iaEconomics.js';
import { estadoIA } from '../helpers/estadoIA.js';
import IaLog from '../models/IaLog.js';
import Restaurante from '../models/Restaurante.js';

// ======================================================================
// 🔐 CONFIGURACIÓN GLOBAL
// ======================================================================
const IA_PROVIDER = process.env.IA_PROVIDER || 'openai';
const IA_API_KEY = process.env.IA_API_KEY;
const IA_MODEL = process.env.IA_MODEL || 'gpt-4.1-mini';

const MAX_RETRIES = 2;
const MAX_TOKENS_DEFAULT = 300;

const IA_MODEL_PRICING_DEFAULTS = {
  'gpt-4o-mini': {
    input: 0.00015,
    output: 0.0006
  }
};

const MODEL_PRICING =
  IA_MODEL_PRICING_DEFAULTS[IA_MODEL] || {
    input: Number(process.env.IA_COSTO_1K_TOKENS || 0.002),
    output: Number(process.env.IA_COSTO_1K_TOKENS || 0.002)
  };

const COSTO_INPUT_1K_TOKENS_USD = Number(
  process.env.IA_COSTO_INPUT_1K_TOKENS_USD || MODEL_PRICING.input
);
const COSTO_OUTPUT_1K_TOKENS_USD = Number(
  process.env.IA_COSTO_OUTPUT_1K_TOKENS_USD || MODEL_PRICING.output
);

const TEMPERATURE = {
  copy: 0.6,
  precio: 0.4,
  clasificacion: 0.3,
  traduccion: 0.2
};

// ======================================================================
// 🩹 VALIDACIÓN API KEY + TIMEOUT OBLIGATORIO
// ======================================================================
let client = null;

if (!IA_API_KEY || typeof IA_API_KEY !== 'string' || IA_API_KEY.trim() === '') {
  console.warn('⚠️ IA_API_KEY no configurada. IA deshabilitada de forma segura.');
} else {
  client = new OpenAI({
    apiKey: IA_API_KEY,
    timeout: 15000
  });
}

// ======================================================================
// 🧠 PROMPTS
// ======================================================================
const PROMPTS = {
  mejorarDescripcion_v1: ({ texto, nombre, categoria }) => `
Eres un copywriter gastronómico profesional.
Mejora la siguiente descripción sin exagerar ni mentir.

Producto: ${nombre}
Categoría: ${categoria || 'general'}
Descripción actual:
"${texto}"

Reglas:
- Máximo 40 palabras
- Lenguaje claro y comercial
- Español neutro
`,

  generarDescripcion_v1: ({ nombre, categoria, ingredientes, tipo }) => `
Eres un redactor gastronómico profesional.
Genera una descripción atractiva para un menú digital.

Producto: ${nombre}
Categoría: ${categoria || 'general'}
Ingredientes: ${ingredientes || 'no especificados'}
Tipo: ${tipo || 'producto gastronómico'}

Reglas:
- Máximo 35 palabras
- Tono vendedor pero honesto
- Español neutro
`,

  sugerirPrecio_v1: ({ nombre, categoria, costo, mercado }) => `
Eres un analista de precios para restaurantes.
Sugiere un precio de venta rentable.

Producto: ${nombre}
Categoría: ${categoria}
Costo estimado: ${costo}
Mercado: ${mercado || 'Colombia'}

Reglas:
- Responde SOLO con un número entero
- Precio en COP
- Margen 30%–60%
`,

  sugerirCombos_v1: ({ productos, objetivo }) => `
Eres un estratega de ventas para restaurantes.
Sugiere combos de upsell.

Objetivo: ${objetivo || 'aumentar ticket promedio'}

Productos:
${productos.map((p) => `- ${p.nombre} (${p.precio})`).join('\n')}

Reglas:
- Máximo 3 combos
- Aumentar ticket promedio
`,

  traducirMenu_v1: ({ menu, idiomaDestino }) => `
Traduce el siguiente menú al idioma "${idiomaDestino}".

Reglas:
- Contexto gastronómico
- No cambiar precios
- Mantener orden

Menú:
${JSON.stringify(menu, null, 2)}
`
};

// ======================================================================
// 🔧 UTILIDADES
// ======================================================================
const estimarTokens = (texto = '') => Math.ceil(texto.length / 4);

const calcularCostoUSD = (tokensInput = 0, tokensOutput = 0) =>
  Number(
    (
      (Number(tokensInput || 0) / 1000) * COSTO_INPUT_1K_TOKENS_USD +
      (Number(tokensOutput || 0) / 1000) * COSTO_OUTPUT_1K_TOKENS_USD
    ).toFixed(6)
  );

const truncateText = (value, max = 16000) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) return null;
  return normalized.length > max ? normalized.slice(0, max) : normalized;
};

const normalizeMetadata = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return { raw: value };
    }
  }

  if (typeof value === 'object') {
    return value;
  }

  return null;
};

const sortJsonKeys = (value) => {
  if (Array.isArray(value)) {
    return value.map(sortJsonKeys);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortJsonKeys(value[key]);
        return acc;
      }, {});
  }

  return value;
};

const stableStringify = (value) => JSON.stringify(sortJsonKeys(value));

const parseJsonOutput = (raw) => {
  const text = typeof raw === 'string' ? raw.trim() : '';

  if (!text) {
    throw new Error('La respuesta de IA llego vacia');
  }

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() || text;

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error('No fue posible interpretar la propuesta JSON de IA');
  }
};

const normalizeProposalLog = (log) => {
  if (!log) return null;

  try {
    const metadata = normalizeMetadata(log.metadata) || {};
    const proposal = parseJsonOutput(log.output);

    return {
      proposalId: log.id,
      proposal,
      contextHash: metadata.contextHash || null,
      proposalKind: metadata.proposalKind || 'mixto',
      request: metadata.request || null,
      snapshot: metadata.snapshot || null,
      createdAt: log.createdAt,
      cached: true,
      usage: {
        costoUSD: Number(log.costoUSD || 0),
        tokensInput: Number(log.tokensInput || 0),
        tokensOutput: Number(log.tokensOutput || 0),
        tokensTotal: Number(log.tokensTotal || 0)
      }
    };
  } catch {
    return null;
  }
};

export const crearHashContextoIA = (value) =>
  createHash('sha256').update(stableStringify(value || {})).digest('hex');

let iaLogSchemaPromise = null;

const getIaLogSchema = async () => {
  if (!iaLogSchemaPromise) {
    iaLogSchemaPromise = sequelize
      .getQueryInterface()
      .describeTable('ia_logs')
      .then((schema) => schema || {})
      .catch(() => ({}));
  }

  return iaLogSchemaPromise;
};

const hasIaLogColumn = async (columnName) => {
  const schema = await getIaLogSchema();
  return Boolean(schema?.[columnName]);
};

const pickIaLogPayload = async (payload) => {
  const schema = await getIaLogSchema();

  return Object.entries(payload).reduce((acc, [key, value]) => {
    if (schema?.[key] !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
};

const buildIaLogAttributes = async () => {
  const desired = [
    'id',
    'restauranteId',
    'usuarioId',
    'origen',
    'tipo',
    'funcion',
    'modelo',
    'promptVersion',
    'input',
    'output',
    'tokensInput',
    'tokensOutput',
    'tokensTotal',
    'costoUSD',
    'estado',
    'error',
    'metadata',
    'createdAt'
  ];

  const schema = await getIaLogSchema();
  const available = desired.filter((column) => schema?.[column] !== undefined);

  return available.length > 0 ? available : undefined;
};

// ======================================================================
// 🔧 PROVEEDOR IA
// ======================================================================
const ejecutarIAProveedor = async (
  prompt,
  { temperature = 0.6, maxTokens = MAX_TOKENS_DEFAULT, imageInputs = [] } = {}
) => {
  if (!client) {
    return { output: null, error: 'IA_NO_DISPONIBLE' };
  }

  const tokensInput = estimarTokens(prompt);
  let intento = 0;

  while (intento < (imageInputs.length ? 1 : MAX_RETRIES)) {
    try {
      const completion = await client.chat.completions.create({
        model: IA_MODEL,
        messages: [{ role: 'user', content: imageInputs.length ? [{ type: 'text', text: prompt }, ...imageInputs.map(url => ({ type: 'image_url', image_url: { url, detail: 'low' } }))] : prompt }],
        temperature,
        max_tokens: maxTokens
      }, imageInputs.length ? { maxRetries: 0 } : undefined);

      const outputText = completion?.choices?.[0]?.message?.content;

      if (typeof outputText !== 'string') {
        throw new Error('Respuesta inválida de IA');
      }

      const usedInput = Number(completion.usage?.prompt_tokens || tokensInput);
      const tokensOutput = Number(completion.usage?.completion_tokens || estimarTokens(outputText));
      const tokensTotal = usedInput + tokensOutput;

      return {
        output: outputText.trim(),
        tokensInput: usedInput,
        tokensOutput,
        tokensTotal,
        costoUSD: calcularCostoUSD(usedInput, tokensOutput)
      };
    } catch (error) {
      intento += 1;
      if (intento >= (imageInputs.length ? 1 : MAX_RETRIES)) {
        return { output: null, error: 'IA_NO_DISPONIBLE' };
      }
    }
  }

  return { output: null, error: 'IA_NO_DISPONIBLE' };
};

// ======================================================================
// 🧠 EJECUTOR CENTRAL (TRANSACCIÓN SEGURA)
// ======================================================================
const ejecutarIA = async ({
  restauranteId,
  usuarioId = null,
  tipo,
  funcion,
  origen,
  prompt,
  temperature,
  maxTokens,
  promptVersion = 'v1',
  metadata = null,
  imageInputs = []
}) => {
  const t = await sequelize.transaction();
  const supportsInputColumn = await hasIaLogColumn('input');

  try {
    const restaurante = await Restaurante.findByPk(restauranteId, {
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    // 🔥 ÚNICA validación estructural
    if (!restaurante) {
      await t.rollback();
      return {
        resultado: null,
        error: 'RESTAURANTE_NO_EXISTE',
        estadoIA: 'invalido'
      };
    }

    // 🧠 FUENTE ÚNICA DE VERDAD
    const estado = estadoIA(restaurante);
    const presupuestoIAUSD = Number(obtenerPresupuestoIAUSD(restaurante.plan) || 0);
    const consumoIAMensual = await obtenerConsumoIAMensual(restauranteId, { transaction: t });

    if (!estado.puede_consumir) {
      await t.rollback();
      return {
        resultado: null,
        error: estado.ia_motivo,
        estadoIA: estado.ia_estado
      };
    }

    if (presupuestoIAUSD <= 0) {
      await t.rollback();
      return {
        resultado: null,
        error: 'IA_PLAN_SIN_PRESUPUESTO',
        estadoIA: 'no_disponible'
      };
    }

    if (imageInputs.length) {
      const reserved = calcularCostoUSD(estimarTokens(prompt) + imageInputs.length * 3000, maxTokens || 1400);
      if (Number(consumoIAMensual?.costoUSD || 0) + reserved > presupuestoIAUSD) {
        await t.rollback();
        return { resultado: null, error: 'IA_PRESUPUESTO_ALCANZADO' };
      }
    }
    const resultado = await ejecutarIAProveedor(prompt, {
      temperature,
      maxTokens,
      imageInputs
    });

    if (!resultado || !resultado.output) {
      await t.rollback();
      return {
        resultado: null,
        error: 'IA_NO_DISPONIBLE',
        estadoIA: 'proveedor'
      };
    }

    const costoProyectadoUSD =
      Number(consumoIAMensual?.costoUSD || 0) + Number(resultado?.costoUSD || 0);

    if (costoProyectadoUSD > presupuestoIAUSD) {
      await t.rollback();
      return {
        resultado: null,
        error: 'IA_PRESUPUESTO_ALCANZADO',
        estadoIA: 'agotada'
      };
    }

    // 🛡 VALIDACIÓN FINAL DEFENSIVA DE LÍMITE (ANTI-RACE CONDITION)
    const limiteMesIA = Number(estado?.ia_limite_mes ?? 0);
    const consumoIA = Number(restaurante?.ia_consumo_actual ?? 0);

    if (limiteMesIA > 0 && consumoIA >= limiteMesIA) {
      await t.rollback();
      return {
        resultado: null,
        error: 'IA_LIMITE_ALCANZADO',
        estadoIA: 'agotada'
      };
    }
    restaurante.ia_consumo_actual += 1;
    await restaurante.save({ transaction: t });

    const metadataLog = normalizeMetadata(metadata);
    const logPayload = await pickIaLogPayload({
      restauranteId,
      usuarioId,
      origen,
      tipo,
      funcion,
      modelo: IA_MODEL,
      promptVersion,
      input: supportsInputColumn ? truncateText(prompt) : undefined,
      output: truncateText(resultado.output),
      tokensInput: resultado.tokensInput,
      tokensOutput: resultado.tokensOutput,
      tokensTotal: resultado.tokensTotal,
      costoUSD: resultado.costoUSD,
      estado: 'ok',
      error: null,
      metadata: metadataLog
    });

    const log = await IaLog.create(logPayload, { transaction: t });

    await t.commit();

    return {
      resultado: resultado.output,
      tokensInput: resultado.tokensInput,
      tokensOutput: resultado.tokensOutput,
      tokensTotal: resultado.tokensTotal,
      costoUSD: resultado.costoUSD,
      logId: log.id
    };
  } catch (error) {
    await t.rollback();

    const failedLogPayload = await pickIaLogPayload({
      restauranteId,
      usuarioId,
      origen: origen || 'admin',
      tipo: tipo || 'otro',
      funcion,
      modelo: IA_MODEL,
      promptVersion,
      input: supportsInputColumn ? truncateText(prompt) : undefined,
      tokensInput: estimarTokens(prompt),
      tokensOutput: 0,
      tokensTotal: estimarTokens(prompt),
      costoUSD: 0,
      estado: 'error',
      error: error.message,
      metadata: normalizeMetadata(metadata)
    });
    await IaLog.create(failedLogPayload);

    return { resultado: null };
  }
};

// ======================================================================
// ✨ API INTERNA
// ======================================================================
export const mejorarDescripcionIA = (ctx) =>
  ejecutarIA({
    ...ctx,
    tipo: 'prompt',
    funcion: 'mejorarDescripcion',
    prompt: PROMPTS.mejorarDescripcion_v1(ctx.params),
    temperature: TEMPERATURE.copy
  });

export const generarDescripcionIA = (ctx) =>
  ejecutarIA({
    ...ctx,
    tipo: 'prompt',
    funcion: 'generarDescripcion',
    prompt: PROMPTS.generarDescripcion_v1(ctx.params),
    temperature: TEMPERATURE.copy
  });

export const sugerirPrecioIA = async (ctx) => {
  const res = await ejecutarIA({
    ...ctx,
    tipo: 'prompt',
    funcion: 'sugerirPrecio',
    prompt: PROMPTS.sugerirPrecio_v1(ctx.params),
    temperature: TEMPERATURE.precio,
    maxTokens: 50
  });

  const precio = parseInt(res?.resultado, 10);
  if (Number.isNaN(precio)) {
    return { precio: null, moneda: 'COP' };
  }

  return { precio, moneda: 'COP' };
};

export const sugerirCombosIA = (ctx) =>
  ejecutarIA({
    ...ctx,
    tipo: 'recomendacion',
    funcion: 'sugerirCombos',
    prompt: PROMPTS.sugerirCombos_v1(ctx.params),
    temperature: 0.7,
    maxTokens: 500
  });

export const traducirMenuIA = (ctx) =>
  ejecutarIA({
    ...ctx,
    tipo: 'traduccion',
    funcion: 'traducirMenu',
    prompt: PROMPTS.traducirMenu_v1(ctx.params),
    temperature: TEMPERATURE.traduccion,
    maxTokens: 800
  });

export const obtenerUltimaPropuestaCatalogoIA = async ({
  restauranteId,
  proposalKind = null,
  contextHash = null
}) => {
  const attributes = await buildIaLogAttributes();
  const logs = await IaLog.findAll({
    attributes,
    where: {
      restauranteId,
      estado: 'ok',
      funcion: 'propuestaCatalogoIA'
    },
    order: [['createdAt', 'DESC']],
    limit: 25
  });

  for (const log of logs) {
    const parsed = normalizeProposalLog(log);
    if (!parsed) continue;
    if (proposalKind && parsed.proposalKind !== proposalKind) continue;
    if (contextHash && parsed.contextHash !== contextHash) continue;
    return parsed;
  }

  return null;
};

export const obtenerPropuestaCatalogoIAById = async ({ restauranteId, proposalId }) => {
  const attributes = await buildIaLogAttributes();
  const log = await IaLog.findOne({
    attributes,
    where: {
      id: proposalId,
      restauranteId,
      estado: 'ok',
      funcion: 'propuestaCatalogoIA'
    }
  });

  return normalizeProposalLog(log);
};

export const generarPropuestaCatalogoIA = async ({
  restauranteId,
  usuarioId = null,
  origen = 'admin',
  prompt,
  proposalKind = 'mixto',
  contextHash,
  request = null,
  snapshot = null,
  forceRegenerate = false
}) => {
  if (!forceRegenerate && contextHash) {
    const cached = await obtenerUltimaPropuestaCatalogoIA({
      restauranteId,
      proposalKind,
      contextHash
    });

    if (cached) {
      return cached;
    }
  }

  const result = await ejecutarIA({
    restauranteId,
    usuarioId,
    origen,
    tipo: 'recomendacion',
    funcion: 'propuestaCatalogoIA',
    prompt,
    promptVersion: 'catalogo_v1',
    temperature: 0.55,
    maxTokens: proposalKind === 'promocion' ? 900 : 1200,
    metadata: {
      contextHash,
      proposalKind,
      request,
      snapshot
    }
  });

  if (!result?.resultado || !result?.logId) {
    return null;
  }

  const proposal = parseJsonOutput(result.resultado);

  return {
    proposalId: result.logId,
    proposal,
    contextHash,
    proposalKind,
    request,
    snapshot,
    createdAt: new Date().toISOString(),
    cached: false,
    usage: {
      costoUSD: Number(result.costoUSD || 0),
      tokensInput: Number(result.tokensInput || 0),
      tokensOutput: Number(result.tokensOutput || 0),
      tokensTotal: Number(result.tokensTotal || 0)
    }
  };
};

// ======================================================================
// 💬 CHAT SOPORTE IA (ADMIN / OWNER)
// ======================================================================
export const iaChatAsistenteAdmin = async ({ mensaje, contexto, meta = {} }) => {
  const prompt = `
Eres un asistente experto en gestión de restaurantes.
Ayudas a administradores y dueños con decisiones operativas, comerciales y estratégicas.

${contexto || ''}

Pregunta del usuario:
"${mensaje}"

Responde de forma clara, práctica y profesional.
Reglas:
- Usa primero el contexto real del negocio antes de sugerir ideas generales.
- Si das recomendaciones, prioriza acciones concretas para las próximas 24 horas y para este mes.
- Si hablas de ventas o ticket, aterriza la respuesta con los datos visibles del negocio.
- No inventes datos que no estén en el contexto.
`;

  const res = await ejecutarIA({
    restauranteId: meta.restauranteId,
    usuarioId: meta.usuarioId || null,
    origen: 'admin',
    tipo: 'chat',
    funcion: 'soporteIA',
    prompt,
    temperature: 0.6,
    maxTokens: 500
  });

  return {
    texto: res?.resultado || null
  };
};


// Bounded product intake reuses tenant limits, accounting and audit logs.
export const organizarCargaProductosIA = (ctx) => ejecutarIA({ ...ctx, tipo: 'recomendacion', funcion: 'propuestaCatalogoIA', promptVersion: 'product_intake_v1', temperature: 0.2, maxTokens: 1400 });
