import { useEffect, useRef, useState } from 'react';
import { FiArrowRight, FiCheck, FiImage, FiPlus, FiX } from 'react-icons/fi';
import { organizarProductosDesdeFotos } from '../api/iaApi';
import { crearProducto, actualizarProducto } from '../api/productosApi';
import { applyIntakeSuggestions, intakeError, INTAKE_MAX, prepareIntakePhoto } from '../utils/productIntake.mjs';
import '../styles/ProductIntake.css';

export default function ProductIntake({ categories, canAssist, remaining, onSaved, onNewCategory }) {
  const [rows, setRows] = useState([]), [busy, setBusy] = useState(''), [notice, setNotice] = useState('');
  const urls = useRef(new Set()), lock = useRef(false), fileInput = useRef(null);
  useEffect(() => { const owned = urls.current; return () => owned.forEach(url => URL.revokeObjectURL(url)); }, []);
  const update = (id, values) => setRows(current => current.map(row => row.id === id ? { ...row, ...values, error: values.error ?? '' } : row));

  async function addPhotos(event) {
    const selected = [...event.target.files]; event.target.value = '';
    if (lock.current) return;
    if (selected.length + rows.length > INTAKE_MAX) { setNotice('Añade hasta cuatro fotos por lote.'); return; }
    lock.current = true; setBusy('photos'); setNotice('');
    const prepared = [];
    try { for (const file of selected) { const row = await prepareIntakePhoto(file); urls.current.add(row.preview); prepared.push(row); } setRows(current => [...current, ...prepared]); }
    catch (error) { prepared.forEach(row => { URL.revokeObjectURL(row.preview); urls.current.delete(row.preview); }); setNotice(error.message); }
    finally { lock.current = false; setBusy(''); }
  }
  async function assist() {
    if (lock.current || !rows.length || !canAssist) return;
    lock.current = true; setBusy('assist'); setNotice('');
    try {
      const pending = rows.filter(row => row.status === 'draft');
      const result = await organizarProductosDesdeFotos(pending.map(({ id, nombre, descripcion, photo }) => ({ id, nombre, descripcion, photo })));
      if (!Array.isArray(result?.data?.items)) throw Error('No recibimos una propuesta válida. Puedes completar los campos manualmente.');
      setRows(current => applyIntakeSuggestions(current, result.data.items));
      setNotice(result.data.cached ? 'Reutilizamos la organización anterior. Revisa cada campo antes de guardar.' : 'Propuesta lista. Confirma los nombres, las categorías y las descripciones; añade tus precios.');
    } catch (error) { setNotice(error.response?.data?.message || error.message || 'No pudimos organizar las fotos. Puedes completar los campos manualmente.'); }
    finally { lock.current = false; setBusy(''); }
  }
  async function saveDrafts() {
    if (lock.current) return;
    const pending = rows.filter(row => row.status === 'draft');
    if (pending.length > remaining) { setNotice('El lote supera los cupos disponibles de tu plan. Reduce la selección o revisa tu plan.'); return; }
    const invalid = pending.filter(row => intakeError(row));
    if (invalid.length) { setRows(current => current.map(row => ({ ...row, error: row.status === 'draft' ? intakeError(row) : row.error }))); setNotice('Revisa los campos señalados antes de guardar.'); return; }
    lock.current = true; setBusy('save'); setNotice('');
    let saved = 0;
    try {
      for (const row of pending) {
        const data = new FormData();
        for (const [key, value] of Object.entries({ nombre: row.nombre.trim(), descripcion: row.descripcion, precio: row.precio, categoriaId: row.categoriaId, estado: 'inactivo', activo: 'false', visibleEnMenu: 'false', visibleEnPOS: 'false', controlarStock: 'false', stock: '0', stockMinimo: '0', ediciones: '[]' })) data.append(key, value);
        data.append('imagen', row.file);
        try { const result = await crearProducto(data); const id = result?.data?.data?.id; if (!id) throw Error('Confirma en el catálogo si se creó este producto antes de volver a guardarlo.'); update(row.id, { status: 'saved', productId: id, error: '' }); saved++; }
        catch (error) { const status = error.response?.status; update(row.id, { status: !status || status >= 500 ? 'unknown' : 'draft', error: !status || status >= 500 ? 'No pudimos confirmar el guardado. Revisa el catálogo antes de intentarlo de nuevo.' : error.response?.data?.message || 'No se pudo guardar este producto.' }); break; }
      }
      setNotice(saved ? `${saved} producto(s) guardado(s) como borrador. Revisa los resultados antes de publicarlos.` : 'No se confirmó ningún guardado. Revisa los mensajes de cada producto.');
      await onSaved();
    } catch { setNotice('Los cambios confirmados se conservan. Actualiza el catálogo para comprobar el resultado.'); } finally { lock.current = false; setBusy(''); }
  }
  async function publishSaved() {
    if (lock.current) return;
    lock.current = true; setBusy('publish'); setNotice('');
    try { for (const row of rows.filter(item => item.status === 'saved')) { const data = new FormData(); for (const key of ['activo', 'visibleEnMenu', 'visibleEnPOS']) data.append(key, 'true'); data.append('estado', 'activo'); try { await actualizarProducto(row.productId, data); update(row.id, { status: 'published', error: '' }); } catch { update(row.id, { error: 'No pudimos confirmar la publicación. Revisa el producto en el catálogo.' }); break; } } setNotice('Revisa los estados de cada producto y comprueba tu menú público.'); await onSaved(); }
    catch { setNotice('Actualiza el catálogo para confirmar el estado de publicación.'); }
    finally { lock.current = false; setBusy(''); }
  }
  const pendingCount = rows.filter(row => row.status === 'draft').length;
  return <section className="pi-workspace" aria-labelledby="pi-title"><header><div><span className="pi-kicker">DE TUS FOTOS A TU CARTA</span><h3 id="pi-title">Sube. Revisa. Comparte.</h3><p>Añade hasta cuatro fotos, completa tus precios y guarda los productos en borrador antes de publicarlos.</p></div><FiImage size={32} aria-hidden="true" /></header>
    <div className="pi-toolbar"><input ref={fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={addPhotos} hidden /><button type="button" className="pi-primary" onClick={() => fileInput.current.click()} disabled={Boolean(busy) || rows.length >= INTAKE_MAX}><FiPlus /> {busy === 'photos' ? 'Preparando fotos…' : 'Añadir fotos'}</button><button type="button" className="pi-secondary" onClick={assist} disabled={Boolean(busy) || !pendingCount || !canAssist}>{busy === 'assist' ? 'Organizando…' : 'Organizar con asistente'} <FiArrowRight /></button><button type="button" className="pi-text" onClick={onNewCategory} disabled={Boolean(busy)}>Nueva categoría</button></div>
    <p className="pi-helper">{canAssist ? 'Una solicitud por lote; reutilizamos resultados iguales para evitar consumo repetido. Revisa las sugerencias: una foto no confirma ingredientes ni alérgenos.' : 'Puedes cargar y organizar tus productos manualmente. El asistente requiere disponibilidad en tu plan.'}</p>
    {!rows.length && <button type="button" className="pi-empty" onClick={() => fileInput.current.click()} disabled={Boolean(busy)}><FiImage size={30} /><strong>Empieza con las fotos de tus productos</strong><span>JPG, PNG o WEBP · Máximo 8 MB por foto · Optimizamos las fotos conservando sus proporciones.</span></button>}
    <div className="pi-grid">{rows.map((row, index) => { const disabled = Boolean(busy) || row.status !== 'draft'; return <article key={row.id} className="pi-row"><div className="pi-photo"><img src={row.preview} alt={`Foto del producto ${index + 1}`} /><span>{row.status === 'draft' ? 'Por revisar' : row.status === 'saved' ? 'Borrador guardado' : row.status === 'published' ? 'Publicado' : 'Revisar guardado'}</span>{row.status === 'draft' && <button type="button" aria-label={`Quitar foto ${index + 1}`} disabled={Boolean(busy)} onClick={() => { URL.revokeObjectURL(row.preview); urls.current.delete(row.preview); setRows(current => current.filter(item => item.id !== row.id)); }}><FiX /></button>}</div><div className="pi-fields"><label>Nombre<input value={row.nombre} onChange={event => update(row.id, { nombre: event.target.value })} maxLength={120} disabled={disabled} /></label><div className="pi-field-pair"><label>Precio en COP<input type="number" min="1" step="1" inputMode="numeric" placeholder="Ej. 24900" value={row.precio} onChange={event => update(row.id, { precio: event.target.value })} disabled={disabled} /></label><label>Categoría<select value={row.categoriaId} onChange={event => update(row.id, { categoriaId: event.target.value })} disabled={disabled}><option value="">Selecciona</option>{categories.map(category => <option key={category.id} value={category.id}>{category.nombre}</option>)}</select></label></div><label>Descripción<textarea value={row.descripcion} onChange={event => update(row.id, { descripcion: event.target.value })} maxLength={400} rows={3} disabled={disabled} /></label>{row.error && <p role="alert" className="pi-error">{row.error}</p>}</div></article>; })}</div>
    {notice && <p className="pi-notice" role="status">{notice}</p>}
    {rows.length > 0 && <footer><span>Los precios los defines tú. Nada se publica automáticamente.</span><div>{rows.every(row => ['saved', 'published'].includes(row.status)) && <button type="button" className="pi-text" disabled={Boolean(busy)} onClick={() => { rows.forEach(row => { URL.revokeObjectURL(row.preview); urls.current.delete(row.preview); }); setRows([]); setNotice('Los productos guardados siguen disponibles en tu catálogo. Añade las fotos del siguiente lote.'); }}>Nuevo lote</button>}<button type="button" className="pi-secondary" onClick={saveDrafts} disabled={Boolean(busy) || !pendingCount}>{busy === 'save' ? 'Guardando…' : 'Guardar borradores'} <FiCheck /></button><button type="button" className="pi-primary" onClick={publishSaved} disabled={Boolean(busy) || !rows.some(row => row.status === 'saved')}>{busy === 'publish' ? 'Publicando…' : 'Publicar los guardados'} <FiArrowRight /></button></div></footer>}
  </section>;
}
