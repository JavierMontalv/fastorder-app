import { useContext, useMemo, useState } from 'react';

import AnaliticasInventario from './AnaliticasInventario';
import Estadisticas from './Estadisticas';

import dashboardConfig from '../config/dashboardConfig';
import { AuthContext } from '../context/AuthContext';

import '../styles/Analiticas.css';

const TABS = [
  {
    key: 'estadisticas',
    label: 'Ventas y pedidos',
    title: 'Rendimiento comercial',
    description: 'Ventas, ticket promedio, medios de pago y productos estrella.'
  },
  {
    key: 'inventario',
    label: 'Inventario',
    title: 'Salud operativa',
    description: 'Alertas, criticidad, SLA operativo y recomendaciones accionables.'
  }
];

function hoyISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function restarDiasISO(dias) {
  const d = new Date();
  d.setDate(d.getDate() - Number(dias || 0));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function obtenerTextoRango({ presetRango, fechaInicio, fechaFin }) {
  if (presetRango === '7d') return 'Últimos 7 días';
  if (presetRango === '30d') return 'Últimos 30 días';
  if (presetRango === 'custom' && fechaInicio && fechaFin) return `${fechaInicio} a ${fechaFin}`;
  return 'Hoy';
}

export default function Analiticas() {
  const auth = useContext(AuthContext) || {};
  const usuario = auth.usuario || auth.user;

  const [tabActiva, setTabActiva] = useState('estadisticas');
  const [presetRango, setPresetRango] = useState('7d');
  const [fechaInicioCustom, setFechaInicioCustom] = useState(restarDiasISO(7));
  const [fechaFinCustom, setFechaFinCustom] = useState(hoyISO());

  const fechaInicio = useMemo(() => {
    if (presetRango === '30d') return restarDiasISO(30);
    if (presetRango === 'custom') return fechaInicioCustom;
    return restarDiasISO(7);
  }, [presetRango, fechaInicioCustom]);

  const fechaFin = useMemo(() => {
    if (presetRango === 'custom') return fechaFinCustom;
    return hoyISO();
  }, [presetRango, fechaFinCustom]);

  const rangoInvalido = useMemo(() => {
    if (!fechaInicio || !fechaFin) return false;
    return new Date(fechaInicio) > new Date(fechaFin);
  }, [fechaInicio, fechaFin]);

  const rolUsuario = usuario?.rol || usuario?.role || null;

  const permisos = useMemo(() => {
    const rolesInventario = dashboardConfig?.inventario?.roles || [];
    const puedeInventario = !rolUsuario ? true : rolesInventario.includes(rolUsuario);

    return {
      inventario: puedeInventario,
      estadisticas: true
    };
  }, [rolUsuario]);

  const tabsDisponibles = useMemo(() => TABS.filter((tab) => permisos[tab.key] !== false), [permisos]);
  const tabActivaSegura = permisos[tabActiva] === false ? tabsDisponibles[0]?.key : tabActiva;
  const tabMeta = tabsDisponibles.find((tab) => tab.key === tabActivaSegura) || tabsDisponibles[0];

  const filtrosCompartidos = useMemo(
    () => ({
      presetRango,
      fechaInicio,
      fechaFin,
      rangoInvalido
    }),
    [presetRango, fechaInicio, fechaFin, rangoInvalido]
  );

  const vista = useMemo(() => {
    if (tabActivaSegura === 'inventario') {
      return <AnaliticasInventario {...filtrosCompartidos} />;
    }

    return <Estadisticas {...filtrosCompartidos} />;
  }, [tabActivaSegura, filtrosCompartidos]);

  if (!tabsDisponibles.length) {
    return (
      <div className="analiticas-page">
        <div className="analiticas-empty">
          <div className="analiticas-empty-card">
            <h3>Acceso restringido</h3>
            <p>Tu rol actual no tiene módulos habilitados en Analíticas.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analiticas-page">
      <section className="analiticas-hero">
        <div className="analiticas-hero-copy">
          <span className="analiticas-eyebrow">Comanda Intelligence</span>
          <h1 className="analiticas-title">Analíticas listas para operar y vender mejor</h1>
          <p className="analiticas-subtitle">
            Todo el tablero se mueve con datos reales del restaurante activo y un rango global
            compartido entre módulos.
          </p>
        </div>

        <div className="analiticas-hero-meta">
          <div className="analiticas-meta-card">
            <span>Rango activo</span>
            <strong>{obtenerTextoRango(filtrosCompartidos)}</strong>
          </div>
          <div className="analiticas-meta-card">
            <span>Módulo actual</span>
            <strong>{tabMeta?.title || 'Analíticas'}</strong>
          </div>
          <div className="analiticas-meta-card">
            <span>Lectura</span>
            <strong>{tabMeta?.description || 'Panel ejecutivo del negocio.'}</strong>
          </div>
        </div>
      </section>

      <section className="analiticas-toolbar">
        <div className="analiticas-rango">
          <button
            type="button"
            className={`analiticas-chip ${presetRango === '7d' ? 'active' : ''}`}
            onClick={() => setPresetRango('7d')}
          >
            7d
          </button>
          <button
            type="button"
            className={`analiticas-chip ${presetRango === '30d' ? 'active' : ''}`}
            onClick={() => setPresetRango('30d')}
          >
            30d
          </button>
          <button
            type="button"
            className={`analiticas-chip ${presetRango === 'custom' ? 'active' : ''}`}
            onClick={() => setPresetRango('custom')}
          >
            Personalizado
          </button>
        </div>

        {presetRango === 'custom' && (
          <div className="analiticas-rango-custom">
            <label>
              <span>Desde</span>
              <input
                type="date"
                value={fechaInicio || ''}
                onChange={(e) => setFechaInicioCustom(e.target.value)}
              />
            </label>
            <label>
              <span>Hasta</span>
              <input
                type="date"
                value={fechaFin || ''}
                onChange={(e) => setFechaFinCustom(e.target.value)}
              />
            </label>
          </div>
        )}
      </section>

      {rangoInvalido && presetRango === 'custom' && (
        <div className="analiticas-rango-error">El rango es inválido: la fecha final es menor que la inicial.</div>
      )}

      <section className="analiticas-tabs">
        {tabsDisponibles.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`analiticas-tab ${tabActivaSegura === tab.key ? 'active' : ''}`}
            onClick={() => setTabActiva(tab.key)}
          >
            <span>{tab.label}</span>
            <small>{tab.description}</small>
          </button>
        ))}
      </section>

      <section className="analiticas-body">
        <div className="analiticas-body-inner">{vista}</div>
      </section>
    </div>
  );
}
