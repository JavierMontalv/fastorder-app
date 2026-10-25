import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { obtenerAnaliticaPro } from '../services/analiticasService';
import { useTheme } from '../context/ThemeContext';
import { PAYMENT_COLORS, getChartTheme } from '../utils/chartTheme';
import { analyticsQuery } from '../utils/analyticsWorkspace.mjs';
import '../styles/Estadisticas.css';

const moneda = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});

const numero = new Intl.NumberFormat('es-CO');
const decimal = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function porcentaje(valor, total) {
  if (!total) return 0;
  return (Number(valor || 0) / total) * 100;
}

function formatoCompactoCOP(valor) {
  const numeroValor = Number(valor || 0);
  if (numeroValor >= 1000000) return `$${decimal.format(numeroValor / 1000000)}M`;
  if (numeroValor >= 1000) return `$${decimal.format(numeroValor / 1000)}K`;
  return moneda.format(numeroValor);
}

function normalizarRespuesta(data) {
  return {
    ventas: Array.isArray(data?.ventas) ? data.ventas : [],
    pedidosPorHora: Array.isArray(data?.pedidosPorHora) ? data.pedidosPorHora : [],
    metodosPago: Array.isArray(data?.metodosPago) ? data.metodosPago : [],
    topProductos: Array.isArray(data?.topProductos) ? data.topProductos : [],
    kpis: {
      ventasTotales: Number(data?.kpis?.ventasTotales) || 0,
      pedidosTotales: Number(data?.kpis?.pedidosTotales) || 0,
      ticketPromedio: Number(data?.kpis?.ticketPromedio) || 0,
      productosVendidos: Number(data?.kpis?.productosVendidos) || 0
    },
    ia: {
      nombreRestaurante: data?.ia?.nombreRestaurante || '',
      plan: data?.ia?.plan || 'base',
      planNombre: data?.ia?.planNombre || 'Plan Base',
      estado: data?.ia?.estado || 'desconocido',
      motivo: data?.ia?.motivo || '',
      puedeConsumir: Boolean(data?.ia?.puedeConsumir),
      puedeConfigurar: Boolean(data?.ia?.puedeConfigurar),
      consumoActual: Number(data?.ia?.consumoActual) || 0,
      limiteMes: Number(data?.ia?.limiteMes) || 0,
      presupuestoUSD: Number(data?.ia?.presupuestoUSD) || 0,
      presupuestoCOP: Number(data?.ia?.presupuestoCOP) || 0,
      costoUSD: Number(data?.ia?.costoUSD) || 0,
      costoCOP: Number(data?.ia?.costoCOP) || 0,
      restanteUSD: Number(data?.ia?.restanteUSD) || 0,
      restanteCOP: Number(data?.ia?.restanteCOP) || 0,
      porcentajePresupuesto: Number(data?.ia?.porcentajePresupuesto) || 0,
      ejecuciones: Number(data?.ia?.ejecuciones) || 0,
      tokensTotal: Number(data?.ia?.tokensTotal) || 0,
      ratioCostoPlan: Number(data?.ia?.ratioCostoPlan) || 0,
      funcionesDisponibles: Array.isArray(data?.ia?.funcionesDisponibles) ? data.ia.funcionesDisponibles : []
    }
  };
}

function CustomTooltip({ active, payload, label, theme }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="estadisticas-tooltip"
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
          <b>
            {item.dataKey === 'total' || item.dataKey === 'valor' || item.dataKey === 'promedio'
              ? moneda.format(item.value || 0)
              : typeof item.value === 'number'
                ? numero.format(item.value)
                : item.value}
          </b>
        </div>
      ))}
    </div>
  );
}

