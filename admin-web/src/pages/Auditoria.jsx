import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiActivity, FiRefreshCw, FiShield } from 'react-icons/fi';
import api from '../api/api';
import '../styles/Auditoria.css';
const groups = [['all', 'Todo'], ['orders', 'Pedidos y sala'], ['catalog', 'Carta'], ['team', 'Equipo'], ['security', 'Accesos'], ['settings', 'Configuración']];
const actionLabels = {
  api_post: 'Solicitud de creación o acción',
  api_put: 'Solicitud de actualización',
  api_patch: 'Solicitud de cambio',
  api_delete: 'Solicitud de eliminación'
};
const label = v => actionLabels[v] || String(v || 'Sin información').replaceAll('_', ' ');
const date = v => v ? new Date(v).toLocaleString('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short'
}) : '—';
const display = v => v == null ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v);
export default function Auditoria() {
  const [events, setEvents] = useState([]),
    [filter, setFilter] = useState('all'),
    [search, setSearch] = useState(''),
    [days, setDays] = useState('7'),
    [cursor, setCursor] = useState(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [connected, setConnected] = useState(false);
  const request = useRef(0),
    busy = useRef(false);
  const load = useCallback(async (next = null) => {
    if (next && busy.current) return;
    const id = ++request.current;
    busy.current = true;
    setLoading(true);
    setError('');
    if (!next) {
      setEvents([]);
      setCursor(null);
      setConnected(false);
    }
    try {
      const {
        data
      } = await api.get('/auditoria', {
        params: {
          days,
          ...(next ? {
            cursor: next
          } : {})
        }
      });
      if (id !== request.current) return;
      if (!Array.isArray(data.items)) throw new Error('Respuesta inválida');
      setEvents(old => next ? [...old, ...data.items.filter(item => !old.some(row => row.id === item.id))] : data.items);
      setCursor(data.nextCursor || null);
      setConnected(true);
    } catch (e) {
      if (id === request.current) setError(e.response?.data?.message || 'No pudimos consultar la actividad. Vuelve a intentar.');
    } finally {
      if (id === request.current) {
        busy.current = false;
        setLoading(false);
      }
    }
  }, [days]);
  const invalidate = useCallback(() => {
    request.current++;
    busy.current = false;
  }, []);
  useEffect(() => {
    load();
    const reset = () => load();
    window.addEventListener('comanda:sede-changed', reset);
    return () => {
      invalidate();
      window.removeEventListener('comanda:sede-changed', reset);
    };
  }, [load, invalidate]);
  const visible = useMemo(() => events.filter(e => (filter === 'all' || e.categoria === filter) && [e.accion, e.metadata?.actor?.nombre, e.metadata?.recursoNombre, e.metadata?.ruta, e.actorId].join(' ').toLocaleLowerCase().includes(search.toLocaleLowerCase())), [events, filter, search]);
  const actors = new Set(events.filter(e => Number(e.actorId) > 0).map(e => String(e.actorId))).size;
  return <section className="audit-page audit-workspace" aria-busy={loading}>
  <header className="audit-hero"><div><span className="audit-eyebrow"><FiShield /> Control y trazabilidad</span><h1>Auditoría</h1><p>La historia de tu operación, con responsables y detalles verificables.</p></div><button disabled={loading} onClick={() => load()}><FiRefreshCw /> Actualizar</button></header>
  <div className="audit-summary"><article><span>Eventos cargados</span><strong>{events.length}</strong><small>Últimos {days} días · por páginas</small></article><article><span>Responsables</span><strong>{actors}</strong><small>Usuarios en la actividad cargada</small></article><article><span>Último registro cargado</span><strong className="audit-last">{date(events[0]?.fecha)}</strong><small>{connected ? 'Fuente: registros del servidor' : 'Conexión pendiente'}</small></article></div>
  <div className="audit-panel"><div className="audit-toolbar"><label>Periodo <select value={days} onChange={e => setDays(e.target.value)}><option value="1">24 horas</option><option value="7">7 días</option><option value="30">30 días</option><option value="90">90 días</option></select></label><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar en eventos cargados" aria-label="Buscar en eventos cargados" /></div>
   <nav className="audit-filters" aria-label="Tipo de actividad">{groups.map(([id, name]) => <button key={id} aria-pressed={filter === id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>{name}</button>)}</nav>
   <p className="audit-hint">Filtros y búsqueda sobre {events.length} registros cargados. Carga más para ampliar la revisión.</p>
   {error && <div className="audit-error" role="alert">{error} <button disabled={loading} onClick={() => load(cursor)}>Reintentar</button></div>}
   {!visible.length && !loading && !error && <div className="audit-empty"><FiShield size={28} /><h2>{events.length ? 'Sin coincidencias' : 'Sin actividad en este periodo'}</h2><p>{events.length ? 'Prueba otro filtro o carga más registros.' : 'Los nuevos cambios aparecerán aquí cuando sean registrados por el servidor.'}</p></div>}
   <div>{visible.map(e => {
          const m = e.metadata || {},
            changes = Object.entries(m.cambios || {});
          return <details key={e.id} className="audit-event"><summary><FiActivity /><span><b>{label(e.accion)}</b><small>{m.recursoNombre || m.ruta || m.recurso || 'Operación registrada'}</small></span><span>{m.actor?.nombre || (Number(e.actorId) === 0 ? 'Sistema' : `Usuario #${e.actorId}`)}<small>{label(m.actor?.rol)}</small></span><time dateTime={e.fecha}>{date(e.fecha)}</time><em className={e.resultado === 'rechazado' ? 'rejected' : ''}>{label(e.resultado)}</em></summary>
    <div className="audit-detail"><p>{m.detalle || 'Evento registrado por la operación del servidor.'}</p><dl><div><dt>Recurso</dt><dd>{label(m.recurso)} {m.recursoId ? `#${m.recursoId}` : ''}</dd></div><div><dt>Referencia</dt><dd>#{e.id}</dd></div><div><dt>IP de origen</dt><dd>{e.ip || 'No disponible'}</dd></div><div><dt>Solicitud</dt><dd>{m.requestId || 'Registro anterior'}</dd></div></dl>{changes.length ? <div className="audit-changes">{changes.map(([field, v]) => <div key={field}><b>{label(field)}</b><span>Antes: {display(v?.antes)}</span><span>Después: {display(v?.despues)}</span></div>)}</div> : <p>Este evento no contiene comparación de valores. No se reconstruyen datos históricos.</p>}</div></details>;
        })}</div>
   <footer className="audit-footer"><span role="status">{loading ? 'Consultando actividad…' : `${visible.length} registros visibles`}</span>{cursor && <button disabled={loading} onClick={() => load(cursor)}>Cargar 30 anteriores</button>}</footer>
  </div><aside className="audit-note"><FiShield /><p><b>Registro eficiente y privado.</b> Cambios autenticados por API y eventos explícitos del sistema. Las lecturas y los clics no generan registros. Sin actualización automática ni consumo de IA.</p></aside>
 </section>;
}
