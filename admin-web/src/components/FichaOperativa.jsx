import { useEffect, useRef, useState } from 'react';
import api from '../api/api';
import '../styles/OperacionDetallada.css';
export const FICHA_FIELDS = [['codigo', 'Código / SKU'], ['codigoBarras', 'Código de barras'], ['clasificacion', 'Clasificación'], ['centroElaboracion', 'Centro de elaboración'], ['unidadVenta', 'Unidad de venta'], ['tipoPlato', 'Tipo de plato'], ['nombreBoton', 'Nombre corto'], ['equivalencia', 'Código de equivalencia'], ['costoReferencia', 'Costo de referencia', 'number'], ['tiempoPreparacion', 'Preparación (minutos)', 'number'], ['orden', 'Orden de presentación', 'number'], ['ivaPorcentaje', 'IVA de referencia (%)', 'number'], ['categoriaIVA', 'Categoría IVA'], ['incPorcentaje', 'INC de referencia (%)', 'number'], ['categoriaINC', 'Categoría INC']];
export function FichaFields({
  value = {},
  onChange,
  inventory = false
}) {
  const fields = inventory ? [['codigo', 'Código / SKU'], ['codigoBarras', 'Código de barras'], ['proveedor', 'Proveedor'], ['ubicacion', 'Bodega / ubicación'], ['lote', 'Lote de referencia'], ['vencimiento', 'Vencimiento de referencia', 'date']] : FICHA_FIELDS;
  return <><div className="op-fields">{fields.map(([key, label, type = 'text']) => <label key={key}>{label}<input type={type} min={type === 'number' ? '0' : undefined} step={type === 'number' ? '0.01' : undefined} maxLength={type === 'text' ? 60 : undefined} value={value[key] ?? ''} onChange={e => onChange({
          ...value,
          [key]: e.target.value
        })} /></label>)}</div>{!inventory && <div className="op-inline">{[['ivaIncluido', 'IVA incluido (referencia)'], ['incIncluido', 'INC incluido (referencia)']].map(([key, label]) => <label key={key}><input type="checkbox" checked={value[key] === true} onChange={e => onChange({
          ...value,
          [key]: e.target.checked
        })} />{label}</label>)}</div>}<label className="op-notes">Observaciones internas<textarea maxLength={600} rows={2} value={value.observaciones || ''} onChange={e => onChange({
        ...value,
        observaciones: e.target.value
      })} /></label></>;
}
export default function FichaOperativa({
  productoId
}) {
  const [value, setValue] = useState({}),
    [status, setStatus] = useState(''),
    [loading, setLoading] = useState(false);
  const generation = useRef(0);
  useEffect(() => {
    const seq = ++generation.current;
    setValue({});
    setStatus('');
    if (!productoId) return;
    setLoading(true);
    const c = new AbortController();
    api.get('/inventario/fichas/producto/' + productoId, {
      signal: c.signal
    }).then(r => {
      if (seq === generation.current) setValue(r.data.data || {});
    }).catch(e => {
      if (!c.signal.aborted && seq === generation.current) setStatus(e.response?.data?.message || 'No se pudo cargar la ficha.');
    }).finally(() => {
      if (seq === generation.current) setLoading(false);
    });
    return () => c.abort();
  }, [productoId]);
  async function save() {
    setLoading(true);
    setStatus('');
    const seq = generation.current;
    try {
      const r = await api.put('/inventario/fichas/producto/' + productoId, value);
      if (seq === generation.current) {
        setValue(r.data.data);
        setStatus('Ficha guardada.');
      }
    } catch (e) {
      if (seq === generation.current) setStatus(e.response?.data?.message || 'No se pudo guardar.');
    } finally {
      if (seq === generation.current) setLoading(false);
    }
  }
  return <details className="op-product-details"><summary>Ficha operativa y costos <span>Opcional</span></summary><p>Datos internos del producto. Los impuestos son de referencia: estos campos no cambian el precio de la carta ni generan una factura fiscal.</p>{productoId ? <><fieldset disabled={loading}><FichaFields value={value} onChange={setValue} /></fieldset><button type="button" className="op-button" onClick={save} disabled={loading}>{loading ? 'Procesando…' : 'Guardar ficha operativa'}</button><p role="status">{status}</p></> : <p>Guarda primero el producto. Después podrás completar su ficha operativa sin volver a crear el artículo.</p>}</details>;
}
