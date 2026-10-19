import { useEffect, useMemo, useRef, useState } from 'react';
import { buildAssetUrl } from '../config/env';
import { formatCopInput, parseCopInput } from '../utils/copCurrency';
import ProductoEdiciones from './ProductoEdiciones';
import '../styles/Productos.css';

const PLACEHOLDER = '/img/placeholder-producto.svg';

const MODOS_STOCK = [
  {
    id: 'sin_control',
    titulo: 'Libre para vender',
    descripcion: 'El producto no bloquea ventas por stock.'
  },
  {
    id: 'producto',
    titulo: 'Stock propio',
    descripcion: 'Controla existencias directamente desde este producto.'
  },
  {
    id: 'inventario',
    titulo: 'Ligado a inventario',
    descripcion: 'Usa un item operativo del restaurante como fuente de verdad.'
  }
];

const DRAFT_VERSION = 3;
const DEFAULT_FORM = {
  nombre: '',
  precio: '',
  descripcion: '',
  alergenos: '',
  categoriaId: '',
  estado: 'activo',
  modoStock: 'sin_control',
  stock: '',
  stockMinimo: '',
  inventarioItemId: ''
};

function getDraftKey() {
  const sedeActivaId = localStorage.getItem('comanda_sede_activa_id') || 'principal';
  return `comanda:producto:nuevo:draft:v${DRAFT_VERSION}:${sedeActivaId}`;
}

function hasDraftContent(form, ediciones = []) {
  return Boolean(
    form.nombre?.trim() ||
      form.precio ||
      form.descripcion?.trim() ||
      form.alergenos?.trim() ||
      form.categoriaId ||
      form.modoStock !== 'sin_control' ||
      form.stock ||
      form.stockMinimo ||
      form.inventarioItemId ||
      ediciones.length
  );
}

function readDraft() {
  try {
    const raw = localStorage.getItem(getDraftKey());
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed?.version !== DRAFT_VERSION || !parsed?.form) return null;

    return {
      form: {
        ...DEFAULT_FORM,
        ...parsed.form
      },
      ediciones: Array.isArray(parsed.ediciones) ? parsed.ediciones : []
    };
  } catch {
    return null;
  }
}

function writeDraft(form, ediciones) {
  try {
    if (!hasDraftContent(form, ediciones)) {
      localStorage.removeItem(getDraftKey());
      return;
    }

    localStorage.setItem(
      getDraftKey(),
      JSON.stringify({
        version: DRAFT_VERSION,
        savedAt: new Date().toISOString(),
        form,
        ediciones
      })
    );
  } catch {
    // Sin storage disponible, el formulario sigue funcionando en memoria.
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(getDraftKey());
  } catch {
    // No-op
  }
}

function hasValidCategory(value, categorias = []) {
  const categoryId = String(value || '').trim();
  if (!categoryId) return false;
  return categorias.some((cat) => String(cat.id) === categoryId);
}

function getDefaultCategoryId(categorias = []) {
  return categorias[0]?.id ? String(categorias[0].id) : '';
}

const IconNuevo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const IconEditar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

function resolverModoStock(productoActual) {
  if (productoActual?.inventarioItemId) return 'inventario';
  if (productoActual?.controlarStock) return 'producto';
  return 'sin_control';
}

function normalizeProductoPrecio(precio) {
  const parsed = parseCopInput(precio);
  return parsed > 0 ? String(parsed) : '';
}

