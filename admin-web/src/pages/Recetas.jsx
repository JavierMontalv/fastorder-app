import { useCallback, useEffect, useState } from 'react';
import { FiBookOpen, FiCheckCircle, FiEdit3, FiSearch, FiTrash2, FiTrendingUp } from 'react-icons/fi';
import { toast } from 'react-toastify';
import ModalRecetaProducto from '../components/ModalRecetaProducto';
import { guardarRecetaProducto, obtenerItemsInventario, obtenerProductosParaReceta } from '../services/inventarioService';
import '../styles/BusinessIntelligence.css';
import '../styles/BusinessIntelligenceNeutral.css';

const cop = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value || 0));

export default function Recetas() {
  const [productos, setProductos] = useState([]); const [items, setItems] = useState([]); const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('con'); const [search, setSearch] = useState(''); const [editing, setEditing] = useState(null);
  const load = useCallback(async () => { setLoading(true); try { const [p, i] = await Promise.all([obtenerProductosParaReceta(), obtenerItemsInventario()]); setProductos(p); setItems(i); } catch { toast.error('No fue posible cargar las recetas.'); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const configured = productos.filter((p) => p.receta?.length); const visible = productos.filter((p) => p.visibleEnMenu !== false);
  const kpis = { configured: configured.length, coverage: visible.length ? Math.round((visible.filter((p) => p.receta?.length).length / visible.length) * 100) : 0, foodCost: configured.length ? configured.reduce((s, p) => s + Number(p.foodCost || 0), 0) / configured.length : 0, margin: configured.length ? configured.reduce((s, p) => s + Number(p.margen || 0), 0) / configured.length : 0 };
  const shown = productos.filter((p) => (tab === 'con' ? p.receta?.length : !p.receta?.length) && p.nombre.toLowerCase().includes(search.toLowerCase()));
  const remove = async (producto) => { if (!window.confirm(`¿Quitar la receta de ${producto.nombre}? El producto seguirá en la carta.`)) return; await guardarRecetaProducto(producto.id, []); toast.success('Receta retirada.'); load(); };
  return <div className="bi-page">
    <header className="bi-hero"><div><span>COSTO REAL POR PLATO</span><h1>Recetas</h1><p>Conecta cada producto con sus ingredientes. COMANDA calcula food cost, margen y descuenta existencias al aceptar el pedido.</p></div><button onClick={() => setEditing('new')}>+ Configurar receta</button></header>
    <section className="bi-kpis"><article><FiBookOpen/><strong>{kpis.configured}</strong><span>Recetas configuradas</span></article><article><FiCheckCircle/><strong>{kpis.coverage}%</strong><span>Cobertura de la carta</span></article><article><FiTrendingUp/><strong>{kpis.foodCost.toFixed(1)}%</strong><span>Food cost promedio</span></article><article className="accent"><FiTrendingUp/><strong>{kpis.margin.toFixed(1)}%</strong><span>Margen bruto estimado</span></article></section>
    <section className="bi-panel"><nav className="bi-tabs"><button className={tab === 'con' ? 'active' : ''} onClick={() => setTab('con')}>Con receta <b>{configured.length}</b></button><button className={tab === 'sin' ? 'active' : ''} onClick={() => setTab('sin')}>Sin receta <b>{productos.length - configured.length}</b></button></nav><label className="bi-search"><FiSearch/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar plato o producto…" /></label>
      {loading ? <div className="bi-empty">Calculando costos…</div> : <div className="recipe-grid">{shown.map((p) => <article className="recipe-card" key={p.id}><header><div className="recipe-icon">⌑</div><div><h3>{p.nombre}</h3><span>{p.receta?.length || 0} ingrediente(s)</span></div></header><div className="recipe-metrics"><div><small>Costo / porción</small><strong>{cop(p.costoEstimado)}</strong></div><div><small>Precio venta</small><strong>{cop(p.precio)}</strong></div><div><small>Food cost</small><strong>{Number(p.foodCost || 0).toFixed(1)}%</strong></div></div><div className="margin-line"><span>Margen</span><b>{Number(p.margen || 0).toFixed(1)}%</b></div><div className="margin-track"><i style={{ width: `${Math.max(0, Math.min(100, Number(p.margen || 0)))}%` }} /></div><footer><button onClick={() => setEditing(p.id)}><FiEdit3/> {p.receta?.length ? 'Editar' : 'Crear receta'}</button>{p.receta?.length ? <button className="icon" onClick={() => remove(p)} aria-label="Quitar receta"><FiTrash2/></button> : null}</footer></article>)}</div>}
      {!loading && !shown.length ? <div className="bi-empty"><strong>{tab === 'con' ? 'Todavía no hay recetas configuradas.' : 'Toda la carta visible ya tiene receta.'}</strong><span>Empieza por los platos de mayor venta para obtener valor rápidamente.</span></div> : null}
    </section><ModalRecetaProducto abierto={Boolean(editing)} items={items} productoInicialId={editing === 'new' ? '' : editing} onCerrar={() => setEditing(null)} onGuardado={load}/>
  </div>;
}
