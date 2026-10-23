'use strict';

import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import InventarioAlertaCard from '../components/InventarioAlertaCard';
import InventarioKPI from '../components/InventarioKPI';
import InventarioMovimientos from '../components/InventarioMovimientos';
import InventarioRecomendaciones from '../components/InventarioRecomendaciones';
import InventarioTabla from '../components/InventarioTabla';
import ModalAjusteStock from '../components/ModalAjusteStock';
import ModalInventarioItem from '../components/ModalInventarioItem';
import useInventario from '../hooks/useInventario';

import '../styles/Dashboard.css';
import '../styles/InventarioAdmin.css';

const ESTADOS_FILTER = [
  { id: 'todos',   label: 'Todos'    },
  { id: 'ok',      label: 'OK',      dot: 'ok'      },
  { id: 'bajo',    label: 'Bajo',    dot: 'bajo'    },
  { id: 'critico', label: 'Crítico', dot: 'critico' },
  { id: 'agotado', label: 'Agotado', dot: 'agotado' }
];

function normalizarTexto(value = '') {
  return String(value || '').trim().toLowerCase();
}

function IconoPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function IconoAlerta() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

export default function Inventario() {
  const {
    resumen,
    alertas,
    recomendaciones,
    items,
    movimientos,
    loading,
    loadingItems,
    loadingMovimientos,
    error,
    resolverAlerta,
    marcarAlertaLeida,
    cargarInventario,
    ajustarStock,
    crearItem,
    tieneAlertas,
    tieneRecomendaciones
  } = useInventario({ autoLoad: true });

  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [modalAjusteAbierto, setModalAjusteAbierto] = useState(false);
  const [modalNuevoItemAbierto, setModalNuevoItemAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [seccionActiva, setSeccionActiva] = useState('todas');
  const [estadoActivo, setEstadoActivo] = useState('todos');

  const secciones = useMemo(() => {
    const base = Array.isArray(items) ? items : [];
    const agrupadas = base.reduce((acc, item) => {
      const key = item?.seccion || item?.categoria || 'Sin sección';
      if (!acc[key]) acc[key] = { nombre: key, total: 0, agotados: 0, criticos: 0 };
      acc[key].total += 1;
      if (item?.estadoStock === 'agotado') acc[key].agotados += 1;
      if (item?.estadoStock === 'critico') acc[key].criticos += 1;
      return acc;
    }, {});
    return Object.values(agrupadas).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [items]);

  const itemsFiltrados = useMemo(() => {
    const lista = Array.isArray(items) ? items : [];
    return lista.filter((item) => {
      const coincideSeccion =
        seccionActiva === 'todas' ||
        String(item?.seccion || item?.categoria || 'Sin sección') === seccionActiva;
      const coincideEstado =
        estadoActivo === 'todos' || item?.estadoStock === estadoActivo;
      const termino = normalizarTexto(busqueda);
      const coincideBusqueda =
        !termino ||
        normalizarTexto(item?.nombre).includes(termino) ||
        normalizarTexto(item?.categoria).includes(termino) ||
        (Array.isArray(item?.productos) &&
          item.productos.some((p) => normalizarTexto(p?.nombre).includes(termino)));
      return coincideSeccion && coincideEstado && coincideBusqueda;
    });
  }, [busqueda, estadoActivo, items, seccionActiva]);

  const tablero = useMemo(() => {
    const lista = Array.isArray(items) ? items : [];
    return {
      secciones: secciones.length,
      ligados:   lista.filter((item) => Number(item?.productosVinculados || 0) > 0).length,
      agotados:  lista.filter((item) => item?.estadoStock === 'agotado').length,
      criticos:  lista.filter((item) => item?.estadoStock === 'critico').length
    };
  }, [items, secciones]);

  function abrirModalAjuste(item) {
    setItemSeleccionado(item);
    setModalAjusteAbierto(true);
  }

  function cerrarModalAjuste() {
    setModalAjusteAbierto(false);
    setItemSeleccionado(null);
  }

  async function onGuardarAjuste(payload) {
    await ajustarStock(payload);
    toast.success('Stock actualizado correctamente.');
    cerrarModalAjuste();
  }

  async function onCrearItem(payload) {
    await crearItem(payload);
    toast.success('Item de inventario creado.');
    setModalNuevoItemAbierto(false);
  }

  if (loading && !resumen) {
    return (
      <div className="page-container fadeIn">
        <div className="fo-page-header">
          <h1>Inventario</h1>
          <p>Gobernanza operativa de stock</p>
        </div>
        <div className="inv-stats-row">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="fo-card skeleton" style={{ height: 96, borderRadius: 18 }} />
          ))}
        </div>
      </div>
    );
  }

  if (error && !resumen) {
    return (
      <div className="page-container fadeIn">
        <div className="inv-tabla-empty">
          <div className="inv-tabla-empty__icon"><IconoAlerta /></div>
          <div className="inv-tabla-empty__title">Error cargando inventario</div>
          <div className="inv-tabla-empty__desc">{error}</div>
          <div style={{ marginTop: 20 }}>
            <button className="fo-btn fo-btn-primary" onClick={cargarInventario}>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container fadeIn">

      {/* Header */}
      <div className="fo-page-header" style={{ alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h1>Inventario</h1>
          <p>Stock real por secciones, productos ligados y trazabilidad de movimientos.</p>
        </div>
        <button className="fo-btn fo-btn-primary" onClick={() => setModalNuevoItemAbierto(true)}>
          <IconoPlus /> Nuevo item
        </button>
      </div>

      {/* KPI principal (riesgo + alertas + críticos) */}
      <div className="fo-section">
        <InventarioKPI resumen={resumen} />
      </div>

      {/* Stats secundarias */}
      <div className="inv-stats-row" style={{ marginTop: 0 }}>
        <div className="inv-stat-card">
          <span className="inv-stat-card__label">Secciones activas</span>
          <strong className="inv-stat-card__value">{tablero.secciones}</strong>
          <span className="inv-stat-card__hint">Áreas operativas con insumos</span>
        </div>
        <div className="inv-stat-card">
          <span className="inv-stat-card__label">Items ligados</span>
          <strong className="inv-stat-card__value">{tablero.ligados}</strong>
          <span className="inv-stat-card__hint">Descuentan automáticamente al vender</span>
        </div>
        <div className={`inv-stat-card${tablero.agotados > 0 ? ' inv-stat-card--danger' : ''}`}>
          <span className="inv-stat-card__label">Agotados</span>
          <strong className="inv-stat-card__value">{tablero.agotados}</strong>
          <span className="inv-stat-card__hint">Stock en cero — acción inmediata</span>
        </div>
        <div className={`inv-stat-card${tablero.criticos > 0 ? ' inv-stat-card--warning' : ''}`}>
          <span className="inv-stat-card__label">Críticos</span>
          <strong className="inv-stat-card__value">{tablero.criticos}</strong>
          <span className="inv-stat-card__hint">Por debajo del mínimo operativo</span>
        </div>
      </div>

      {/* Alertas */}
      {tieneAlertas && (
        <div className="fo-section">
          <div className="inv-section-head">
            <div className="inv-section-head__copy">
              <h3 className="inv-section-head__title">Riesgos detectados</h3>
              <p className="inv-section-head__desc">Revisa y resuelve antes de que impacten la operación.</p>
            </div>
          </div>
          <div className="inv-mov-grid">
            {alertas.map((alerta, i) => (
              <InventarioAlertaCard
                key={alerta.id ?? i}
                alerta={alerta}
                onResolver={resolverAlerta}
                onMarcarLeida={marcarAlertaLeida}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recomendaciones */}
      {tieneRecomendaciones && (
        <div className="fo-section">
          <div className="inv-section-head">
            <div className="inv-section-head__copy">
              <h3 className="inv-section-head__title">Recomendaciones</h3>
              <p className="inv-section-head__desc">Sugerencias basadas en el estado actual del inventario.</p>
            </div>
          </div>
          <InventarioRecomendaciones recomendaciones={recomendaciones} />
        </div>
      )}

      {/* Tabla de stock */}
      <div className="fo-section">
        <div className="inv-section-head">
          <div className="inv-section-head__copy">
            <h3 className="inv-section-head__title">Mapa operativo del stock</h3>
            <p className="inv-section-head__desc">
              Filtra por sección o estado y ajusta el inventario al instante.
            </p>
          </div>
          <input
            className="fo-input inv-search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar item, sección o producto…"
          />
        </div>

        {/* Filtro por sección */}
        <div className="inv-chips-row" style={{ marginBottom: 10 }}>
          <button
            type="button"
            className={`fo-chip${seccionActiva === 'todas' ? ' fo-chip-active' : ''}`}
            onClick={() => setSeccionActiva('todas')}
          >
            Todas las secciones
          </button>
          {secciones.map((s) => (
            <button
              key={s.nombre}
              type="button"
              className={`fo-chip${seccionActiva === s.nombre ? ' fo-chip-active' : ''}`}
              onClick={() => setSeccionActiva(s.nombre)}
            >
              {s.nombre} · {s.total}
            </button>
          ))}
        </div>

        {/* Filtro por estado */}
        <div className="inv-chips-row" style={{ marginBottom: 18 }}>
          {ESTADOS_FILTER.map((e) => (
            <button
              key={e.id}
              type="button"
              className={`fo-chip fo-chip--${e.id}${estadoActivo === e.id ? ' fo-chip-active' : ''}`}
              onClick={() => setEstadoActivo(e.id)}
            >
              {e.dot && <span className={`fo-chip-dot fo-chip-dot--${e.dot}`} />}
              {e.label}
            </button>
          ))}
        </div>

        <InventarioTabla
          items={itemsFiltrados}
          onAjustarStock={abrirModalAjuste}
          cargando={loadingItems}
        />
      </div>

      {/* Bitácora de movimientos */}
      <div className="fo-section">
        <div className="inv-section-head">
          <div className="inv-section-head__copy">
            <h3 className="inv-section-head__title">Bitácora de movimientos</h3>
            <p className="inv-section-head__desc">Trazabilidad completa de entradas, salidas y ajustes.</p>
          </div>
        </div>
        <InventarioMovimientos movimientos={movimientos} cargando={loadingMovimientos} />
      </div>

      <ModalAjusteStock
        abierto={modalAjusteAbierto}
        item={itemSeleccionado}
        onCerrar={cerrarModalAjuste}
        onGuardar={onGuardarAjuste}
      />

      <ModalInventarioItem
        abierto={modalNuevoItemAbierto}
        onCerrar={() => setModalNuevoItemAbierto(false)}
        onGuardar={onCrearItem}
        seccionesDisponibles={secciones.map((s) => s.nombre)}
      />
    </div>
  );
}
