import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiArrowRight, FiDownload, FiPackage, FiScissors, FiTruck } from 'react-icons/fi';
import {
  crearEntradaMercancia,
  crearTransformacion,
  obtenerEntradasMercancia,
  obtenerTransformaciones
} from '../services/inventarioService';
import { pdfEntrada, pdfTransformaciones } from '../utils/inventoryPdf';

const hoy = () => new Date().toISOString().slice(0, 10);
const money = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value || 0));
const initialEntry = () => ({ proveedor: '', documento: '', factura: '', fecha: hoy(), notas: '', lineas: [{ itemId: '', cantidad: '', costoUnitario: '', lote: '', venceEl: '' }] });

function Modal({ title, subtitle, onClose, children, footer }) {
  return <div className="pro-modal-overlay"><div className="pro-modal inv-op-modal"><div className="pro-modal-header"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="pro-close-btn" onClick={onClose}>×</button></div><div className="pro-modal-body">{children}</div><div className="pro-modal-actions ajuste-actions">{footer}</div></div></div>;
}

export default function InventarioOperaciones({ items = [], onChanged }) {
  const [tab, setTab] = useState('entradas');
  const [entradas, setEntradas] = useState([]);
  const [transformaciones, setTransformaciones] = useState([]);
  const [entryOpen, setEntryOpen] = useState(false);
  const [transformOpen, setTransformOpen] = useState(false);
  const [entry, setEntry] = useState(initialEntry);
  const [transform, setTransform] = useState({ itemOrigenId: '', itemDestinoId: '', cantidadBruta: '', merma: '', porciones: '', notas: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [entryRows, transformRows] = await Promise.all([obtenerEntradasMercancia(), obtenerTransformaciones()]);
    setEntradas(entryRows);
    setTransformaciones(transformRows);
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const preview = useMemo(() => {
    const bruto = Number(transform.cantidadBruta || 0);
    const merma = Number(transform.merma || 0);
    const porciones = Number(transform.porciones || 0);
    const neto = Math.max(bruto - merma, 0);
    const origen = items.find((item) => String(item.id) === String(transform.itemOrigenId));
    return { neto, rendimiento: bruto ? (neto / bruto) * 100 : 0, peso: porciones ? neto / porciones : 0, costo: porciones ? (bruto * Number(origen?.costoUnitario || 0)) / porciones : 0 };
  }, [items, transform]);

  const updateLine = (index, key, value) => setEntry((prev) => ({ ...prev, lineas: prev.lineas.map((linea, i) => i === index ? { ...linea, [key]: value } : linea) }));
  const totalEntry = entry.lineas.reduce((sum, line) => sum + Number(line.cantidad || 0) * Number(line.costoUnitario || 0), 0);

  const saveEntry = async () => {
    if (entry.lineas.some((line) => !line.itemId || Number(line.cantidad) <= 0 || Number(line.costoUnitario) < 0)) return toast.error('Completa articulo, cantidad y costo en cada renglon.');
    try { setSaving(true); await crearEntradaMercancia(entry); toast.success('Mercancia recibida y existencias actualizadas.'); setEntryOpen(false); setEntry(initialEntry()); await load(); await onChanged?.(); } catch (error) { toast.error(error?.response?.data?.message || error.message); } finally { setSaving(false); }
  };

  const saveTransform = async () => {
    if (!transform.itemOrigenId || !transform.itemDestinoId || Number(transform.cantidadBruta) <= 0 || Number(transform.porciones) <= 0) return toast.error('Completa origen, resultado, peso bruto y porciones.');
    try { setSaving(true); await crearTransformacion(transform); toast.success('Transformacion aplicada al inventario.'); setTransformOpen(false); setTransform({ itemOrigenId: '', itemDestinoId: '', cantidadBruta: '', merma: '', porciones: '', notas: '' }); await load(); await onChanged?.(); } catch (error) { toast.error(error?.response?.data?.message || error.message); } finally { setSaving(false); }
  };

  return <section className="inv-operations">
    <div className="inv-section-head"><div className="inv-section-head__copy"><span className="inv-kicker">Control de bodega</span><h3 className="inv-section-head__title">Movimientos que explican tu inventario</h3><p className="inv-section-head__desc">Recibe compras y convierte materia prima en porciones con trazabilidad completa.</p></div><div className="inv-header-actions"><button className="fo-btn fo-btn-outline" onClick={() => setTransformOpen(true)}><FiScissors /> Transformar</button><button className="fo-btn fo-btn-primary" onClick={() => setEntryOpen(true)}><FiTruck /> Entrada de mercancia</button></div></div>
    <div className="inv-operation-tabs"><button className={tab === 'entradas' ? 'active' : ''} onClick={() => setTab('entradas')}>Entradas <span>{entradas.length}</span></button><button className={tab === 'transformaciones' ? 'active' : ''} onClick={() => setTab('transformaciones')}>Transformacion y porcionamiento <span>{transformaciones.length}</span></button></div>
    {tab === 'entradas' ? <div className="inv-doc-list">{entradas.length ? entradas.map((row) => <article className="inv-doc-card" key={row.id}><div className="inv-doc-icon"><FiPackage /></div><div><strong>{row.consecutivo}</strong><p>{row.proveedor || 'Proveedor no informado'} · {row.fecha}</p><small>{row.lineas?.length || 0} articulos · Factura {row.factura || 'sin numero'}</small></div><div className="inv-doc-total"><strong>{money(row.total)}</strong><button onClick={() => pdfEntrada(row)}><FiDownload /> PDF</button></div></article>) : <div className="inv-tabla-empty">Aun no hay entradas de mercancia.</div>}</div> : <div className="inv-doc-list">{transformaciones.length ? transformaciones.map((row) => <article className="inv-doc-card" key={row.id}><div className="inv-doc-icon"><FiScissors /></div><div><strong>{row.origen?.nombre || 'Materia prima'} <FiArrowRight /> {row.destino?.nombre || 'Porciones'}</strong><p>{row.consecutivo} · {new Date(row.createdAt).toLocaleDateString('es-CO')}</p><small>{row.porciones} porciones · Merma {row.merma} · Rendimiento {Number(row.rendimientoPorcentaje).toFixed(1)}%</small></div><div className="inv-doc-total"><strong>{money(row.costoPorPorcion)} / porcion</strong></div></article>) : <div className="inv-tabla-empty">Aun no hay transformaciones.</div>} {!!transformaciones.length && <button className="fo-btn fo-btn-outline inv-report-download" onClick={() => pdfTransformaciones(transformaciones)}><FiDownload /> Descargar reporte PDF</button>}</div>}

    {entryOpen && <Modal title="Entrada de mercancia" subtitle="Una sola confirmacion actualiza costos, existencias y bitacora." onClose={() => setEntryOpen(false)} footer={<><button className="fo-btn fo-btn-outline" onClick={() => setEntryOpen(false)}>Cancelar</button><button className="fo-btn fo-btn-primary" disabled={saving} onClick={saveEntry}>{saving ? 'Registrando...' : `Registrar entrada · ${money(totalEntry)}`}</button></>}>
      <div className="inv-form-grid"><label>Proveedor<input className="fo-input" value={entry.proveedor} onChange={(e) => setEntry({ ...entry, proveedor: e.target.value })} placeholder="Nombre o razon social" /></label><label>Fecha<input className="fo-input" type="date" value={entry.fecha} onChange={(e) => setEntry({ ...entry, fecha: e.target.value })} /></label><label>Documento<input className="fo-input" value={entry.documento} onChange={(e) => setEntry({ ...entry, documento: e.target.value })} placeholder="Remision u orden" /></label><label>Factura<input className="fo-input" value={entry.factura} onChange={(e) => setEntry({ ...entry, factura: e.target.value })} placeholder="Numero de factura" /></label></div>
      <div className="inv-entry-lines">{entry.lineas.map((line, index) => <div className="inv-entry-line" key={index}><select className="fo-input" value={line.itemId} onChange={(e) => updateLine(index, 'itemId', e.target.value)}><option value="">Articulo</option>{items.map((item) => <option key={item.id} value={item.id}>{item.nombre} ({item.unidad})</option>)}</select><input className="fo-input" type="number" min="0" step="0.001" value={line.cantidad} onChange={(e) => updateLine(index, 'cantidad', e.target.value)} placeholder="Cantidad" /><input className="fo-input" type="number" min="0" value={line.costoUnitario} onChange={(e) => updateLine(index, 'costoUnitario', e.target.value)} placeholder="Costo unitario" /><input className="fo-input" value={line.lote} onChange={(e) => updateLine(index, 'lote', e.target.value)} placeholder="Lote (opcional)" /><button className="inv-line-remove" onClick={() => setEntry((prev) => ({ ...prev, lineas: prev.lineas.filter((_, i) => i !== index) }))}>×</button></div>)}</div>
      <button className="fo-btn fo-btn-outline" onClick={() => setEntry((prev) => ({ ...prev, lineas: [...prev.lineas, { itemId: '', cantidad: '', costoUnitario: '', lote: '', venceEl: '' }] }))}>+ Agregar renglon</button>
    </Modal>}

    {transformOpen && <Modal title="Transformacion y porcionamiento" subtitle="Registra peso recibido, merma real y resultado en una sola operacion." onClose={() => setTransformOpen(false)} footer={<><button className="fo-btn fo-btn-outline" onClick={() => setTransformOpen(false)}>Cancelar</button><button className="fo-btn fo-btn-primary" disabled={saving} onClick={saveTransform}>{saving ? 'Procesando...' : 'Confirmar transformacion'}</button></>}>
      <div className="inv-transform-flow"><label>Materia prima<select className="fo-input" value={transform.itemOrigenId} onChange={(e) => setTransform({ ...transform, itemOrigenId: e.target.value })}><option value="">Selecciona origen</option>{items.map((item) => <option key={item.id} value={item.id}>{item.nombre} · {item.stockActual} {item.unidad}</option>)}</select></label><FiArrowRight /><label>Item resultante<select className="fo-input" value={transform.itemDestinoId} onChange={(e) => setTransform({ ...transform, itemDestinoId: e.target.value })}><option value="">Selecciona porcion final</option>{items.map((item) => <option key={item.id} value={item.id}>{item.nombre} ({item.unidad})</option>)}</select></label></div>
      <div className="inv-form-grid inv-transform-fields"><label>Peso o cantidad bruta<input className="fo-input" type="number" min="0" step="0.001" value={transform.cantidadBruta} onChange={(e) => setTransform({ ...transform, cantidadBruta: e.target.value })} /></label><label>Merma real<input className="fo-input" type="number" min="0" step="0.001" value={transform.merma} onChange={(e) => setTransform({ ...transform, merma: e.target.value })} /></label><label>Numero de porciones<input className="fo-input" type="number" min="1" value={transform.porciones} onChange={(e) => setTransform({ ...transform, porciones: e.target.value })} /></label><label>Notas<input className="fo-input" value={transform.notas} onChange={(e) => setTransform({ ...transform, notas: e.target.value })} placeholder="Corte, responsable, observaciones" /></label></div>
      <div className="inv-yield-preview"><div><span>Peso neto</span><strong>{preview.neto.toFixed(3)}</strong></div><div><span>Rendimiento</span><strong>{preview.rendimiento.toFixed(1)}%</strong></div><div><span>Peso por porcion</span><strong>{preview.peso.toFixed(3)}</strong></div><div><span>Costo por porcion</span><strong>{money(preview.costo)}</strong></div></div>
    </Modal>}
  </section>;
}
