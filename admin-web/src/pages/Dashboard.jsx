import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

import {
  FiActivity,
  FiArrowRight,
  FiDollarSign,
  FiPackage,
  FiShoppingCart,
  FiTrendingUp
} from 'react-icons/fi';

import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getAnaliticaPro, getDecisionHub, getKpis } from '../api/dashboardApi';
import DashboardKPIs from '../components/DashboardKPIs';
import { CHART_PALETTE, PAYMENT_COLORS, getChartTheme } from '../utils/chartTheme';
import '../styles/Dashboard.css';

const FILTROS = [
  { key: 'hoy', label: 'Hoy' },
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' }
];

const RANGO_DESCRIPCIONES = {
  hoy: 'hoy',
  '7d': 'los ultimos 7 dias',
  '30d': 'los ultimos 30 dias'
};

const fmt = (n) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(n || 0);

const fmtNum = (n) => new Intl.NumberFormat('es-CO').format(n || 0);
const fmtCompact = (n) => {
  const value = Number(n || 0);
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return fmt(value);
};

const pct = (value, total) => (!total ? 0 : (Number(value || 0) / total) * 100);

function KpiCard({ icon: Icon, label, value, sub, color = '#f57070', loading }) {
  return (
    <div className="db-kpi-card">
      <div className="db-kpi-card__icon" style={{ background: `${color}1a`, color }}>
        <Icon size={20} />
      </div>
      <div className="db-kpi-card__body">
        <p className="db-kpi-card__label">{label}</p>
        {loading ? (
          <div className="db-skeleton db-skeleton--value" />
        ) : (
          <p className="db-kpi-card__value">{value}</p>
        )}
        {sub && !loading && <p className="db-kpi-card__sub">{sub}</p>}
      </div>
    </div>
  );
}

