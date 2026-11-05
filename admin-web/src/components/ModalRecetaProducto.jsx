import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { guardarRecetaProducto, obtenerProductosParaReceta, obtenerRecetaProducto } from '../services/inventarioService';
import '../styles/ModalAjusteStock.css';
import '../styles/InventarioAdmin.css';

const dinero = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value || 0));

export default function ModalRecetaProducto({ abierto, items = [], productoInicialId = '', onCerrar, onGuardado }) {
  const [productos, setProductos] = useState([]);
  const [productoId, setProductoId] = useState('');
  const [lineas, setLineas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const producto = productos.find((p) => String(p.id) === String(productoId));

  useEffect(() => {
    if (!abierto) return;
    obtenerProductosParaReceta().then(setProductos).catch(() => toast.error('No fue posible cargar los productos.'));
    setProductoId(productoInicialId ? String(productoInicialId) : ''); setLineas([]);
  }, [abierto, productoInicialId]);

  useEffect(() => {
    if (!productoId) { setLineas([]); return; }
    setCargando(true);
    obtenerRecetaProducto(productoId)
      .then((data) => setLineas((data.receta || []).map((r) => ({ inventarioItemId: String(r.inventarioItemId), cantidad: String(r.cantidad) }))))
      .catch(() => toast.error('No fue posible cargar la receta.'))
      .finally(() => setCargando(false));
  }, [productoId]);

  const costo = useMemo(() => lineas.reduce((total, linea) => {
    const item = items.find((i) => String(i.id) === String(linea.inventarioItemId));
    const merma = Math.min(Number(item?.mermaPorcentaje || 0), 99.99);
    return total + (Number(linea.cantidad || 0) / (1 - merma / 100)) * Number(item?.costoUnitario || 0);
  }, 0), [items, lineas]);
  const margen = producto?.precio ? ((Number(producto.precio) - costo) / Number(producto.precio)) * 100 : 0;

  if (!abierto) return null;
  const cambiar = (index, field, value) => setLineas((prev) => prev.map((linea, i) => i === index ? { ...linea, [field]: value } : linea));
  const eliminar = (index) => setLineas((prev) => prev.filter((_, i) => i !== index));
  const guardar = async () => {
    if (!productoId) return toast.info('Selecciona un producto.');
    const limpias = lineas.filter((l) => l.inventarioItemId && Number(l.cantidad) > 0);
    if (new Set(limpias.map((l) => l.inventarioItemId)).size !== limpias.length) return toast.error('No repitas un ingrediente en la receta.');
    setCargando(true);
    try {
      await guardarRecetaProducto(productoId, limpias.map((l) => ({ inventarioItemId: Number(l.inventarioItemId), cantidad: Number(l.cantidad) })));
      toast.success('Receta guardada. El stock se descontará al iniciar preparación.');
      onGuardado?.(); onCerrar();
    } finally { setCargando(false); }
  };

  return (
    <div className="inv-modal-overlay" onClick={onCerrar}>
      <div className="inv-modal inv-receta-modal" onClick={(e) => e.stopPropagation()}>
        <div className="inv-modal-header">
          <div className="inv-modal-header__copy"><span className="inv-modal-header__kicker">Costo y control por plato</span><h2 className="inv-modal-header__title">Crear receta de inventario</h2></div>
          <button className="inv-modal-close" onClick={onCerrar} aria-label="Cerrar">×</button>
        </div>
        <div className="inv-modal-body">
          <p className="inv-receta-intro">Define cuánto consume una unidad del producto. COMANDA descuenta los ingredientes una sola vez cuando el pedido es aceptado.</p>
          <label className="inv-field__label">Plato o producto</label>
          <select className="fo-input" value={productoId} onChange={(e) => setProductoId(e.target.value)}>
            <option value="">Selecciona un producto…</option>{productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          {productoId && <>
            <div className="inv-receta-lines">
              {lineas.map((linea, index) => {
                const item = items.find((i) => String(i.id) === String(linea.inventarioItemId));
                return <div className="inv-receta-line" key={index}>
                  <select className="fo-input" value={linea.inventarioItemId} onChange={(e) => cambiar(index, 'inventarioItemId', e.target.value)}>
                    <option value="">Ingrediente…</option>{items.map((i) => <option key={i.id} value={i.id}>{i.nombre} · {i.unidad}</option>)}
                  </select>
                  <input className="fo-input" type="number" min="0.001" step="0.001" value={linea.cantidad} onChange={(e) => cambiar(index, 'cantidad', e.target.value)} placeholder="Cantidad" />
                  <span className="inv-receta-unit">{item?.unidad || 'unidad'}</span>
                  <button className="inv-receta-remove" onClick={() => eliminar(index)} aria-label="Quitar ingrediente">×</button>
                </div>;
              })}
            </div>
            <button className="fo-btn fo-btn-outline inv-receta-add" onClick={() => setLineas((prev) => [...prev, { inventarioItemId: '', cantidad: '' }])}>+ Agregar ingrediente</button>
            <div className="inv-receta-summary">
              <div><span>Costo estimado</span><strong>{dinero(costo)}</strong></div>
              <div><span>Precio de venta</span><strong>{dinero(producto?.precio)}</strong></div>
              <div className={margen < 25 ? 'is-warning' : 'is-good'}><span>Margen estimado</span><strong>{margen.toFixed(1)}%</strong></div>
            </div>
          </>}
        </div>
        <div className="pro-modal-actions ajuste-actions"><button className="fo-btn fo-btn-outline" onClick={onCerrar}>Cancelar</button><button className="fo-btn fo-btn-primary" disabled={cargando || !productoId} onClick={guardar}>{cargando ? 'Guardando…' : 'Guardar receta'}</button></div>
      </div>
    </div>
  );
}
