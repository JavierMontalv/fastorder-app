import { createElement, useContext, useEffect, useState } from 'react';
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
import { getChartTheme } from '../utils/chartTheme';
import '../styles/Dashboard.css';
import '../styles/DashboardWorkspace.css';

const CHART_PALETTE = {
  revenue: '#bf583c', revenueSoft: '#d9916d', teal: '#518165',
  warning: '#ba965b', orders: '#518165', ordersSoft: '#91b59a'
};
const PAYMENT_COLORS = ['#518165', '#bf583c', '#ba965b', '#6d8591', '#9c8096'];

const FILTROS = [
  { key: 'hoy', label: 'Hoy' },
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' }
];

const RANGO_DESCRIPCIONES = {
  hoy: 'hoy',
  '7d': 'los últimos 7 días',
  '30d': 'los últimos 30 días'
};

const fmt = (n) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(n || 0);

const fmtNum = (n) => new Intl.NumberFormat('es-CO').format(n || 0);
const pct = (value, total) => (!total ? 0 : (Number(value || 0) / total) * 100);

function KpiCard({ icon: Icon, label, value, sub, color = '#f57070', loading }) {
  return (
    <div className="db-kpi-card">
      <div className="db-kpi-card__icon" style={{ background: `${color}1a`, color }}>
        {createElement(Icon, { size: 20, 'aria-hidden': true })}
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

function ChartEmpty({ unavailable, text }) {
  return <div className="db-empty-chart"><FiActivity aria-hidden="true" size={20} />
    <strong>{unavailable ? 'No pudimos cargar estos datos' : text}</strong>
    <span>{unavailable ? 'Usa «Reintentar» para volver a consultar.' : 'Aquí verás la actividad cuando se registre en este período.'}</span>
  </div>;
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [filtro, setFiltro] = useState('7d');
  const [refresh, setRefresh] = useState(0);
  const [errors, setErrors] = useState({});
  const [kpis, setKpis] = useState(null);
  const [pro, setPro] = useState(null);
  const [decisionHub, setDecisionHub] = useState(null);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingPro, setLoadingPro] = useState(true);
  const [loadingDecisionHub, setLoadingDecisionHub] = useState(true);

  useEffect(() => {
    let current = true;
    getKpis()
      .then((r) => { if (current) setKpis(r.data?.data || null); })
      .catch(() => { if (current) { setKpis(null); setErrors((e) => ({ ...e, kpis: true })); } })
      .finally(() => { if (current) setLoadingKpis(false); });
    return () => { current = false; };
  }, [refresh]);

  useEffect(() => {
    let current = true;
    getDecisionHub()
      .then((r) => { if (current) setDecisionHub(r.data?.data || null); })
      .catch(() => { if (current) { setDecisionHub(null); setErrors((e) => ({ ...e, decisions: true })); } })
      .finally(() => { if (current) setLoadingDecisionHub(false); });
    return () => { current = false; };
  }, [refresh]);

  useEffect(() => {
    let current = true;
    getAnaliticaPro(filtro)
      .then((r) => { if (current) setPro(r.data?.data || null); })
      .catch(() => { if (current) { setPro(null); setErrors((e) => ({ ...e, pro: true })); } })
      .finally(() => { if (current) setLoadingPro(false); });
    return () => { current = false; };
  }, [filtro, refresh]);

  const nombre = user?.nombre?.split(' ')[0] || 'Admin';
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
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
  const selectFilter = (next) => {
    if (next === filtro) return;
    setLoadingPro(true);
    setPro(null);
    setErrors((e) => ({ ...e, pro: false }));
    setFiltro(next);
  };
  const retry = () => {
    setLoadingKpis(true);
    setLoadingPro(true);
    setLoadingDecisionHub(true);
    setErrors({});
    setRefresh((v) => v + 1);
  };

  return (
    <div className="dashboard-container dashboard-workspace">
      <header className="dw-welcome">
        <div><span className="dw-eyebrow">TU NEGOCIO, DE UN VISTAZO</span>
          <h1>{saludo}, <span>{nombre}.</span></h1>
          <p>{fechaHoy}</p>
        </div>
        <nav className="dw-actions" aria-label="Acciones rápidas">
          <button type="button" onClick={() => navigate('/productos?carga=rapida')}><FiPackage aria-hidden="true" /> Cargar productos</button>
          <button type="button" className="dw-primary" onClick={() => navigate('/pedidos')}>Ver pedidos <FiArrowRight aria-hidden="true" /></button>
        </nav>
      </header>

      {Object.values(errors).some(Boolean) && <div className="dw-error" role="alert">
        <span>Algunos datos no están disponibles. Los indicadores afectados aparecen sin valor.</span>
        <button type="button" onClick={retry} disabled={loadingPro || loadingKpis || loadingDecisionHub}>Reintentar</button>
      </div>}

      <section className="dw-overview" aria-labelledby="dw-overview-title" aria-busy={loadingPro}>
        <div className="db-header">
          <div><h2 id="dw-overview-title">Resumen del período</h2><p className="dw-muted">Ventas y pedidos no cancelados.</p></div>
          <div className="db-header__right">
            <div className="db-filter-tabs" role="group" aria-label="Período del resumen">
              {FILTROS.map((f) => <button type="button" key={f.key} aria-pressed={filtro === f.key}
                className={`db-filter-tab${filtro === f.key ? ' db-filter-tab--active' : ''}`}
                onClick={() => selectFilter(f.key)}>{f.label}</button>)}
            </div>
            <button type="button" className="dw-text-button" onClick={quickOpenAnalytics}>Ver analítica <FiArrowRight aria-hidden="true" /></button>
          </div>
        </div>
        <div className="db-kpi-grid">
          <KpiCard icon={FiDollarSign} label="Ventas del período" value={errors.pro ? '—' : fmt(ventasTotales)} sub={rangoActivoTexto} color="#b84d32" loading={loadingPro} />
          <KpiCard icon={FiShoppingCart} label="Pedidos del período" value={errors.pro ? '—' : fmtNum(pedidosTotales)} sub="No cancelados" color="#315f4b" loading={loadingPro} />
          <KpiCard icon={FiActivity} label="Ticket promedio" value={errors.pro ? '—' : fmt(ticketPromedio)} sub="Por pedido del período" color="#8a6332" loading={loadingPro} />
          <KpiCard icon={FiPackage} label="Productos activos" value={errors.kpis ? '—' : fmtNum(productosActivos)} sub="Estado actual de tu carta" color="#315f4b" loading={loadingKpis} />
        </div>
        <details className="dw-details">
          <summary>Cómo leer este resumen <span>Alcance e indicadores del período</span></summary>
          <div className="dw-details-body">
            <p>Las ventas, los pedidos, el ticket y los gráficos usan {rangoActivoTexto}. El tablero de Pedidos muestra el histórico operativo. Los productos activos corresponden al estado actual de tu carta.</p>
            <p>Hoy: <strong>{loadingKpis ? 'Cargando…' : errors.kpis ? 'No disponible' : `${fmt(ventasHoy)} · ${fmtNum(pedidosHoy)} pedidos`}</strong>.</p>
            {!loadingPro && !errors.pro && <dl className="dw-signals">
              <div><dt>Promedio diario</dt><dd>{fmt(promedioVentaDiaria)} · {fmtNum(diasConVenta)} días con ventas</dd></div>
              <div><dt>Ritmo de ventas</dt><dd>{primeraVenta ? `${variacionPeriodo >= 0 ? '+' : ''}${variacionPeriodo.toFixed(1)}%` : 'Sin base de comparación'}</dd></div>
              <div><dt>Hora con más pedidos</dt><dd>{mejorHora ? `${mejorHora.hora} · ${fmtNum(mejorHora.pedidos)} pedidos` : 'Sin datos'}</dd></div>
              <div><dt>Pago más utilizado</dt><dd>{metodoPrincipal ? `${metodoPrincipal.metodo || 'Otro'} · ${metodoPrincipal.porcentaje.toFixed(1)}%` : 'Sin pagos'}</dd></div>
              <div><dt>Producto más vendido</dt><dd>{topProductosPanel[0]?.nombre || 'Sin ventas'}</dd></div>
              <div><dt>Mejor día</dt><dd>{diaPico?.total > 0 ? `${diaPico.fecha} · ${fmt(diaPico.total)}` : 'Sin ventas'}</dd></div>
            </dl>}
            <small>El ritmo compara el primer y el último punto del rango. El promedio diario usa los puntos devueltos por la consulta.</small>
          </div>
        </details>
      </section>

      <section className="dw-next" aria-labelledby="dw-next-title">
        <div className="dw-next-copy"><span className="dw-eyebrow">SIGUIENTE PASO</span>
          <h2 id="dw-next-title">{loadingDecisionHub ? 'Revisando tu actividad…' : errors.decisions ? 'Tus herramientas siguen disponibles' : principalAction?.title || 'Tu carta, lista para crecer'}</h2>
          <p>{loadingDecisionHub ? 'Consultamos las oportunidades de tu negocio.' : errors.decisions ? 'No pudimos consultar las recomendaciones. Puedes continuar con tus productos y promociones.' : principalAction?.description || 'Actualiza tus productos, comparte tu menú y revisa tus primeras ventas aquí.'}</p>
          <div className="dw-next-links">
            {!loadingDecisionHub && principalAction && <button type="button" className="dw-text-button" onClick={resolveDecisionAction(principalAction, principalAction.kind === 'promocionar' ? 'promociones' : 'analytics')}>Ver detalle <FiArrowRight aria-hidden="true" /></button>}
            <button type="button" className="dw-text-button" onClick={quickOpenPromotions}>Revisar promociones <FiArrowRight aria-hidden="true" /></button>
          </div>
        </div>
        <div className="dw-next-summary">
          <span>Actividad comercial reciente</span>
          {loadingDecisionHub ? <p>Cargando…</p> : summary ? <dl>
            <div><dt>Pedidos analizados</dt><dd>{fmtNum(summary.pedidosPeriodo)}</dd></div>
            <div><dt>Ticket promedio</dt><dd>{fmt(summary.ticketPromedio)}</dd></div>
            <div><dt>Productos en riesgo</dt><dd>{fmtNum(summary.productosConRiesgo)}</dd></div>
            <div><dt>Promociones activas</dt><dd>{fmtNum(summary.promocionesActivas)}</dd></div>
          </dl> : <p>{errors.decisions ? 'Información no disponible.' : 'Las oportunidades aparecerán con la actividad de tu negocio.'}</p>}
          <small>Esta recomendación usa su propio período de análisis.</small>
        </div>
      </section>

      <div className="dw-section-heading"><div><h2>El movimiento de tu negocio</h2><p className="dw-muted">Detalle de {rangoActivoTexto}.</p></div></div>
      <div className="db-charts-row">
        <div className={`db-chart-card${!loadingPro && (errors.pro || !ventasPanel.length) ? ' dw-chart-empty' : ''}`}>
          <p className="db-chart-card__title">Ventas por día</p>
          {loadingPro ? (
            <div className="db-skeleton db-skeleton--chart" />
          ) : errors.pro || !ventasPanel.length ? (
            <ChartEmpty unavailable={errors.pro} text="Todavía no hay ventas" />
          ) : (
            <ResponsiveContainer width="100%" height={248}>
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

        <div className={`db-chart-card${!loadingPro && (errors.pro || !pedidosPorHoraPanel.length) ? ' dw-chart-empty' : ''}`}>
          <p className="db-chart-card__title">Pedidos por hora</p>
          {loadingPro ? (
            <div className="db-skeleton db-skeleton--chart" />
          ) : errors.pro || !pedidosPorHoraPanel.length ? (
            <ChartEmpty unavailable={errors.pro} text="Todavía no hay pedidos" />
          ) : (
            <ResponsiveContainer width="100%" height={248}>
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

        </div>
      </div>

      <div className="db-bottom-row">
        <div className={`db-chart-card${!loadingPro && (errors.pro || !topProductosPanel.length) ? ' dw-chart-empty' : ''}`}>
          <p className="db-chart-card__title">Productos más vendidos</p>
          {loadingPro ? (
            <div className="db-skeleton-list">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="db-skeleton db-skeleton--row" />
              ))}
            </div>
          ) : errors.pro || !topProductosPanel.length ? (
            <ChartEmpty unavailable={errors.pro} text="Tu ranking empieza con la primera venta" />
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

        <div className={`db-chart-card${!loadingPro && (errors.pro || !metodosPagoVisual.length) ? ' dw-chart-empty' : ''}`}>
          <p className="db-chart-card__title">Métodos de pago</p>
          {loadingPro ? (
            <div className="db-skeleton db-skeleton--chart" />
          ) : errors.pro || !metodosPagoVisual.length ? (
            <ChartEmpty unavailable={errors.pro} text="Todavía no hay pagos" />
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