export default function Estadisticas({ presetRango, fechaInicio, fechaFin, rangoInvalido }) {
  const { isDark } = useTheme();
  const [analytics, setAnalytics] = useState(() => normalizarRespuesta());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function cargar() {
      if (rangoInvalido) return;

      try {
        setLoading(true);
        setError(null);

        const { data } = await obtenerAnaliticaPro(analyticsQuery({ presetRango, fechaInicio, fechaFin }));

        if (!isMounted) return;
        setAnalytics(normalizarRespuesta(data?.data));
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'No fue posible cargar la analítica comercial.');
        setAnalytics(normalizarRespuesta());
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    cargar();

    return () => {
      isMounted = false;
    };
  }, [presetRango, fechaInicio, fechaFin, rangoInvalido, revision]);

  const mejorHora = useMemo(() => {
    if (!analytics.pedidosPorHora.length) return 'Sin picos detectados';

    const maximo = analytics.pedidosPorHora.reduce((acumulado, actual) =>
      Number(actual.pedidos) > Number(acumulado.pedidos) ? actual : acumulado
    );

    return `${maximo.hora} con ${numero.format(maximo.pedidos)} pedidos`;
  }, [analytics.pedidosPorHora]);

  const metodoTop = useMemo(() => {
    if (!analytics.metodosPago.length) return 'Sin pagos registrados';

    const maximo = analytics.metodosPago.reduce((acumulado, actual) =>
      Number(actual.valor) > Number(acumulado.valor) ? actual : acumulado
    );

    return `${maximo.metodo || 'No definido'} lidera con ${moneda.format(maximo.valor)}`;
  }, [analytics.metodosPago]);

  const participacionTopProducto = useMemo(() => {
    if (!analytics.topProductos.length || !analytics.kpis.productosVendidos) return 'Sin suficiente histórico';

    const top = analytics.topProductos[0];
    const porcentaje = (Number(top.cantidad || 0) / analytics.kpis.productosVendidos) * 100;

    return `${top.nombre || 'Producto líder'} aporta ${porcentaje.toFixed(1)}% del volumen`;
  }, [analytics.topProductos, analytics.kpis.productosVendidos]);

  const estadoIATexto = useMemo(() => {
    const labels = {
      activa: 'Disponible',
      trial: 'Disponible en modo prueba',
      agotada: 'Presupuesto mensual agotado',
      desactivada: 'Desactivada por configuración',
      bloqueada: 'Bloqueada para este restaurante'
    };

    return labels[analytics.ia.estado] || analytics.ia.motivo || 'Sin estado disponible';
  }, [analytics.ia.estado, analytics.ia.motivo]);

  const chartTheme = useMemo(() => getChartTheme(isDark), [isDark]);

  const ventasPromedio = useMemo(() => {
    if (!analytics.ventas.length) return 0;
    return analytics.ventas.reduce((total, item) => total + Number(item.total || 0), 0) / analytics.ventas.length;
  }, [analytics.ventas]);

  const ventasExtendidas = useMemo(
    () =>
      analytics.ventas.map((item) => ({
        ...item,
        total: Number(item.total || 0),
        promedio: ventasPromedio
      })),
    [analytics.ventas, ventasPromedio]
  );

  const diaPico = useMemo(() => {
    if (!ventasExtendidas.length) return null;
    return ventasExtendidas.reduce((maximo, item) => (item.total > maximo.total ? item : maximo), ventasExtendidas[0]);
  }, [ventasExtendidas]);

  const ultimaVenta = ventasExtendidas.at(-1)?.total || 0;
  const primeraVenta = ventasExtendidas[0]?.total || 0;
  const variacionVentas = primeraVenta > 0 ? ((ultimaVenta - primeraVenta) / primeraVenta) * 100 : 0;

  const pedidosPorHoraVisual = useMemo(() => {
    const maximo = Math.max(0, ...analytics.pedidosPorHora.map((item) => Number(item.pedidos || 0)));
    return analytics.pedidosPorHora.map((item) => ({
      ...item,
      pedidos: Number(item.pedidos || 0),
      intensidad: maximo ? porcentaje(item.pedidos, maximo) : 0,
      esPico: Number(item.pedidos || 0) === maximo && maximo > 0
    }));
  }, [analytics.pedidosPorHora]);

  const pedidosHoraMax = useMemo(
    () => Math.max(0, ...pedidosPorHoraVisual.map((item) => Number(item.pedidos || 0))),
    [pedidosPorHoraVisual]
  );

  const metodosPagoTotal = useMemo(
    () => analytics.metodosPago.reduce((total, item) => total + Number(item.valor || 0), 0),
    [analytics.metodosPago]
  );

  const metodosPagoVisual = useMemo(
    () =>
      analytics.metodosPago.map((item, index) => ({
        ...item,
        valor: Number(item.valor || 0),
        porcentaje: porcentaje(item.valor, metodosPagoTotal),
        color: PAYMENT_COLORS[index % PAYMENT_COLORS.length]
      })),
    [analytics.metodosPago, metodosPagoTotal]
  );

  const metodoPrincipal = metodosPagoVisual[0]
    ? metodosPagoVisual.reduce((maximo, item) => (item.valor > maximo.valor ? item : maximo), metodosPagoVisual[0])
    : null;

  const topProductosVisual = useMemo(() => {
    const total = analytics.topProductos.reduce((acumulado, item) => acumulado + Number(item.cantidad || 0), 0);
    return analytics.topProductos.map((item) => ({
      ...item,
      cantidad: Number(item.cantidad || 0),
      participacion: porcentaje(item.cantidad, total || analytics.kpis.productosVendidos)
    }));
  }, [analytics.topProductos, analytics.kpis.productosVendidos]);

  if (rangoInvalido) {
    return (
      <div className="estadisticas-state">
        Corrige el rango global para consultar ventas, pedidos y comportamiento comercial.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="estadisticas-loading">
        <div className="loading-spinner" />
        <p>Cargando estadísticas comerciales…</p>
      </div>
    );
  }

  if (error) {
    return <div className="estadisticas-state estadisticas-state-error" role="alert"><p>{error}</p><button type="button" className="aw-refresh" onClick={() => setRevision(value => value + 1)}>Reintentar</button></div>;
  }

  return (
    <div className="estadisticas-container">
      <div className="estadisticas-header">
        <div>
          <span className="estadisticas-badge">Ventas y pedidos</span>
          <h2>Panorama comercial del restaurante</h2>
          <p>Lo que más vende, cómo están pagando tus clientes y a qué hora se concentra la demanda.</p>
        </div>

        <div className="estadisticas-summary">
          <div>
            <span>Mejor hora</span>
            <strong>{mejorHora}</strong>
          </div>
          <div>
            <span>Medio líder</span>
            <strong>{metodoTop}</strong>
          </div>
          <div>
            <span>Producto estrella</span>
            <strong>{participacionTopProducto}</strong>
          </div>
        </div>
      </div>

      <div className="estadisticas-kpis">
        <article className="estadisticas-kpi-card ventas">
          <span>Ventas del rango</span>
          <strong>{moneda.format(analytics.kpis.ventasTotales)}</strong>
          <small>Ingresos cobrados en el período</small>
        </article>

        <article className="estadisticas-kpi-card pedidos">
          <span>Pedidos pagados</span>
          <strong>{numero.format(analytics.kpis.pedidosTotales)}</strong>
          <small>Órdenes efectivamente cerradas</small>
        </article>

        <article className="estadisticas-kpi-card ticket">
          <span>Ticket promedio</span>
          <strong>{moneda.format(analytics.kpis.ticketPromedio)}</strong>
          <small>Valor promedio por pedido</small>
        </article>

        <article className="estadisticas-kpi-card productos">
          <span>Unidades vendidas</span>
          <strong>{numero.format(analytics.kpis.productosVendidos)}</strong>
          <small>Suma total de productos despachados</small>
        </article>
      </div>

      <section className="estadisticas-insight-grid">
        <article className="estadisticas-insight-card accent-sales">
          <span>Lectura comercial</span>
          <strong>{diaPico ? `${diaPico.fecha} fue el mejor día` : 'Sin ventas suficientes'}</strong>
          <p>{diaPico ? `Pico de ${moneda.format(diaPico.total)} frente a un promedio de ${moneda.format(ventasPromedio)}.` : 'Aún no hay suficientes puntos para leer tendencia.'}</p>
        </article>
        <article className="estadisticas-insight-card accent-demand">
          <span>Demanda por hora</span>
          <strong>{pedidosHoraMax ? mejorHora : 'Sin concentración horaria'}</strong>
          <p>Usa este pico para reforzar cocina, caja y entrega en la franja con mayor carga.</p>
        </article>
        <article className="estadisticas-insight-card accent-payment">
          <span>Concentración de pago</span>
          <strong>{metodoPrincipal ? `${metodoPrincipal.metodo || 'No definido'} ${metodoPrincipal.porcentaje.toFixed(1)}%` : 'Sin pagos'}</strong>
          <p>{metodoPrincipal ? `${moneda.format(metodoPrincipal.valor)} del ingreso pasa por este medio.` : 'Cuando entren pagos, aquí se verá el canal dominante.'}</p>
        </article>
      </section>

      <details className="aw-ai"><summary>Consumo de IA <span>Este mes · {analytics.ia.planNombre}</span></summary>
<section className="estadisticas-ia-strip">
        <article className="estadisticas-ia-hero">
          <span className="estadisticas-badge">Consumo mensual de IA</span>
          <h3>{analytics.ia.planNombre}</h3>
          <p>
            {analytics.ia.nombreRestaurante || 'Tu restaurante'} ha consumido <strong>USD {decimal.format(analytics.ia.costoUSD)}</strong> de un
            presupuesto mensual de <strong>USD {decimal.format(analytics.ia.presupuestoUSD)}</strong>.
          </p>

          <div className="estadisticas-ia-progress">
            <div className="estadisticas-ia-progress-track">
              <div
                className={`estadisticas-ia-progress-fill ${
                  analytics.ia.porcentajePresupuesto >= 90
                    ? 'danger'
                    : analytics.ia.porcentajePresupuesto >= 70
                      ? 'warn'
                      : ''
                }`}
                style={{ width: `${Math.max(0, Math.min(100, analytics.ia.porcentajePresupuesto))}%` }}
              />
            </div>
            <strong>{Math.max(0, Math.min(100, analytics.ia.porcentajePresupuesto)).toFixed(1)}% del presupuesto mensual</strong>
          </div>

          <div className="estadisticas-ia-inline-stats">
            <div>
              <span>Estado</span>
              <strong>{estadoIATexto}</strong>
            </div>
            <div>
              <span>Saldo</span>
              <strong>{moneda.format(analytics.ia.restanteCOP)}</strong>
            </div>
            <div>
              <span>Ratio costo / plan</span>
              <strong>{decimal.format(analytics.ia.ratioCostoPlan)}%</strong>
            </div>
          </div>
        </article>

        <div className="estadisticas-ia-kpis">
          <article className="estadisticas-ia-mini-card">
            <span>Ejecuciones IA</span>
            <strong>{numero.format(analytics.ia.ejecuciones)}</strong>
            <small>Consultas y automatizaciones ejecutadas este mes</small>
          </article>

          <article className="estadisticas-ia-mini-card">
            <span>Tokens procesados</span>
            <strong>{numero.format(analytics.ia.tokensTotal)}</strong>
            <small>Consumo registrado este mes</small>
          </article>

          <article className="estadisticas-ia-mini-card">
            <span>Costo real en COP</span>
            <strong>{moneda.format(analytics.ia.costoCOP)}</strong>
            <small>Lo que ya costaron tus herramientas IA</small>
          </article>

          <article className="estadisticas-ia-mini-card">
            <span>Funciones activas</span>
            <strong>{numero.format(analytics.ia.funcionesDisponibles.length)}</strong>
            <small>{analytics.ia.funcionesDisponibles.map(name => ({ mejorarDescripcion: 'Mejorar descripciones', generarDescripcion: 'Crear descripciones', sugerirPrecio: 'Sugerir precios', sugerirCombos: 'Sugerir combos', traducirMenu: 'Traducir menú', soporteIA: 'Asistente de soporte', propuestaCatalogoIA: 'Organizar catálogo' }[name] || name)).join(' · ') || 'Sin funciones disponibles'}</small>
          </article>
        </div>
      </section>
      </details>

      <div className="estadisticas-grid">
        <article className="estadisticas-card estadisticas-card-large">
          <div className="estadisticas-card-header">
            <div>
              <h3>Tendencia de ventas</h3>
              <p>Curva diaria del monto vendido en el rango seleccionado.</p>
            </div>
            <div className="estadisticas-chart-metrics">
              <div>
                <span>Promedio</span>
                <strong>{formatoCompactoCOP(ventasPromedio)}</strong>
              </div>
              <div>
                <span>Último día</span>
                <strong>{formatoCompactoCOP(ultimaVenta)}</strong>
              </div>
              <div className={variacionVentas >= 0 ? 'positive' : 'negative'}>
                <span>Variación</span>
                <strong>{primeraVenta ? `${variacionVentas >= 0 ? '+' : ''}${variacionVentas.toFixed(1)}%` : 'Sin base'}</strong>
              </div>
            </div>
          </div>

          <div className="estadisticas-chart">
            {ventasExtendidas.length === 0 ? <div className="estadisticas-empty">No hay ventas registradas en este rango. Prueba otro período.</div> : <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={ventasExtendidas} margin={{ top: 18, right: 20, left: 4, bottom: 8 }}>
                <defs>
                  <linearGradient id="estadisticasVentasGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b94b30" stopOpacity={0.46} />
                    <stop offset="58%" stopColor="#d5b196" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="#b94b30" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="estadisticasVentasStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#b94b30" />
                    <stop offset="48%" stopColor="#b94b30" />
                    <stop offset="100%" stopColor="#547c59" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 8" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="fecha" tickLine={false} axisLine={false} minTickGap={18} tick={{ fill: chartTheme.axis, fontSize: 12, fontWeight: 800 }} />
                <YAxis
                  tickFormatter={(value) => formatoCompactoCOP(value)}
                  tickLine={false}
                  axisLine={false}
                  width={72}
                  tick={{ fill: chartTheme.axis, fontSize: 12, fontWeight: 800 }}
                />
                <Tooltip content={<CustomTooltip theme={chartTheme} />} cursor={{ stroke: '#b94b30', strokeOpacity: 0.2 }} />
                {ventasPromedio > 0 && (
                  <ReferenceLine
                    y={ventasPromedio}
                    stroke="#547c59"
                    strokeDasharray="8 8"
                    strokeOpacity={0.8}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Ventas"
                  stroke="url(#estadisticasVentasStroke)"
                  strokeWidth={4.4}
                  fill="url(#estadisticasVentasGradient)"
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 3, stroke: chartTheme.surfaceStroke, fill: '#b94b30' }}
                  isAnimationActive
                  animationDuration={800}
                />
                <Line
                  type="monotone"
                  dataKey="promedio"
                  name="Promedio"
                  stroke="#547c59"
                  strokeWidth={2.4}
                  strokeDasharray="7 7"
                  dot={false}
                  activeDot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>}
          </div>
        </article>

        <article className="estadisticas-card">
          <div className="estadisticas-card-header">
            <div>
              <h3>Pedidos por hora</h3>
              <p>Identifica la franja más exigente para cocina y servicio.</p>
            </div>
          </div>

          <div className="estadisticas-chart">
            {pedidosPorHoraVisual.length === 0 ? <div className="estadisticas-empty">No hay pedidos registrados por hora en este rango.</div> : <ResponsiveContainer width="100%" height={320}>
              <BarChart data={pedidosPorHoraVisual} margin={{ top: 18, right: 16, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="estadisticasPedidosGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#547c59" stopOpacity={0.98} />
                    <stop offset="100%" stopColor="#a8c2a1" stopOpacity={0.64} />
                  </linearGradient>
                  <linearGradient id="estadisticasPedidosPico" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b94b30" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 8" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="hora" tickLine={false} axisLine={false} minTickGap={12} tick={{ fill: chartTheme.axis, fontSize: 12, fontWeight: 800 }} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={42} tick={{ fill: chartTheme.axis, fontSize: 12, fontWeight: 800 }} />
                <Tooltip content={<CustomTooltip theme={chartTheme} />} cursor={{ fill: chartTheme.cursor }} />
                {pedidosHoraMax > 0 && <ReferenceLine y={pedidosHoraMax} stroke="#b94b30" strokeDasharray="6 8" strokeOpacity={0.38} />}
                <Bar
                  dataKey="pedidos"
                  name="Pedidos"
                  fill="url(#estadisticasPedidosGradient)"
                  radius={[12, 12, 4, 4]}
                  maxBarSize={46}
                  stroke="rgba(255,255,255,0.42)"
                  strokeWidth={1}
                >
                  {pedidosPorHoraVisual.map((entry, index) => (
                    <Cell key={`${entry.hora}-${index}`} fill={entry.esPico ? 'url(#estadisticasPedidosPico)' : 'url(#estadisticasPedidosGradient)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>}
          </div>

          <div className="estadisticas-hour-heatmap" aria-label="Intensidad de pedidos por hora">
            {pedidosPorHoraVisual.map((item) => (
              <div key={`heat-${item.hora}`} className={item.esPico ? 'is-peak' : ''}>
                <span>{item.hora}</span>
                <i style={{ width: `${Math.max(8, item.intensidad)}%` }} />
                <strong>{numero.format(item.pedidos)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="estadisticas-card">
          <div className="estadisticas-card-header">
            <div>
              <h3>Métodos de pago</h3>
              <p>Distribución de ingreso por cada forma de pago utilizada.</p>
            </div>
          </div>

          <div className="estadisticas-payment-layout">
            <div className="estadisticas-payment-chart" hidden={!metodosPagoVisual.length}>
              <ResponsiveContainer width="100%" height={270}>
                <PieChart>
                  <Pie
                    data={metodosPagoVisual}
                    dataKey="valor"
                    nameKey="metodo"
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={112}
                    paddingAngle={4}
                    cornerRadius={10}
                    stroke={chartTheme.surfaceStroke}
                    strokeWidth={4}
                  >
                    {metodosPagoVisual.map((entry, index) => (
                      <Cell key={`${entry.metodo}-${index}`} fill={entry.color || PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip theme={chartTheme} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="estadisticas-donut-center">
                <span>Total</span>
                <strong>{formatoCompactoCOP(metodosPagoTotal)}</strong>
              </div>
            </div>

            <div className="estadisticas-payment-legend">
              {metodosPagoVisual.length === 0 ? (
                <div className="estadisticas-empty">Sin métodos de pago en este rango.</div>
              ) : (
                metodosPagoVisual.map((metodo) => (
                  <div key={metodo.metodo || metodo.color} className="estadisticas-payment-row">
                    <div className="estadisticas-payment-row-top">
                      <span><i style={{ background: metodo.color }} />{metodo.metodo || 'No definido'}</span>
                      <strong>{metodo.porcentaje.toFixed(1)}%</strong>
                    </div>
                    <div className="estadisticas-payment-bar">
                      <i style={{ width: `${Math.max(4, metodo.porcentaje)}%`, background: metodo.color }} />
                    </div>
                    <small>{moneda.format(metodo.valor)}</small>
                  </div>
                ))
              )}
            </div>
          </div>
        </article>

        <article className="estadisticas-card estadisticas-card-list">
          <div className="estadisticas-card-header">
            <div>
              <h3>Top productos</h3>
              <p>Ranking real según unidades vendidas en el período.</p>
            </div>
          </div>

          {analytics.topProductos.length === 0 ? (
            <div className="estadisticas-empty">Todavía no hay productos vendidos en el rango seleccionado.</div>
          ) : (
            <div className="estadisticas-ranking">
              {topProductosVisual.map((producto, index) => (
                <div key={`${producto.nombre}-${index}`} className="estadisticas-ranking-item">
                  <div className="estadisticas-ranking-position">{String(index + 1).padStart(2, '0')}</div>
                  <div className="estadisticas-ranking-copy">
                    <div>
                      <strong>{producto.nombre || 'Producto sin nombre'}</strong>
                      <span>{numero.format(producto.cantidad)} unidades despachadas</span>
                    </div>
                    <small>{producto.participacion.toFixed(1)}% de este ranking</small>
                    <div className="estadisticas-ranking-progress">
                      <i style={{ width: `${Math.max(5, producto.participacion)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
