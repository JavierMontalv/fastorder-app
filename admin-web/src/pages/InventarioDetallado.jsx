import useDialogFocus from '../hooks/useDialogFocus';
import { useContext, useEffect, useRef, useState } from 'react';
import api from '../api/api';
import { AuthContext } from '../context/AuthContext';
import { FichaFields } from '../components/FichaOperativa';
import ModalAjusteStock from '../components/ModalAjusteStock';
import InventarioMovimientos from '../components/InventarioMovimientos';
import { ajustarStock, obtenerMovimientosInventario } from '../services/inventarioService';
import '../styles/OperacionDetallada.css';
const money = n => new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
}).format(n);
const empty = {
  nombre: '',
  categoria: '',
  unidad: 'unidad',
  stockMinimo: '0',
  costoUnitario: '',
  ficha: {}
};
export default function InventarioDetallado() {
  const {
    user
  } = useContext(AuthContext);
  const [items, setItems] = useState([]),
    [q, setQ] = useState(''),
    [cursor, setCursor] = useState(0),
    [next, setNext] = useState(null),
    [history, setHistory] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [revision, setRevision] = useState(0),
    [edit, setEdit] = useState(null),
    [adjust, setAdjust] = useState(null),
    [movements, setMovements] = useState([]);
  const generation = useRef(0);
  useDialogFocus(edit !== null, '.op-dialog', () => {if(!busy)setEdit(null);});
  const tenant = user?.sedeActivaId || user?.restauranteId;
  useEffect(() => {
    setItems([]);
    setEdit(null);
    setAdjust(null);
    setCursor(0);
    setHistory([]);
  }, [tenant]);
  useEffect(() => {
    const seq = ++generation.current,
      c = new AbortController();
    setBusy(true);
    setError('');
    const timer = setTimeout(() => {
      api.get('/inventario/detallado/items', {
        params: {
          q,
          cursor
        },
        signal: c.signal
      }).then(r => {
        if (seq === generation.current) {
          setItems(r.data.data || []);
          setNext(r.data.nextCursor);
        }
      }).catch(e => {
        if (!c.signal.aborted && seq === generation.current) {
          setItems([]);
          setError(e.response?.data?.message || 'No se pudo consultar el inventario.');
        }
      }).finally(() => {
        if (seq === generation.current) setBusy(false);
      });
    }, 220);
    return () => {
      clearTimeout(timer);
      c.abort();
    };
  }, [q, cursor, revision, tenant]);
  useEffect(() => {
    const seq = generation.current;
    obtenerMovimientosInventario(30).then(d => {
      if (seq === generation.current) setMovements(d);
    }).catch(() => setMovements([]));
  }, [revision, tenant]);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const seq = generation.current;
    try {
      await api[edit.id ? 'put' : 'post']('/inventario/detallado/items' + (edit.id ? '/' + edit.id : ''), edit);
      if (seq === generation.current) {
        setEdit(null);
        setRevision(v => v + 1);
      }
    } catch (e) {
      if (seq === generation.current) setError(e.response?.data?.message || 'No se guardó el artículo.');
    } finally {
      if (seq === generation.current) setBusy(false);
    }
  }
  async function stock(payload) {
    try {
      await ajustarStock(payload);
      setAdjust(null);
      setRevision(v => v + 1);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo ajustar el stock.');
      throw e;
    }
  }
  function exportCSV() {
    const cell = v => '"' + String(v ?? '').replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""') + '"';
    const rows = [['Artículo', 'SKU', 'Sección', 'Unidad', 'Existencias', 'Mínimo', 'Costo unitario', 'Valor de existencias', 'Proveedor', 'Ubicación', 'Lote referencia', 'Vencimiento referencia'], ...items.map(i => [i.nombre, i.ficha?.codigo, i.categoria, i.unidad, i.stockActual, i.stockMinimo, i.costoUnitario, i.costoUnitario == null ? '' : Number(i.stockActual) * Number(i.costoUnitario), i.ficha?.proveedor, i.ficha?.ubicacion, i.ficha?.lote, i.ficha?.vencimiento])];
    const u = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(r => r.map(cell).join(';')).join('\r\n')], {
      type: 'text/csv;charset=utf-8'
    }));
    const a = document.createElement('a');
    a.href = u;
    a.download = 'inventario-pagina.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  }
  const valued = items.filter(i => i.costoUnitario != null),
    value = valued.reduce((s, i) => s + Number(i.stockActual) * Number(i.costoUnitario), 0);
  return <div className="op-workspace"><header className="op-hero"><div><small>CONTROL DE TU RESTAURANTE</small><h1>Inventario</h1><p>Cada artículo, su costo y sus movimientos. Un lugar para cuidar tu operación.</p></div><button className="op-button" onClick={() => {
        setError('');
        setEdit(structuredClone(empty));
      }}>+ Nuevo artículo</button></header><div className="op-kpis"><article><small>Artículos en esta página</small><strong>{items.length}</strong></article><article><small>Valor con costo registrado · esta página</small><strong>{money(value)}</strong><span>{items.length - valued.length} artículos sin costo</span></article><article><small>Existencias bajo el mínimo · esta página</small><strong>{items.filter(i => Number(i.stockActual) <= Number(i.stockMinimo)).length}</strong></article></div><div className="op-toolbar"><label>Buscar nombre o sección<input type="search" value={q} onChange={e => {
          setQ(e.target.value);
          setCursor(0);
          setHistory([]);
        }} placeholder="Ej. bebidas, carne, café…" /></label><button onClick={exportCSV} disabled={!items.length}>Exportar página CSV</button><button onClick={() => setRevision(v => v + 1)} disabled={busy}>Actualizar</button></div>{error && <p className="op-error" role="alert">{error}</p>}<div className="op-table-wrap" aria-busy={busy}><table><thead><tr>{['Artículo / SKU', 'Sección', 'Existencias', 'Mínimo', 'Costo / valor', 'Proveedor / ubicación', 'Acciones'].map(s => <th key={s}>{s}</th>)}</tr></thead><tbody>{items.map(i => <tr key={i.id}><td><strong>{i.nombre}</strong><small>{i.ficha?.codigo || 'Sin código'} · {i.unidad}</small>{i.ficha?.codigoBarras && <small>{i.ficha.codigoBarras}</small>}</td><td>{i.categoria}</td><td><span className={'op-stock ' + (Number(i.stockActual) <= Number(i.stockMinimo) ? 'low' : '')}>{i.stockActual}</span></td><td>{i.stockMinimo}</td><td>{i.costoUnitario == null ? 'Sin costo' : money(i.costoUnitario)}<small>{i.costoUnitario == null ? '' : money(Number(i.stockActual) * Number(i.costoUnitario))}</small></td><td>{i.ficha?.proveedor || '—'}<small>{i.ficha?.ubicacion || 'Sin ubicación'}</small>{i.ficha?.vencimiento && <small>Vence: {i.ficha.vencimiento}</small>}</td><td><div className="op-actions"><button onClick={() => {
                  setError('');
                  setEdit(structuredClone(i));
                }}>Editar ficha</button><button onClick={() => setAdjust(i)}>Movimiento</button></div></td></tr>)}</tbody></table>{!items.length && !busy && <p className="op-empty">{q ? 'No hay artículos para esta búsqueda.' : 'Crea tu primer artículo y registra una entrada para cargar existencias.'}</p>}{busy && <p role="status">Consultando inventario…</p>}</div><nav className="op-pagination" aria-label="Páginas del inventario"><button disabled={!history.length || busy} onClick={() => {
        setCursor(history.at(-1));
        setHistory(h => h.slice(0, -1));
      }}>Anterior</button><span>Hasta 100 artículos por página</span><button disabled={!next || busy} onClick={() => {
        setHistory(h => [...h, cursor]);
        setCursor(next);
      }}>Siguiente</button></nav><section className="op-movements"><h2>Entradas, salidas y ajustes</h2><p>Últimos 30 movimientos del restaurante. Las existencias cambian mediante movimientos, nunca editando la ficha.</p><InventarioMovimientos movimientos={movements} /></section>{edit && <div className="op-overlay"><form className="op-dialog" role="dialog" aria-modal="true" aria-labelledby="op-item-title" onSubmit={save}><header><div><small>FICHA DE INVENTARIO</small><h2 id="op-item-title">{edit.id ? 'Editar artículo' : 'Nuevo artículo'}</h2></div><button type="button" onClick={() => setEdit(null)} disabled={busy} aria-label="Cerrar ficha">×</button></header><div className="op-dialog-body"><div className="op-fields">{[['nombre', 'Nombre del artículo'], ['categoria', 'Sección']].map(([k, t]) => <label key={k}>{t}<input value={edit[k]} required={k === 'nombre'} maxLength={k === 'nombre' ? 150 : 80} onChange={e => setEdit({
                ...edit,
                [k]: e.target.value
              })} /></label>)}<label>Unidad<select value={edit.unidad} disabled={Boolean(edit.id)} onChange={e => setEdit({
                ...edit,
                unidad: e.target.value
              })}>{['unidad', 'kg', 'g', 'litro', 'ml', 'porcion'].map(u => <option key={u}>{u}</option>)}</select></label>{[['stockMinimo', 'Existencias mínimas'], ['costoUnitario', 'Costo unitario COP']].map(([k, t]) => <label key={k}>{t}<input type="number" min="0" step="0.001" value={edit[k] ?? ''} onChange={e => setEdit({
                ...edit,
                [k]: e.target.value
              })} /></label>)}</div><FichaFields inventory value={edit.ficha} onChange={ficha => setEdit({
            ...edit,
            ficha
          })} /><p className="op-note">Lote y vencimiento son referencias de la ficha. Esta etapa no separa existencias por múltiples lotes. Los artículos nuevos inician en cero: registra una entrada después de guardar.</p>{error && <p role="alert" className="op-error">{error}</p>}</div><footer><button type="button" onClick={() => setEdit(null)} disabled={busy}>Cancelar</button><button className="op-button" disabled={busy}>Guardar artículo</button></footer></form></div>}<ModalAjusteStock abierto={Boolean(adjust)} item={adjust} onCerrar={() => setAdjust(null)} onGuardar={stock} /></div>;
}