function DecisionSummaryCard({ label, value, detail }) {
  return (
    <article className="db-ai-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [filtro, setFiltro] = useState('7d');
  const [kpis, setKpis] = useState(null);
  const [pro, setPro] = useState(null);
  const [decisionHub, setDecisionHub] = useState(null);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingPro, setLoadingPro] = useState(true);
  const [loadingDecisionHub, setLoadingDecisionHub] = useState(true);

  useEffect(() => {
    getKpis()
      .then((r) => setKpis(r.data?.data || null))
      .catch(() => setKpis(null))
      .finally(() => setLoadingKpis(false));
  }, []);

  useEffect(() => {
    getDecisionHub()
      .then((r) => setDecisionHub(r.data?.data || null))
      .catch(() => setDecisionHub(null))
      .finally(() => setLoadingDecisionHub(false));
  }, []);

  useEffect(() => {
    setLoadingPro(true);
    getAnaliticaPro(filtro)
      .then((r) => setPro(r.data?.data || null))
      .catch(() => setPro(null))
      .finally(() => setLoadingPro(false));
  }, [filtro]);

  const nombre = user?.nombre?.split(' ')[0] || 'Admin';
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos dias' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  const fechaHoy = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const panel = pro?.panel || null;
  const ventasPanel = panel?.ventas || pro?.ventas || [];
  const pedidosPorHoraPanel = panel?.pedidosPorHora || pro?.pedidosPorHora || [];
  const topProductosPanel = panel?.topProductos || pro?.topProductos || [];
  const metodosPagoPanel = panel?.metodosPago || pro?.metodosPago || [];

  const ventasTotales = panel?.kpis?.ventasTotales ?? pro?.kpis?.ventasTotales ?? 0;
  const pedidosTotales = panel?.kpis?.pedidosTotales ?? pro?.kpis?.pedidosTotales ?? 0;
  const ticketPromedio = panel?.kpis?.ticketPromedio ?? pro?.kpis?.ticketPromedio ?? 0;
  const productosActivos = kpis?.productosActivos ?? 0;
  const ventasHoy = kpis?.ventasHoy ?? 0;
  const pedidosHoy = kpis?.pedidosHoy ?? 0;
  const rangoActivoTexto = RANGO_DESCRIPCIONES[filtro] || 'el periodo seleccionado';
  const chartTheme = getChartTheme(isDark);
  const diasConVenta = ventasPanel.filter((item) => Number(item.total || 0) > 0).length;
  const promedioVentaDiaria = ventasPanel.length ? ventasTotales / ventasPanel.length : 0;
  const ventasExtendidas = ventasPanel.map((item) => ({
    ...item,
    total: Number(item.total || 0),
    promedio: promedioVentaDiaria
  }));
  const diaPico = ventasExtendidas.length
    ? ventasExtendidas.reduce((max, item) => (item.total > max.total ? item : max), ventasExtendidas[0])
    : null;
  const primeraVenta = ventasExtendidas[0]?.total || 0;
  const ultimaVenta = ventasExtendidas.at(-1)?.total || 0;
  const variacionPeriodo = primeraVenta ? ((ultimaVenta - primeraVenta) / primeraVenta) * 100 : 0;
  const pedidosHoraMax = Math.max(0, ...pedidosPorHoraPanel.map((item) => Number(item.pedidos || 0)));
  const pedidosPorHoraVisual = pedidosPorHoraPanel.map((item) => ({
    ...item,
    pedidos: Number(item.pedidos || 0),
    intensidad: pct(item.pedidos, pedidosHoraMax),
    esPico: Number(item.pedidos || 0) === pedidosHoraMax && pedidosHoraMax > 0
  }));
  const mejorHora = pedidosPorHoraVisual.find((item) => item.esPico);
  const totalPagos = metodosPagoPanel.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const metodosPagoVisual = metodosPagoPanel.map((item, idx) => ({
    ...item,
    valor: Number(item.valor || 0),
    porcentaje: pct(item.valor, totalPagos),
    color: PAYMENT_COLORS[idx % PAYMENT_COLORS.length]
  }));
  const metodoPrincipal = metodosPagoVisual.length
    ? metodosPagoVisual.reduce((max, item) => (item.valor > max.valor ? item : max), metodosPagoVisual[0])
    : null;
  const unidadesTopTotal = topProductosPanel.reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
  const chartTooltipStyle = {
    borderRadius: 14,
    border: `1px solid ${chartTheme.tooltipBorder}`,
    fontSize: 13,
    color: chartTheme.tooltipText,
    background: chartTheme.tooltipBackground,
    boxShadow: isDark
      ? '0 18px 40px rgba(2, 6, 23, 0.38)'
      : '0 18px 42px rgba(15, 23, 42, 0.12)'
  };
  const quickOpenProducts = () => navigate('/productos');
  const quickOpenPromotions = () => navigate('/promociones');
  const quickOpenAnalytics = () => navigate('/analiticas');

  const resolveDecisionAction = (item, group = 'productos') => {
    if (!item) return () => {};

    return () => {
      if (group === 'promociones' || item.kind === 'promocionar') {
        quickOpenPromotions();
        return;
      }

      if (group === 'analytics') {
        quickOpenAnalytics();
        return;
      }

      quickOpenProducts();
    };
  };
  const principalAction = decisionHub?.principalAction || null;
  const summary = decisionHub?.summary || null;

  return (
    <div className="dashboard-container">
      <section className="db-command-hero">
        <div className="db-command-hero__copy">
          <span className="db-command-hero__eyebrow">Centro de mando comercial</span>
          <h1>
            {saludo}, <span>{nombre}</span>
          </h1>
          <p>
            {fechaHoy}. Ventas, pedidos, ticket, picos operativos y metodos de pago en una vista ejecutiva para decidir rapido.
          </p>
          <div className="db-command-hero__chips">
            <span>{fmtCompact(ventasTotales)} en {rangoActivoTexto}</span>
            <span>{fmtNum(pedidosTotales)} pedidos</span>
            <span>{mejorHora ? `Pico ${mejorHora.hora}` : 'Sin pico horario'}</span>
          </div>
        </div>

        <div className="db-command-hero__panel">
          <span>Rendimiento del rango</span>
          <strong>{fmt(ventasTotales)}</strong>
          <p>
            Promedio diario {fmt(promedioVentaDiaria)} con {fmtNum(diasConVenta)} dias activos.
          </p>
          <div className="db-command-hero__meter">
            <i style={{ width: `${Math.min(100, pct(ultimaVenta, diaPico?.total || 0))}%` }} />
          </div>
          <small>
            {diaPico ? `Mejor dia: ${diaPico.fecha} con ${fmt(diaPico.total)}` : 'Aun sin ventas suficientes'}
          </small>
        </div>
      </section>

      <div className="db-header">
        <div className="db-header__left">
          <h2 className="db-header__title">Vista principal</h2>
          <p className="db-header__date">Filtro comercial activo para todos los indicadores del panel.</p>
        </div>
        <div className="db-header__right">
          <div className="db-filter-tabs">
            {FILTROS.map((f) => (
              <button
                key={f.key}
                className={`db-filter-tab${filtro === f.key ? ' db-filter-tab--active' : ''}`}
                onClick={() => setFiltro(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button className="db-btn-secondary" onClick={() => navigate('/analiticas')}>
            <FiTrendingUp size={14} />
            Analitica avanzada
          </button>
        </div>
      </div>

      <div className="db-kpi-grid">
        <KpiCard
          icon={FiDollarSign}
          label="Ventas del periodo"
          value={fmt(ventasTotales)}
          sub={`${fmtNum(pedidosTotales)} pedidos en ${rangoActivoTexto}`}
          color="#f57070"
          loading={loadingPro}
        />
        <KpiCard
          icon={FiShoppingCart}
          label="Pedidos del periodo"
          value={fmtNum(pedidosTotales)}
          color="#0ea5e9"
          loading={loadingPro}
        />
        <KpiCard
          icon={FiActivity}
          label="Ticket promedio"
          value={fmt(ticketPromedio)}
          color="#a78bfa"
          loading={loadingPro}
        />
        <KpiCard
          icon={FiPackage}
          label="Productos activos"
          value={fmtNum(productosActivos)}
          color="#22c55e"
          loading={loadingKpis}
        />
      </div>

      <div className="db-context-strip">
        <article className="db-context-card">
          <span>Base de calculo</span>
          <strong>Periodo filtrado</strong>
          <p>
            Este resumen usa el filtro activo y muestra solo pedidos no cancelados dentro de
            {` ${rangoActivoTexto}`}.
          </p>
        </article>

        <article className="db-context-card">
          <span>Punto comun con pedidos</span>
          <strong>{fmt(ventasHoy)} hoy</strong>
          <p>
            {fmtNum(pedidosHoy)} pedidos registrados hoy. Esta es la metrica compartida para
            comparar ambas vistas sin mezclar historico con periodo.
          </p>
        </article>

        <article className="db-context-card">
          <span>Diferencia con pedidos</span>
          <strong>Historico vs periodo</strong>
          <p>
            Pedidos muestra el acumulado historico del tablero operativo; aqui ves solo el
            rendimiento del rango seleccionado.
          </p>
        </article>
      </div>

      <section className="db-intelligence-strip">
        <article>
          <span>Ritmo comercial</span>
          <strong>{primeraVenta ? `${variacionPeriodo >= 0 ? '+' : ''}${variacionPeriodo.toFixed(1)}%` : '0%'}</strong>
          <p>Comparacion entre primer y ultimo punto del rango activo.</p>
        </article>
        <article>
          <span>Capacidad operativa</span>
          <strong>{mejorHora ? `${mejorHora.hora} hrs` : 'Sin datos'}</strong>
          <p>{mejorHora ? `${fmtNum(mejorHora.pedidos)} pedidos en el pico. Refuerza cocina y caja.` : 'Aun no hay suficiente demanda por hora.'}</p>
        </article>
        <article>
          <span>Pago dominante</span>
          <strong>{metodoPrincipal ? metodoPrincipal.metodo || 'Otro' : 'Sin pagos'}</strong>
          <p>{metodoPrincipal ? `${metodoPrincipal.porcentaje.toFixed(1)}% del ingreso del periodo.` : 'Cuando entren pagos aparecera la concentracion.'}</p>
        </article>
        <article>
          <span>Mix ganador</span>
          <strong>{topProductosPanel[0]?.nombre || 'Sin producto lider'}</strong>
          <p>{topProductosPanel[0] ? `${fmtNum(topProductosPanel[0].cantidad)} unidades del producto mas vendido.` : 'El ranking se activa con ventas.'}</p>
        </article>
      </section>

      <section className="db-ai-section">
        <div className="db-ai-hero">
          <div className="db-ai-hero__copy">
            <span className="db-ai-hero__eyebrow">Resumen comercial prioritario</span>
            <h2>El panel te muestra donde mover el negocio hoy</h2>
            <p>
              Aqui ves las jugadas con mas impacto para vender mejor, corregir a tiempo y empujar
              promociones con criterio comercial y operativo.
            </p>
            <div className="db-ai-hero__actions">
              <button type="button" className="db-ai-hero__primary" onClick={quickOpenAnalytics}>
                Ver analitica avanzada
                <FiArrowRight size={14} />
              </button>
              <button type="button" className="db-ai-hero__secondary" onClick={quickOpenPromotions}>
                Revisar promociones
              </button>
            </div>
            {summary ? (
              <div className="db-ai-summary-grid">
                <DecisionSummaryCard
                  label="Pedidos analizados"
                  value={fmtNum(summary.pedidosPeriodo)}
                  detail="Base real para detectar jugadas y riesgo."
                />
                <DecisionSummaryCard
                  label="Ticket promedio"
                  value={fmt(summary.ticketPromedio)}
                  detail="Sirve para orientar upsell y mix comercial."
                />
                <DecisionSummaryCard
                  label="Productos en riesgo"
                  value={fmtNum(summary.productosConRiesgo)}
                  detail="Lo que conviene corregir antes de seguir empujando."
                />
                <DecisionSummaryCard
                  label="Promos activas"
                  value={fmtNum(summary.promocionesActivas)}
                  detail="Promociones ya listas para reforzar conversion."
                />
              </div>
            ) : null}
          </div>

          <div className="db-ai-hero__panel">
            {loadingDecisionHub ? (
              <div className="db-skeleton db-skeleton--chart" />
            ) : principalAction ? (
              <>
                <span className="db-ai-hero__panel-kicker">Jugada principal</span>
                <strong>{principalAction.title}</strong>
                <p>{principalAction.description}</p>
                <div className="db-ai-hero__panel-meta">
                  {principalAction.metric ? <span>{principalAction.metric}</span> : null}
                  <span>Accion sugerida</span>
                  <span>Lista para preparar</span>
                </div>
                <button
                  type="button"
                  className="db-ai-hero__panel-cta"
                  onClick={resolveDecisionAction(principalAction, principalAction?.kind === 'promocionar' ? 'promociones' : 'analytics')}
                >
                  Ver detalle
                </button>
              </>
            ) : (
              <>
                <span className="db-ai-hero__panel-kicker">Panel listo</span>
                <strong>Senales listas para operar</strong>
                <p>
                  Cuando haya mas movimiento en ventas, este panel te mostrara automaticamente las
                  mejores jugadas para priorizar el siguiente movimiento del negocio.
                </p>
              </>
            )}
            <div className="db-ai-support-note">
              <span>Siguiente paso</span>
              <p>Abre la jugada, ajustala y conviertela en una accion concreta dentro de tu operacion.</p>
            </div>
          </div>
        </div>

      </section>

      <div className="db-charts-row">
        <div className="db-chart-card">
          <p className="db-chart-card__title">Ventas del periodo por dia</p>
          {loadingPro ? (
            <div className="db-skeleton db-skeleton--chart" />
          ) : !ventasPanel.length ? (
            <div className="db-empty-chart">Sin datos para el periodo</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={ventasExtendidas} margin={{ top: 18, right: 18, left: 4, bottom: 8 }}>
                <defs>
                  <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_PALETTE.revenue} stopOpacity={0.34} />
                    <stop offset="55%" stopColor={CHART_PALETTE.revenueSoft} stopOpacity={0.14} />
                    <stop offset="100%" stopColor={CHART_PALETTE.revenue} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradVentasStrokeMain" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={CHART_PALETTE.revenue} />
                    <stop offset="54%" stopColor={CHART_PALETTE.warning} />
                    <stop offset="100%" stopColor={CHART_PALETTE.teal} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 8" stroke={chartTheme.grid} vertical={false} />
                <XAxis
                  dataKey="fecha"
                  tick={{ fontSize: 12, fill: chartTheme.axis, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={18}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: chartTheme.axis, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={58}
                />
                <Tooltip
                  formatter={(v) => [fmt(v), 'Ventas del periodo']}
                  contentStyle={chartTooltipStyle}
                  cursor={{ stroke: CHART_PALETTE.revenue, strokeOpacity: 0.18 }}
                />
                {promedioVentaDiaria > 0 && (
                  <ReferenceLine y={promedioVentaDiaria} stroke={CHART_PALETTE.teal} strokeDasharray="8 8" strokeOpacity={0.78} />
                )}
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Ventas"
                  stroke="url(#gradVentasStrokeMain)"
                  strokeWidth={4.4}
                  fill="url(#gradVentas)"
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 3, stroke: chartTheme.surfaceStroke, fill: CHART_PALETTE.revenue }}
                  isAnimationActive
                  animationDuration={800}
                />
                <Line
                  type="monotone"
                  dataKey="promedio"
                  name="Promedio"
                  stroke={CHART_PALETTE.teal}
                  strokeWidth={2.3}
                  strokeDasharray="7 7"
                  dot={false}
                  activeDot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="db-chart-card">
          <p className="db-chart-card__title">Pedidos por hora</p>
          {loadingPro ? (
            <div className="db-skeleton db-skeleton--chart" />
          ) : !pedidosPorHoraPanel.length ? (
            <div className="db-empty-chart">Sin datos para el periodo</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={pedidosPorHoraVisual}
                margin={{ top: 18, right: 18, left: 4, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="gradPedidosHora" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_PALETTE.orders} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={CHART_PALETTE.ordersSoft} stopOpacity={0.78} />
                  </linearGradient>
                  <linearGradient id="gradPedidosHoraPico" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_PALETTE.revenue} />
                    <stop offset="100%" stopColor={CHART_PALETTE.warning} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 8" stroke={chartTheme.grid} vertical={false} />
                <XAxis
                  dataKey="hora"
                  tick={{ fontSize: 12, fill: chartTheme.axis, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={12}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: chartTheme.axis, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={42}
                />
                <Tooltip
                  formatter={(v) => [v, 'Pedidos']}
                  contentStyle={chartTooltipStyle}
                  cursor={{ fill: chartTheme.cursor }}
                />
                {pedidosHoraMax > 0 && (
                  <ReferenceLine y={pedidosHoraMax} stroke={CHART_PALETTE.revenue} strokeDasharray="6 8" strokeOpacity={0.38} />
                )}
                <Bar
                  dataKey="pedidos"
                  fill="url(#gradPedidosHora)"
                  radius={[12, 12, 4, 4]}
                  maxBarSize={46}
                  stroke="rgba(255,255,255,0.42)"
                  strokeWidth={1}
                >
                  {pedidosPorHoraVisual.map((entry, idx) => (
                    <Cell key={`${entry.hora}-${idx}`} fill={entry.esPico ? 'url(#gradPedidosHoraPico)' : 'url(#gradPedidosHora)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {!loadingPro && pedidosPorHoraVisual.length ? (
            <div className="db-hour-strip">
              {pedidosPorHoraVisual.map((item) => (
                <div key={`dash-hour-${item.hora}`} className={item.esPico ? 'is-peak' : ''}>
                  <span>{item.hora}</span>
                  <i style={{ width: `${Math.max(8, item.intensidad)}%` }} />
                  <strong>{fmtNum(item.pedidos)}</strong>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="db-bottom-row">
        <div className="db-chart-card db-chart-card--tall">
          <p className="db-chart-card__title">Top productos del periodo</p>
          {loadingPro ? (
            <div className="db-skeleton-list">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="db-skeleton db-skeleton--row" />
              ))}
            </div>
          ) : !topProductosPanel.length ? (
            <div className="db-empty-chart">Sin ventas registradas en el periodo</div>
          ) : (
            <ul className="db-top-list">
              {topProductosPanel.slice(0, 7).map((p, i) => {
                const itemPct = pct(p.cantidad, unidadesTopTotal || topProductosPanel[0]?.cantidad || 1);

                return (
                  <li key={p.nombre} className="db-top-list__item">
                    <span className="db-top-list__rank">#{i + 1}</span>
                    <div className="db-top-list__bar-wrap">
                      <p className="db-top-list__name">{p.nombre}</p>
                      <div className="db-top-list__track">
                        <div className="db-top-list__fill" style={{ width: `${Math.max(5, itemPct)}%` }} />
                      </div>
                    </div>
                    <span className="db-top-list__count">{fmtNum(p.cantidad)} <small>{itemPct.toFixed(1)}%</small></span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="db-chart-card db-chart-card--tall">
          <p className="db-chart-card__title">Metodos de pago</p>
          {loadingPro ? (
            <div className="db-skeleton db-skeleton--chart" />
          ) : !metodosPagoVisual.length ? (
            <div className="db-empty-chart">Sin pagos registrados</div>
          ) : (
            <div className="db-metodos-wrap">
              <div className="db-metodos-chart-shell">
                <ResponsiveContainer width="100%" height={236}>
                  <PieChart>
                    <Pie
                      data={metodosPagoVisual}
                      dataKey="valor"
                      nameKey="metodo"
                      cx="50%"
                      cy="50%"
                      innerRadius={66}
                      outerRadius={98}
                      paddingAngle={3}
                      cornerRadius={8}
                      stroke={chartTheme.surfaceStroke}
                      strokeWidth={4}
                    >
                      {metodosPagoVisual.map((item, idx) => (
                        <Cell
                          key={idx}
                          fill={item.color || PAYMENT_COLORS[idx % PAYMENT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [fmt(v), '']}
                      contentStyle={chartTooltipStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="db-metodos-total">
                  <span>Total pagos</span>
                  <strong>{fmt(totalPagos)}</strong>
                </div>
              </div>
              <ul className="db-metodos-legend">
                {metodosPagoVisual.map((m, idx) => (
                  <li key={m.metodo} className="db-metodos-legend__item">
                    <span
                      className="db-metodos-legend__dot"
                      style={{ background: m.color || PAYMENT_COLORS[idx % PAYMENT_COLORS.length] }}
                    />
                    <span className="db-metodos-legend__label">{m.metodo || 'Otro'}</span>
                    <span className="db-metodos-legend__val">{fmt(m.valor)} <small>{m.porcentaje.toFixed(1)}%</small></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="db-section">
        <div className="db-section__head">
          <p className="db-section__title">Estado del inventario</p>
          <p className="db-section__sub">Alertas y riesgo de stock</p>
        </div>
        <DashboardKPIs />
      </div>
    </div>
  );
}