function limpiarEdicionesParaGuardar(ediciones = []) {
  return ediciones.map((grupo, grupoIndex) => ({
    ...(grupo.id ? { id: grupo.id } : {}),
    nombre: String(grupo.nombre || '').trim(),
    tipoSeleccion: grupo.tipoSeleccion === 'unica' ? 'unica' : 'multiple',
    obligatorio: Boolean(grupo.obligatorio),
    minSeleccion: grupo.obligatorio ? Math.max(1, Number(grupo.minSeleccion || 1)) : 0,
    maxSeleccion:
      grupo.tipoSeleccion === 'unica'
        ? 1
        : Math.max(1, Number(grupo.maxSeleccion || grupo.opciones?.length || 1)),
    orden: grupoIndex + 1,
    opciones: (grupo.opciones || []).map((opcion, opcionIndex) => ({
      ...(opcion.id ? { id: opcion.id } : {}),
      nombre: String(opcion.nombre || '').trim(),
      precioExtra: Number(opcion.precioExtra || 0),
      tipo: ['extra', 'remover'].includes(opcion.tipo) ? opcion.tipo : 'opcion',
      orden: opcionIndex + 1
    }))
  }));
}

export default function ModalProducto({
  open,
  onClose,
  onSubmit,
  categorias,
  inventarioItems = [],
  loadingInventario = false,
  productoActual,
  onOpenCategoriaQuickCreate
}) {
  const esEdicion = Boolean(productoActual?.id);
  const fileInputRef = useRef(null);
  const initKeyRef = useRef('');

  const [form, setForm] = useState({
    ...DEFAULT_FORM
  });

  const [preview, setPreview] = useState('');
  const [file, setFile] = useState(null);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [ediciones, setEdiciones] = useState([]);
  const [cargandoEdiciones, setCargandoEdiciones] = useState(false);
  const [errorCargaEdiciones, setErrorCargaEdiciones] = useState('');

  const itemSeleccionado = useMemo(
    () =>
      inventarioItems.find((item) => String(item.id) === String(form.inventarioItemId)) || null,
    [inventarioItems, form.inventarioItemId]
  );

  const resetForm = ({ clearSavedDraft = false, categoriaId = '' } = {}) => {
    if (clearSavedDraft) clearDraft();
    setForm({
      ...DEFAULT_FORM,
      categoriaId
    });
    setPreview('');
    setFile(null);
    setErrores({});
    setGuardando(false);
    setDragOver(false);
    setEdiciones([]);
    setCargandoEdiciones(false);
    setErrorCargaEdiciones('');
  };

  useEffect(() => {
    if (!open) {
      initKeyRef.current = '';
      return;
    }

    const initKey = esEdicion ? `edit:${productoActual.id}` : 'new';
    if (initKeyRef.current === initKey) return;
    initKeyRef.current = initKey;

    if (productoActual?.estado === 'eliminado') {
      onClose();
      return;
    }

    if (esEdicion) {
      setForm({
        nombre: productoActual.nombre || '',
        precio: normalizeProductoPrecio(productoActual.precio),
        descripcion: productoActual.descripcion || '',
        alergenos: productoActual?.plato?.alergenos || productoActual.alergenos || '',
        categoriaId: productoActual.categoriaId || productoActual?.categoria?.id || '',
        estado: productoActual.estado || 'activo',
        modoStock: resolverModoStock(productoActual),
        stock: productoActual.stockFuente === 'producto'
          ? String(productoActual.stockActual ?? productoActual.stock ?? 0)
          : String(productoActual.stock ?? ''),
        stockMinimo: productoActual.stockFuente === 'producto'
          ? String(productoActual.stockMinimo ?? 0)
          : String(productoActual.stockMinimo ?? ''),
        inventarioItemId: productoActual.inventarioItemId || ''
      });

      const img = productoActual.imagen
        ? buildAssetUrl(`uploads/productos/${productoActual.imagen}`)
        : productoActual.imagenUrl || '';

      setPreview(img);
      setFile(null);
      setErrores({});
      setGuardando(false);
      setEdiciones([]);
      setCargandoEdiciones(false);
      setErrorCargaEdiciones('');
      return;
    }

    const draft = readDraft();
    setForm({
      ...DEFAULT_FORM,
      ...(draft?.form || {}),
      categoriaId: productoActual?.categoriaId || draft?.form?.categoriaId || ''
    });
    setEdiciones(draft?.ediciones || []);
    setErrorCargaEdiciones('');
    setPreview('');
    setFile(null);
    setErrores({});
    setGuardando(false);
    setDragOver(false);
  }, [esEdicion, open, productoActual]);

  useEffect(() => {
    if (!open || esEdicion || !productoActual?.categoriaId) return;

    setForm((prev) =>
      String(prev.categoriaId || '') === String(productoActual.categoriaId)
        ? prev
        : { ...prev, categoriaId: productoActual.categoriaId }
    );
  }, [esEdicion, open, productoActual?.categoriaId]);

  useEffect(() => {
    if (!open || esEdicion || categorias.length === 0) return;

    setForm((prev) => {
      if (hasValidCategory(prev.categoriaId, categorias)) return prev;
      return {
        ...prev,
        categoriaId: getDefaultCategoryId(categorias)
      };
    });
  }, [categorias, esEdicion, open]);

  useEffect(() => {
    if (!open || esEdicion) return undefined;

    const timeout = window.setTimeout(() => {
      writeDraft(form, ediciones);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [ediciones, esEdicion, form, open]);

  useEffect(() => {
    if (form.modoStock !== 'inventario' && form.inventarioItemId) {
      setForm((prev) => ({ ...prev, inventarioItemId: '' }));
    }
  }, [form.modoStock, form.inventarioItemId]);

  const validar = () => {
    const err = {};
    const precioCop = parseCopInput(form.precio);
    if (!form.nombre.trim()) err.nombre = 'El nombre es obligatorio.';
    if (!precioCop || precioCop <= 0) err.precio = 'Ingresa un precio valido en COP.';
    if (!hasValidCategory(form.categoriaId, categorias)) err.categoriaId = 'Selecciona una categoria valida.';

    if (form.modoStock === 'producto') {
      if (form.stock === '' || Number(form.stock) < 0) err.stock = 'Define un stock valido.';
      if (form.stockMinimo === '' || Number(form.stockMinimo) < 0) err.stockMinimo = 'Define un minimo valido.';
    }

    if (form.modoStock === 'inventario' && !form.inventarioItemId) {
      err.inventarioItemId = 'Debes seleccionar un item del inventario.';
    }

    ediciones.forEach((grupo, grupoIndex) => {
      const etiquetaGrupo = grupo.nombre?.trim() || `Grupo ${grupoIndex + 1}`;
      if (!grupo.nombre?.trim()) {
        err.ediciones = 'Todos los grupos deben tener nombre.';
      }
      if (!Array.isArray(grupo.opciones) || grupo.opciones.length === 0) {
        err.ediciones = `"${etiquetaGrupo}" necesita al menos una opcion.`;
      }
      if (grupo.opciones?.some((opcion) => !opcion.nombre?.trim())) {
        err.ediciones = `Completa el nombre de todas las opciones en "${etiquetaGrupo}".`;
      }
      if (
        grupo.tipoSeleccion === 'multiple' &&
        Number(grupo.maxSeleccion || 0) > grupo.opciones?.length
      ) {
        err.ediciones = `El maximo de "${etiquetaGrupo}" supera las opciones disponibles.`;
      }
    });

    setErrores(err);
    return Object.keys(err).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handlePriceBlur = () => {
    setForm((prev) => ({
      ...prev,
      precio: formatCopInput(prev.precio)
    }));
  };

  const procesarArchivo = (archivo) => {
    if (!archivo) return;
    if (archivo.size > 2 * 1024 * 1024) {
      setErrores((prev) => ({ ...prev, imagen: 'La imagen no debe superar 2 MB.' }));
      return;
    }
    setFile(archivo);
    setPreview(URL.createObjectURL(archivo));
    setErrores((prev) => ({ ...prev, imagen: null }));
  };

  const quitarImagen = () => {
    setFile(null);
    setPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (guardando || cargandoEdiciones || errorCargaEdiciones) return;
    if (!validar()) return;

    setGuardando(true);

    const fd = new FormData();
    fd.append('nombre', form.nombre);
    fd.append('precio', String(parseCopInput(form.precio)));
    fd.append('descripcion', form.descripcion);
    fd.append('alergenos', form.alergenos);
    fd.append('categoriaId', form.categoriaId);
    fd.append('estado', form.estado);
    fd.append('controlarStock', form.modoStock === 'sin_control' ? 'false' : 'true');
    fd.append('stock', form.modoStock === 'producto' ? String(Number(form.stock || 0)) : '0');
    fd.append('stockMinimo', form.modoStock === 'producto' ? String(Number(form.stockMinimo || 0)) : '0');
    fd.append('inventarioItemId', form.modoStock === 'inventario' ? String(form.inventarioItemId) : '');

    if (file) fd.append('imagen', file);

    const ok = await onSubmit(fd, limpiarEdicionesParaGuardar(ediciones));
    setGuardando(false);
    if (ok) {
      resetForm({ clearSavedDraft: !esEdicion });
      onClose();
    }
  };

  useEffect(() => {
    if (!open) return;
    const handler = (event) => {
      if (event.key === 'Escape' && !guardando) onClose();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [guardando, onClose, open]);

  if (!open) return null;

  const imagenActual = preview || PLACEHOLDER;

  return (
    <div className="pm-overlay" onClick={(event) => { if (event.target === event.currentTarget && !guardando) onClose(); }}>
      <div className="pm-modal" role="dialog" aria-modal="true">
        <div className="pm-header">
          <div className="pm-header-info">
            <div className={`pm-header-icon ${esEdicion ? 'pm-header-icon-edit' : 'pm-header-icon-new'}`}>
              {esEdicion ? <IconEditar /> : <IconNuevo />}
            </div>
            <div>
              <h2 className="pm-title">{esEdicion ? 'Editar producto' : 'Nuevo producto'}</h2>
              <p className="pm-subtitle">
                {esEdicion ? `Modificando "${form.nombre || '...'}"` : 'Completa los datos y define como gobernar su stock.'}
              </p>
            </div>
          </div>
          <button className="pm-close" onClick={onClose} disabled={guardando} aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="pm-body">
          <div className="pm-col">
            <div className="pm-field">
              <label className="pm-label">Nombre del producto <span className="pm-required">*</span></label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej: Hamburguesa Doble Carne"
                className={`pm-input ${errores.nombre ? 'pm-input-error' : ''}`}
                disabled={guardando}
                autoFocus
                maxLength={100}
              />
              {errores.nombre && <span className="pm-error">{errores.nombre}</span>}
            </div>

            <div className="pm-field">
              <label className="pm-label">Precio (COP) <span className="pm-required">*</span></label>
              <div className="pm-input-prefix-wrap">
                <span className="pm-input-prefix">$</span>
                <input
                  name="precio"
                  type="text"
                  inputMode="numeric"
                  value={form.precio}
                  onChange={handleChange}
                  onBlur={handlePriceBlur}
                  placeholder="Ej: 32.800"
                  className={`pm-input pm-input-prefixed ${errores.precio ? 'pm-input-error' : ''}`}
                  disabled={guardando}
                />
              </div>
              {errores.precio && <span className="pm-error">{errores.precio}</span>}
            </div>

            <div className="pm-field">
              <label className="pm-label">Categoria <span className="pm-required">*</span></label>
              <div className="pm-select-row">
                <select
                  name="categoriaId"
                  value={form.categoriaId || ''}
                  onChange={handleChange}
                  className={`pm-select ${errores.categoriaId ? 'pm-input-error' : ''}`}
                  disabled={guardando}
                >
                  <option value="">- Selecciona -</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="pm-btn-add-cat"
                  onClick={onOpenCategoriaQuickCreate}
                  title="Nueva categoria"
                  disabled={guardando}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
              {errores.categoriaId && <span className="pm-error">{errores.categoriaId}</span>}
            </div>

            <div className="pm-field">
              <label className="pm-label">Estado operativo</label>
              <div className="pm-estado-tabs">
                {['activo', 'inactivo'].map((op) => (
                  <button
                    key={op}
                    type="button"
                    className={`pm-estado-tab ${form.estado === op ? `pm-estado-tab-active-${op}` : ''}`}
                    onClick={() => setForm((prev) => ({ ...prev, estado: op }))}
                    disabled={guardando}
                  >
                    <span className={`pm-dot ${op}`} />
                    {op === 'activo' ? 'Activo' : 'Inactivo'}
                  </button>
                ))}
              </div>
            </div>

            <div className="pm-field">
              <label className="pm-label">Gobernanza de stock</label>
              <div className="pm-stock-modes">
                {MODOS_STOCK.map((modo) => (
                  <button
                    key={modo.id}
                    type="button"
                    className={`pm-stock-mode ${form.modoStock === modo.id ? 'is-active' : ''}`}
                    onClick={() => setForm((prev) => ({ ...prev, modoStock: modo.id }))}
                    disabled={guardando}
                  >
                    <strong>{modo.titulo}</strong>
                    <span>{modo.descripcion}</span>
                  </button>
                ))}
              </div>
            </div>

            {form.modoStock === 'producto' && (
              <div className="pm-stock-grid">
                <div className="pm-field">
                  <label className="pm-label">Stock actual</label>
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={handleChange}
                    className={`pm-input ${errores.stock ? 'pm-input-error' : ''}`}
                    disabled={guardando}
                  />
                  {errores.stock && <span className="pm-error">{errores.stock}</span>}
                </div>

                <div className="pm-field">
                  <label className="pm-label">Minimo recomendado</label>
                  <input
                    name="stockMinimo"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stockMinimo}
                    onChange={handleChange}
                    className={`pm-input ${errores.stockMinimo ? 'pm-input-error' : ''}`}
                    disabled={guardando}
                  />
                  {errores.stockMinimo && <span className="pm-error">{errores.stockMinimo}</span>}
                </div>
              </div>
            )}

            {form.modoStock === 'inventario' && (
              <div className="pm-field">
                <label className="pm-label">Item del inventario</label>
                <select
                  name="inventarioItemId"
                  value={form.inventarioItemId}
                  onChange={handleChange}
                  className={`pm-select ${errores.inventarioItemId ? 'pm-input-error' : ''}`}
                  disabled={guardando || loadingInventario}
                >
                  <option value="">{loadingInventario ? 'Cargando inventario...' : '- Selecciona un item -'}</option>
                  {inventarioItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre} · {item.stockActual} {item.unidad}
                    </option>
                  ))}
                </select>
                {errores.inventarioItemId && <span className="pm-error">{errores.inventarioItemId}</span>}
                {itemSeleccionado && (
                  <div className="pm-stock-link-card">
                    <strong>{itemSeleccionado.nombre}</strong>
                    <span>
                      Stock actual {itemSeleccionado.stockActual} · Minimo {itemSeleccionado.stockMinimo} · Estado {itemSeleccionado.estadoStock}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pm-col">
            <div className="pm-field pm-field-grow">
              <label className="pm-label">Descripcion <span className="pm-optional">Opcional</span></label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                placeholder="Describe ingredientes, sabor o presentacion del producto."
                className="pm-textarea"
                disabled={guardando}
                maxLength={500}
                rows={4}
              />
              <span className="pm-char-count">{form.descripcion.length}/500</span>
            </div>

            <div className="pm-allergen-panel">
              <div className="pm-allergen-head">
                <span className="pm-allergen-icon">!</span>
                <div>
                  <strong>Alergenos y trazas</strong>
                  <p>Se mostrara como aviso informativo en el menu QR.</p>
                </div>
              </div>
              <textarea
                name="alergenos"
                value={form.alergenos}
                onChange={handleChange}
                placeholder="Ej: gluten, lactosa, mani, huevo, frutos secos. Puede contener trazas."
                className="pm-textarea pm-allergen-textarea"
                disabled={guardando}
                maxLength={200}
                rows={3}
              />
              <div className="pm-allergen-chips" aria-hidden="true">
                {['Gluten', 'Lactosa', 'Mani', 'Huevo', 'Frutos secos'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="pm-allergen-chip"
                    onClick={() =>
                      setForm((prev) => {
                        const actual = String(prev.alergenos || '').trim();
                        if (actual.toLowerCase().includes(item.toLowerCase())) return prev;
                        return { ...prev, alergenos: actual ? `${actual}, ${item}` : item };
                      })
                    }
                    disabled={guardando}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <span className="pm-char-count">{form.alergenos.length}/200</span>
            </div>

            <div className="pm-field">
              <label className="pm-label">Imagen del producto</label>
              <div
                className={`pm-dropzone ${dragOver ? 'pm-dropzone-over' : ''} ${preview ? 'pm-dropzone-has-img' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOver(false);
                  procesarArchivo(event.dataTransfer.files[0]);
                }}
              >
                {preview ? (
                  <>
                    <img
                      src={imagenActual}
                      alt="Preview"
                      className="pm-preview-img"
                      onError={(event) => { event.currentTarget.src = PLACEHOLDER; }}
                    />
                    <div className="pm-preview-overlay">
                      <span className="pm-preview-change">Cambiar imagen</span>
                    </div>
                    <button
                      type="button"
                      className="pm-preview-remove"
                      onClick={(event) => { event.stopPropagation(); quitarImagen(); }}
                      title="Quitar imagen"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <div className="pm-dropzone-empty">
                    <div className="pm-dropzone-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="3" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <p className="pm-dropzone-text">
                      <strong>Arrastra una imagen</strong> o haz clic para seleccionar
                    </p>
                    <p className="pm-dropzone-hint">PNG · JPG · WebP · Max 2 MB</p>
                  </div>
                )}
              </div>

              {errores.imagen && <span className="pm-error">{errores.imagen}</span>}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => procesarArchivo(event.target.files[0])}
                disabled={guardando}
                style={{ display: 'none' }}
              />
            </div>

            <div className="pm-stock-summary" aria-label="Resumen de control del producto">
              <div className="pm-stock-summary-item">
                <strong>Fuente de verdad</strong>
                <span>
                  {form.modoStock === 'inventario'
                    ? 'El stock se descuenta desde inventario al aceptar pedidos.'
                    : form.modoStock === 'producto'
                      ? 'El producto mantiene su propia capacidad disponible.'
                      : 'El producto queda siempre vendible mientras siga activo.'}
                </span>
              </div>
              <div className="pm-stock-summary-item">
                <strong>Gobernanza por sede</strong>
                <span>Solo se muestran items del restaurante actual para evitar cruces entre negocios.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pm-ediciones-wrap">
          <ProductoEdiciones
            productoId={esEdicion ? productoActual.id : null}
            value={ediciones}
            onChange={setEdiciones}
            disabled={guardando}
            onLoadingChange={setCargandoEdiciones}
            onErrorChange={setErrorCargaEdiciones}
          />
          {errores.ediciones && <span className="pm-error pm-ediciones-error">{errores.ediciones}</span>}
        </div>

        <div className="pm-footer">
          <button className="pm-btn-cancel" onClick={onClose} disabled={guardando}>
            Cancelar
          </button>
          <button
            className="pm-btn-save"
            onClick={handleSave}
            disabled={guardando || cargandoEdiciones || Boolean(errorCargaEdiciones)}
          >
            {guardando || cargandoEdiciones ? (
              <>
                <span className="pm-spinner" />
                {cargandoEdiciones ? 'Cargando ediciones...' : 'Guardando...'}
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {esEdicion ? 'Guardar cambios' : 'Crear producto'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
