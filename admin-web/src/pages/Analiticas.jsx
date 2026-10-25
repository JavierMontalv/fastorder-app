import { useContext, useEffect, useMemo, useState } from 'react';
import AnaliticasInventario from './AnaliticasInventario';
import Estadisticas from './Estadisticas';
import dashboardConfig from '../config/dashboardConfig';
import { AuthContext } from '../context/AuthContext';
import { analyticsRange, analyticsRangeError } from '../utils/analyticsWorkspace.mjs';
import '../styles/Analiticas.css';
import '../styles/AnaliticasWorkspace.css';

const TABS = [
  { key: 'estadisticas', label: 'Ventas y pedidos', description: 'Ventas, ticket promedio, pagos y productos.' },
  { key: 'inventario', label: 'Inventario', description: 'Alertas, reposición y tiempos de atención.' }
];

function rangeLabel(range) {
  if (range.presetRango === '7d') return 'Últimos 7 días';
  if (range.presetRango === '30d') return 'Últimos 30 días';
  return `${range.fechaInicio} al ${range.fechaFin}`;
}

export default function Analiticas() {
  const auth = useContext(AuthContext) || {};
  const usuario = auth.usuario || auth.user;
  const role = usuario?.rol || usuario?.role;
  const [tabActiva, setTabActiva] = useState('estadisticas');
  const [range, setRange] = useState(() => analyticsRange());
  const [preset, setPreset] = useState('7d');
  const [draft, setDraft] = useState(() => analyticsRange());
  const [rangeError, setRangeError] = useState('');
  const [revision, setRevision] = useState(0);
  const tabs = useMemo(() => TABS.filter(tab => tab.key !== 'inventario' || !role || (dashboardConfig?.inventario?.roles || []).includes(role)), [role]);
  const active = tabs.some(tab => tab.key === tabActiva) ? tabActiva : tabs[0]?.key;
  const scope = usuario?.sedeActivaId || usuario?.restauranteId || '';

  useEffect(() => {
    const changed = () => setRevision(value => value + 1);
    window.addEventListener('comanda:sede-changed', changed);
    return () => window.removeEventListener('comanda:sede-changed', changed);
  }, []);

  function selectPreset(value) {
    setPreset(value);
    setRangeError('');
    if (value !== 'custom') setRange(analyticsRange(value));
  }

  function applyRange(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const start = String(values.get('desde') || ''), end = String(values.get('hasta') || '');
    setDraft({ fechaInicio: start, fechaFin: end });
    const error = analyticsRangeError(start, end);
    setRangeError(error);
    if (!error) setRange({ presetRango: 'custom', fechaInicio: start, fechaFin: end, rangoInvalido: false });
  }

  return <div className="analiticas-page analiticas-workspace">
    <header className="analiticas-hero">
      <div className="analiticas-hero-copy"><span className="analiticas-eyebrow">Tu negocio en perspectiva</span><h1 className="analiticas-title">Analítica</h1><p className="analiticas-subtitle">Entiende tus ventas, anticipa la demanda y cuida tu inventario.</p></div>
      <div className="aw-range-label"><span>Rango aplicado</span><strong role="status">{rangeLabel(range)}</strong><small>{range.fechaInicio} — {range.fechaFin}</small></div>
    </header>
    <section className="analiticas-toolbar" aria-label="Rango de análisis">
      <div className="aw-toolbar-row"><div className="analiticas-rango">
        {[['7d', '7 días'], ['30d', '30 días'], ['custom', 'Personalizado']].map(([value, label]) => <button key={value} type="button" aria-pressed={preset === value} className={`analiticas-chip ${preset === value ? 'active' : ''}`} onClick={() => selectPreset(value)}>{label}</button>)}
      </div><button type="button" className="aw-refresh" onClick={() => setRevision(value => value + 1)}>Actualizar datos</button></div>
      {preset === 'custom' && <form className="analiticas-rango-custom" onSubmit={applyRange} noValidate>
        <label>Desde<input type="date" name="desde" value={draft.fechaInicio} onChange={event => setDraft(value => ({ ...value, fechaInicio: event.target.value }))} /></label>
        <label>Hasta<input type="date" name="hasta" value={draft.fechaFin} onChange={event => setDraft(value => ({ ...value, fechaFin: event.target.value }))} /></label>
        <button type="submit" className="aw-apply">Aplicar rango</button><p>El rango se aplica a ambos módulos. El consumo de IA corresponde al mes actual.</p>
      </form>}
      {rangeError && <div className="analiticas-rango-error" role="alert">{rangeError} Se conserva el rango aplicado.</div>}
    </section>
    <nav className="analiticas-tabs" aria-label="Módulo de analítica">{tabs.map(tab => <button key={tab.key} type="button" aria-pressed={active === tab.key} className={`analiticas-tab ${active === tab.key ? 'active' : ''}`} onClick={() => setTabActiva(tab.key)}><span>{tab.label}</span><small>{tab.description}</small></button>)}</nav>
    <section className="analiticas-body" aria-label={tabs.find(tab => tab.key === active)?.label}>
      <div className="analiticas-body-inner" key={`${active}-${scope}-${revision}`}>
        {active === 'inventario' ? <AnaliticasInventario {...range} /> : <Estadisticas {...range} />}
      </div>
    </section>
  </div>;
}
