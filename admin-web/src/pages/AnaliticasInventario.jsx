import { useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { useTheme } from '../context/ThemeContext';
import useAnaliticaInventario from '../hooks/useAnaliticaInventario';
import { marcarAlertaLeida, resolverAlerta } from '../services/inventarioService';
import { getChartTheme } from '../utils/chartTheme';
import '../styles/AnaliticasInventario.css';

const numero = new Intl.NumberFormat('es-CO');

const COLORES_SEVERIDAD = {
  baja: '#16a34a',
  media: '#f59e0b',
  alta: '#ef4444',
  critica: '#991b1b',
  urgente: '#7f1d1d'
};

function capitalizar(texto) {
  if (!texto) return 'Sin dato';
  const label = String(texto).replaceAll('_', ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function TooltipInventario({ active, payload, label, theme }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="inventario-tooltip"
      style={{
        background: theme.tooltipBackground,
        borderColor: theme.tooltipBorder,
        color: theme.tooltipText
      }}
    >
      {label && <strong>{label}</strong>}
      {payload.map((item) => (
        <div key={`${item.dataKey}-${item.name}`}>
          <span>{item.name || item.dataKey}</span>
          <b>{numero.format(item.value)}</b>
        </div>
      ))}
    </div>
  );
}

export default function AnaliticasInventario({ fechaInicio, fechaFin, rangoInvalido }) {
  const { isDark } = useTheme();
  const {
    historial,
    alertasActivasActualesDetalle,
    tendencias,
    metricas,
    productosCriticos,
    recomendaciones,
    loading,
    error,
    recargar
  } = useAnaliticaInventario({
    fechaInicio,
    fechaFin,
    autoLoad: !rangoInvalido
  });
  const [accionCargando, setAccionCargando] = useState(null);
  const [accionError, setAccionError] = useState(null);
  const [accionOk, setAccionOk] = useState(null);
  const actionLock = useRef(false);

  const chartTheme = useMemo(() => getChartTheme(isDark), [isDark]);

  const tendenciasNormalizadas = useMemo(() => {
    const mapa = new Map();

    for (const item of tendencias) {
      const fecha = item.fecha || 'Sin fecha';
      const severidad = String(item.severidad || 'media').toLowerCase();
      const total = Number(item.total || 0);

      if (!mapa.has(fecha)) {
        mapa.set(fecha, { fecha, baja: 0, media: 0, alta: 0, critica: 0, urgente: 0 });
      }

      const actual = mapa.get(fecha);
      actual[severidad] = total;
    }

    return Array.from(mapa.values());
  }, [tendencias]);

  const alertaActivaPrincipal = useMemo(() => {
    if (!alertasActivasActualesDetalle.length) return null;

    const pesosSeveridad = {
      urgente: 5,
      critica: 4,
      alta: 3,
      media: 2,
      baja: 1
    };

    return [...alertasActivasActualesDetalle].sort((a, b) => {
      const severidadA = pesosSeveridad[String(a.severidad || '').toLowerCase()] || 0;
      const severidadB = pesosSeveridad[String(b.severidad || '').toLowerCase()] || 0;

      if (severidadA !== severidadB) return severidadB - severidadA;

      const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
      const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
      return fechaA - fechaB;
    })[0];
  }, [alertasActivasActualesDetalle]);

  const accionesSugeridas = useMemo(() => {
    if (!alertaActivaPrincipal) return [];

    const acciones = [];

    if (alertaActivaPrincipal.tipo) {
      acciones.push(`Validar causa raíz del evento ${capitalizar(alertaActivaPrincipal.tipo)}.`);
    }

    if (alertaActivaPrincipal.nombre) {
      acciones.push(`Revisar stock real y punto de reposición de ${alertaActivaPrincipal.nombre}.`);
    }

    if (recomendaciones[0]?.titulo) {
      acciones.push(recomendaciones[0].titulo);
    }

    acciones.push('Confirmar con cocina o compras que la contingencia ya fue atendida.');

    return acciones.slice(0, 4);
  }, [alertaActivaPrincipal, recomendaciones]);

  async function manejarMarcarLeida() {
    if (!alertaActivaPrincipal?.id || actionLock.current) return;
    actionLock.current = true;

    try {
      setAccionCargando('leida');
      setAccionError(null);
      setAccionOk(null);
      await marcarAlertaLeida(alertaActivaPrincipal.id);
      await recargar();
      setAccionOk('La alerta fue marcada como leída.');
    } catch (err) {
      setAccionError(err.message || 'No fue posible marcar la alerta como leída.');
    } finally {
      actionLock.current = false;
      setAccionCargando(null);
    }
  }

  async function manejarResolver() {
    if (!alertaActivaPrincipal?.id || actionLock.current) return;
    actionLock.current = true;

    try {
      setAccionCargando('resolver');
      setAccionError(null);
      setAccionOk(null);
      await resolverAlerta(alertaActivaPrincipal.id);
      await recargar();
      setAccionOk('La alerta fue resuelta correctamente.');
    } catch (err) {
      setAccionError(err.message || 'No fue posible resolver la alerta.');
    } finally {
      actionLock.current = false;
      setAccionCargando(null);
    }
  }

  if (rangoInvalido) {
    return (
      <div className="analiticas-vacio">
        Corrige el rango global para consultar alertas, SLA y criticidad del inventario.
      </div>
    );
  }

  if (loading) {
    return <div className="analiticas-loading">Cargando analítica de inventario…</div>;
  }

  if (error) {
    return <div className="analiticas-error" role="alert"><p>{error}</p><button type="button" className="aw-refresh" onClick={recargar}>Reintentar</button></div>;
  }

  return (
    <div className="analiticas-inventario">
      <section className="inventario-intro">
        <div>
          <span className="inventario-badge">Inventario operativo</span>
          <h2>Control de inventario</h2>
          <p>
            Revisa las alertas abiertas, los productos que necesitan reposición y los tiempos de atención.
          </p>
        </div>

        <div className="inventario-highlight">
          <div>
            <span>Alertas activas</span>
            <strong>{numero.format(metricas.alertasActivasActuales)}</strong>
          </div>
          <div>
            <span>Cumplimiento SLA</span>
            <strong>{numero.format(metricas.porcentajeCumplimientoSLA)}%</strong>
          </div>
          <div>
            <span>Promedio en riesgo</span>
            <strong>{numero.format(metricas.duracionPromedioHoras)} h</strong>
          </div>
        </div>
      </section>

      {metricas.alertasActivasActuales > 0 && (
        <section className="inventario-alerta-resumen">
          <div className="inventario-alerta-resumen-head">
            <div>
              <span className="inventario-alerta-kicker">Alerta activa prioritaria</span>
              <h3>
                {alertaActivaPrincipal?.nombre || 'Hay una alerta activa que requiere seguimiento'}
              </h3>
              <p>
                Resumen ejecutivo del riesgo más relevante abierto ahora mismo, pensado para tomar
                acción rápida sin revisar toda la auditoría.
              </p>
            </div>
            <div className="inventario-alerta-badge-wrap">
              <span
                className={`badge severidad-${String(alertaActivaPrincipal?.severidad || 'media').toLowerCase()}`}
              >
                {capitalizar(alertaActivaPrincipal?.severidad || 'media')}
              </span>
              <strong>{numero.format(metricas.alertasActivasActuales)} activa(s)</strong>
            </div>
          </div>

          <div className="inventario-alerta-resumen-grid">
            <article className="inventario-alerta-panel inventario-alerta-panel-main">
              <span>Qué está pasando</span>
              <strong>
                {capitalizar(alertaActivaPrincipal?.tipo) || 'Riesgo operativo detectado'}
              </strong>
              <p>
                {alertaActivaPrincipal?.nombre
                  ? `El ítem ${alertaActivaPrincipal.nombre} permanece con una alerta abierta y sigue afectando la salud operativa del inventario.`
                  : 'El sistema detectó una alerta abierta que sigue pendiente de resolución.'}
              </p>
            </article>

            <article className="inventario-alerta-panel">
              <span>Categoría</span>
              <strong>{alertaActivaPrincipal?.categoria || 'Sin categoría'}</strong>
              <p>Grupo del inventario al que pertenece el ítem afectado.</p>
            </article>

            <article className="inventario-alerta-panel">
              <span>Abierta desde</span>
              <strong>
                {alertaActivaPrincipal?.fecha
                  ? new Date(alertaActivaPrincipal.fecha).toLocaleString('es-CO')
                  : 'Sin registro'}
              </strong>
              <p>Momento en que el incidente quedó visible para operación.</p>
            </article>

            <article className="inventario-alerta-panel">
              <span>Estado actual</span>
              <strong>Sin resolver</strong>
              <p>
                {recomendaciones[0]?.titulo
                  ? `Sugerencia inmediata: ${recomendaciones[0].titulo}.`
                  : 'Requiere revisión del stock y validación operativa del equipo.'}
              </p>
            </article>

            <article className="inventario-alerta-panel inventario-alerta-panel-actions">
              <span>Gestión de alerta</span>
              <strong>Acciones rápidas del administrador</strong>
              <p>
                Ejecuta acciones de seguimiento sin salir del tablero. Cada cambio refresca el estado
                operativo del inventario.
              </p>

              <div className="inventario-alerta-actions">
                <button
                  type="button"
                  className="inventario-action-btn secondary"
                  onClick={manejarMarcarLeida}
                  disabled={accionCargando != null}
                >
                  {accionCargando === 'leida' ? 'Marcando…' : 'Marcar como leída'}
                </button>

                <button
                  type="button"
                  className="inventario-action-btn primary"
                  onClick={manejarResolver}
                  disabled={accionCargando != null}
                >
                  {accionCargando === 'resolver' ? 'Resolviendo…' : 'Resolver alerta'}
                </button>
              </div>

              {accionError && <div className="inventario-action-feedback error" role="alert">{accionError}</div>}
              {accionOk && <div className="inventario-action-feedback success" role="status">{accionOk}</div>}
            </article>

            <article className="inventario-alerta-panel inventario-alerta-panel-checklist">
              <span>Plan sugerido</span>
              <strong>Ruta recomendada de atención</strong>
              <div className="inventario-checklist">
                {accionesSugeridas.map((accion, index) => (
                  <div key={`${accion}-${index}`} className="inventario-check-item">
                    <i>{String(index + 1).padStart(2, '0')}</i>
                    <p>{accion}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      )}

      <section className="analiticas-inventario-kpis">
        <article className="inventario-kpi-card total">
          <span>Alertas del rango</span>
          <strong>{numero.format(metricas.totalAlertas)}</strong>
          <small>Eventos detectados en el período analizado</small>
        </article>

        <article className="inventario-kpi-card activas">
          <span>Alertas activas</span>
          <strong>{numero.format(metricas.alertasActivasActuales)}</strong>
          <small>Siguen abiertas en este momento</small>
        </article>

        <article className="inventario-kpi-card resueltas">
          <span>Alertas resueltas</span>
          <strong>{numero.format(metricas.alertasResueltas)}</strong>
          <small>Cerradas correctamente por el equipo</small>
        </article>

        <article className="inventario-kpi-card duracion">
          <span>Duración promedio</span>
          <strong>{numero.format(metricas.duracionPromedioHoras)} h</strong>
          <small>Tiempo medio desde apertura hasta resolución</small>
        </article>

        <article className="inventario-kpi-card sla">
          <span>Cumplimiento SLA</span>
          <strong>{numero.format(metricas.porcentajeCumplimientoSLA)}%</strong>
          <small>Objetivo operativo actual: {numero.format(metricas.slaHoras)} horas</small>
        </article>
      </section>

      <section className="inventario-grid">
        <article className="inventario-card inventario-card-wide">
          <div className="inventario-card-header">
            <div>
              <h3>Tendencia de alertas por severidad</h3>
              <p>Te muestra si el riesgo sube por volumen o por criticidad.</p>
            </div>
          </div>

          {tendenciasNormalizadas.length === 0 ? (
            <div className="analiticas-vacio">No hay alertas suficientes para construir tendencia en este rango.</div>
          ) : (
            <div className="inventario-chart">
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={tendenciasNormalizadas} margin={{ top: 18, right: 18, left: 2, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="4 8" stroke={chartTheme.grid} vertical={false} />
                  <XAxis dataKey="fecha" tickLine={false} axisLine={false} minTickGap={18} tick={{ fill: chartTheme.axis, fontSize: 12, fontWeight: 600 }} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={42} tick={{ fill: chartTheme.axis, fontSize: 12, fontWeight: 600 }} />
                  <Tooltip content={<TooltipInventario theme={chartTheme} />} cursor={{ fill: chartTheme.cursor }} />
                  <Bar dataKey="baja" name="Baja" stackId="alertas" fill={COLORES_SEVERIDAD.baja} radius={[10, 10, 0, 0]} stroke="rgba(255,255,255,0.42)" strokeWidth={1} />
                  <Bar dataKey="media" name="Media" stackId="alertas" fill={COLORES_SEVERIDAD.media} stroke="rgba(255,255,255,0.34)" strokeWidth={1} />
                  <Bar dataKey="alta" name="Alta" stackId="alertas" fill={COLORES_SEVERIDAD.alta} stroke="rgba(255,255,255,0.34)" strokeWidth={1} />
                  <Bar dataKey="critica" name="Crítica" stackId="alertas" fill={COLORES_SEVERIDAD.critica} />
                  <Bar dataKey="urgente" name="Urgente" stackId="alertas" fill={COLORES_SEVERIDAD.urgente} radius={[10, 10, 0, 0]} stroke="rgba(255,255,255,0.42)" strokeWidth={1} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="inventario-card inventario-card-list">
          <div className="inventario-card-header">
            <div>
              <h3>Productos críticos</h3>
              <p>Top 10 por repetición de alertas de severidad alta.</p>
            </div>
          </div>

          {productosCriticos.length === 0 ? (
            <div className="analiticas-vacio">No hay productos críticos en el rango seleccionado.</div>
          ) : (
            <div className="inventario-ranking">
              {productosCriticos.map((producto, index) => (
                <div key={`${producto.inventarioItemId}-${index}`} className="inventario-ranking-item">
                  <div className="inventario-ranking-order">{String(index + 1).padStart(2, '0')}</div>
                  <div className="inventario-ranking-copy">
                    <strong>{producto.nombre || 'Ítem sin nombre'}</strong>
                    <span>{producto.categoria || 'Sin categoría'}</span>
                  </div>
                  <div className="inventario-ranking-total">
                    {numero.format(producto.totalAlertas || 0)} alertas
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="inventario-card inventario-card-list">
          <div className="inventario-card-header">
            <div>
              <h3>Recomendaciones operativas</h3>
              <p>Acciones concretas calculadas con la situación actual del inventario.</p>
            </div>
          </div>

          {recomendaciones.length === 0 ? (
            <div className="analiticas-vacio">No hay recomendaciones activas por ahora. Buen síntoma operativo.</div>
          ) : (
            <div className="inventario-recomendaciones">
              {recomendaciones.map((recomendacion, index) => (
                <div key={`${recomendacion.titulo}-${index}`} className="inventario-recomendacion">
                  <strong>{recomendacion.titulo}</strong>
                  <p>{recomendacion.descripcion}</p>
                  <span>{recomendacion.impactoEstimado}</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="inventario-card">
        <div className="inventario-card-header">
          <div>
            <h3>Historial de alertas</h3>
            <p>Auditoría detallada para saber qué pasó, cuándo empezó y si ya fue resuelto.</p>
          </div>
        </div>

        {historial.length === 0 ? (
          <div className="analiticas-vacio">No hay alertas registradas en el rango seleccionado.</div>
        ) : (
          <div className="inventario-history">
            {historial.map((alerta) => (
              <div key={alerta.id} className="historial-item">
                <div className="historial-item-header">
                  <div className="historial-title">
                    <span
                      className={`badge severidad-${String(alerta.severidad || 'media').toLowerCase()}`}
                    >
                      {capitalizar(alerta.severidad)}
                    </span>
                    <strong>{alerta.nombre || 'Ítem desconocido'}</strong>
                  </div>
                  <span className={`historial-status ${alerta.resuelta ? 'resuelta' : 'activa'}`}>
                    {alerta.resuelta ? 'Resuelta' : 'Activa'}
                  </span>
                </div>

                <div className="historial-item-body">
                  <span>Tipo: {capitalizar(alerta.tipo)}</span>
                  <span>Categoría: {alerta.categoria || 'Sin categoría'}</span>
                  <span>
                    Inicio:{' '}
                    {alerta.fecha ? new Date(alerta.fecha).toLocaleString('es-CO') : 'Sin registro'}
                  </span>
                  <span>
                    Resolución:{' '}
                    {alerta.fechaResolucion
                      ? new Date(alerta.fechaResolucion).toLocaleString('es-CO')
                      : 'Pendiente'}
                  </span>
                  <span>
                    Duración: {alerta.duracionHoras != null ? `${numero.format(alerta.duracionHoras)} h` : 'Sin cierre'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
