// admin-web/src/components/ModificadoresProducto.jsx
// ======================================================================
// 🧩 ModificadoresProducto — COMANDA Admin (Enterprise 2026)
// ----------------------------------------------------------------------
// • UI aislada para gestionar modificadores por producto
// • Recibe productoId por props
// • Permite: crear grupo, asignar a producto, crear opción, listar, reorden visual
// • NO rompe flujo de ProductosEditar.jsx
// • Sin axios directo: usa modificadoresService
// ======================================================================

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import {
  asignarGrupoProducto,
  crearGrupoModificador,
  crearOpcionGrupo,
  obtenerModificadoresProducto
} from '../services/modificadoresService';

import '../styles/Modificadores.css';

function safeNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function ordenarPorOrdenAsc(items) {
  const lista = Array.isArray(items) ? [...items] : [];
  lista.sort((a, b) => safeNumber(a?.orden) - safeNumber(b?.orden));
  return lista;
}

function formatearResumenGrupo(grupo) {
  const obligatorio = Boolean(grupo?.obligatorio);
  const tipo = grupo?.tipoSeleccion || 'multiple';
  const min = grupo?.minSeleccion ?? null;
  const max = grupo?.maxSeleccion ?? null;

  const partes = [];
  partes.push(tipo === 'unica' ? 'Selección única' : 'Selección múltiple');
  if (obligatorio) partes.push('Obligatorio');
  if (min !== null && min !== undefined) partes.push(`Min: ${min}`);
  if (max !== null && max !== undefined) partes.push(`Max: ${max}`);

  return partes.join(' · ');
}

export default function ModificadoresProducto({ productoId }) {
  const [abierto, setAbierto] = useState(true);

  const [cargando, setCargando] = useState(false);
  const [operando, setOperando] = useState(false);

  const [grupos, setGrupos] = useState([]);

  const [nuevoGrupo, setNuevoGrupo] = useState({
    nombre: '',
    tipoSeleccion: 'multiple',
    obligatorio: false,
    minSeleccion: '',
    maxSeleccion: ''
  });

  const [opcionPorGrupo, setOpcionPorGrupo] = useState({});
  const [grupoExpandido, setGrupoExpandido] = useState(null);

  const existeProductoId = useMemo(() => Boolean(productoId), [productoId]);

  async function cargar() {
    if (!existeProductoId) return;

    try {
      setCargando(true);
      const data = await obtenerModificadoresProducto(productoId);
      const normalizado = ordenarPorOrdenAsc(data).map((g) => ({
        ...g,
        opciones: ordenarPorOrdenAsc(g?.opciones)
      }));
      setGrupos(normalizado);
    } catch (err) {
      toast.error(err?.message || 'No se pudieron cargar los modificadores');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoId]);

  const siguienteOrdenGrupo = useMemo(() => {
    const maxOrden = grupos.reduce((acc, g) => Math.max(acc, safeNumber(g?.orden)), 0);
    return maxOrden + 1;
  }, [grupos]);

  function obtenerSiguienteOrdenOpcion(grupoId) {
    const grupo = grupos.find((g) => String(g?.id) === String(grupoId));
    const opciones = Array.isArray(grupo?.opciones) ? grupo.opciones : [];
    const maxOrden = opciones.reduce((acc, o) => Math.max(acc, safeNumber(o?.orden)), 0);
    return maxOrden + 1;
  }

  function cambiarNuevoGrupo(patch) {
    setNuevoGrupo((prev) => ({ ...prev, ...patch }));
  }

  function cambiarOpcionGrupo(grupoId, patch) {
    setOpcionPorGrupo((prev) => ({
      ...prev,
      [grupoId]: { ...(prev?.[grupoId] || {}), ...patch }
    }));
  }

  async function onCrearGrupoYAsignar() {
    if (!existeProductoId) {
      toast.warning('productoId es obligatorio');
      return;
    }

    const nombre = (nuevoGrupo.nombre || '').trim();
    if (!nombre) {
      toast.warning('El nombre del grupo es obligatorio');
      return;
    }

    const tipoSeleccion = nuevoGrupo.tipoSeleccion || 'multiple';
    const obligatorio = Boolean(nuevoGrupo.obligatorio);

    const minRaw = (nuevoGrupo.minSeleccion ?? '').toString().trim();
    const maxRaw = (nuevoGrupo.maxSeleccion ?? '').toString().trim();

    const minSeleccion = minRaw === '' ? null : safeNumber(minRaw, null);
    const maxSeleccion = maxRaw === '' ? null : safeNumber(maxRaw, null);

    if (minSeleccion !== null && minSeleccion < 0) {
      toast.warning('Min selección inválido');
      return;
    }
    if (maxSeleccion !== null && maxSeleccion < 0) {
      toast.warning('Max selección inválido');
      return;
    }
    if (minSeleccion !== null && maxSeleccion !== null && minSeleccion > maxSeleccion) {
      toast.warning('Min no puede ser mayor que Max');
      return;
    }

    const payloadGrupo = {
      nombre,
      tipoSeleccion,
      obligatorio,
      minSeleccion,
      maxSeleccion,
      orden: siguienteOrdenGrupo
    };

    try {
      setOperando(true);

      const grupoCreado = await crearGrupoModificador(payloadGrupo);

      await asignarGrupoProducto({
        productoId,
        grupoModificadorId: grupoCreado?.id
      });

      toast.success('Grupo creado y asignado al producto');

      setNuevoGrupo({
        nombre: '',
        tipoSeleccion: 'multiple',
        obligatorio: false,
        minSeleccion: '',
        maxSeleccion: ''
      });

      setGrupoExpandido(grupoCreado?.id || null);

      await cargar();
    } catch (err) {
      toast.error(err?.message || 'No se pudo crear/asignar el grupo');
    } finally {
      setOperando(false);
    }
  }

  async function onCrearOpcion(grupoId) {
    const draft = opcionPorGrupo?.[grupoId] || {};
    const nombre = (draft.nombre || '').trim();
    if (!nombre) {
      toast.warning('El nombre de la opción es obligatorio');
      return;
    }

    const precioExtra = safeNumber(draft.precioExtra, 0);
    const tipo = draft.tipo || 'opcion';

    const payload = {
      nombre,
      precioExtra,
      tipo,
      orden: obtenerSiguienteOrdenOpcion(grupoId)
    };

    try {
      setOperando(true);
      await crearOpcionGrupo(grupoId, payload);
      toast.success('Opción creada');

      setOpcionPorGrupo((prev) => ({
        ...prev,
        [grupoId]: { nombre: '', precioExtra: '', tipo: 'opcion' }
      }));

      await cargar();
    } catch (err) {
      toast.error(err?.message || 'No se pudo crear la opción');
    } finally {
      setOperando(false);
    }
  }

  function moverGrupo(grupoId, direccion) {
    const idx = grupos.findIndex((g) => String(g?.id) === String(grupoId));
    if (idx === -1) return;

    const nuevo = [...grupos];
    const swapWith = direccion === 'up' ? idx - 1 : idx + 1;

    if (swapWith < 0 || swapWith >= nuevo.length) return;

    const tmp = nuevo[idx];
    nuevo[idx] = nuevo[swapWith];
    nuevo[swapWith] = tmp;

    setGrupos(nuevo);

    toast.info(
      'Orden actualizado localmente. Para persistir, se requiere endpoint de actualización de orden.'
    );
  }

  function moverOpcion(grupoId, opcionId, direccion) {
    const grupoIdx = grupos.findIndex((g) => String(g?.id) === String(grupoId));
    if (grupoIdx === -1) return;

    const grupo = grupos[grupoIdx];
    const opciones = Array.isArray(grupo?.opciones) ? [...grupo.opciones] : [];

    const idx = opciones.findIndex((o) => String(o?.id) === String(opcionId));
    if (idx === -1) return;

    const swapWith = direccion === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= opciones.length) return;

    const tmp = opciones[idx];
    opciones[idx] = opciones[swapWith];
    opciones[swapWith] = tmp;

    const nuevo = [...grupos];
    nuevo[grupoIdx] = { ...grupo, opciones };
    setGrupos(nuevo);

    toast.info(
      'Orden actualizado localmente. Para persistir, se requiere endpoint de actualización de orden.'
    );
  }

  if (!existeProductoId) {
    return (
      <div className="modificadores fo-card">
        <div className="modificadores-header">
          <div>
            <h2 className="modificadores-title">Modificadores</h2>
            <p className="modificadores-subtitle">No se recibió productoId.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="modificadores fo-card">
      <header className="modificadores-header">
        <div className="modificadores-header-left">
          <div>
            <h2 className="modificadores-title">Modificadores</h2>
            <p className="modificadores-subtitle">
              Configura “Ingredientes”, “Extras”, “Tamaño”, etc. por producto.
            </p>
          </div>

          <div className="modificadores-badges">
            <span className="modificadores-badge">{grupos.length} grupos</span>
            <span className="modificadores-badge">
              {grupos.reduce(
                (acc, g) => acc + (Array.isArray(g?.opciones) ? g.opciones.length : 0),
                0
              )}{' '}
              opciones
            </span>
          </div>
        </div>

        <div className="modificadores-header-right">
          <button
            type="button"
            className="modificadores-btn secundario"
            onClick={() => setAbierto((v) => !v)}
          >
            {abierto ? 'Ocultar' : 'Mostrar'}
          </button>

          <button
            type="button"
            className="modificadores-btn"
            disabled={cargando || operando}
            onClick={cargar}
          >
            {cargando ? 'Cargando...' : 'Refrescar'}
          </button>
        </div>
      </header>

      {abierto && (
        <>
          <div className="modificadores-divider" />

          {/* ===================== CREAR GRUPO (INLINE) ===================== */}
          <div className="modificadores-crear fo-glass">
            <div className="modificadores-crear-top">
              <div>
                <h3 className="modificadores-h3">Crear grupo</h3>
                <p className="modificadores-help">
                  Primero creas el grupo y se asigna automáticamente a este producto.
                </p>
              </div>

              <button
                type="button"
                className="modificadores-btn"
                disabled={operando}
                onClick={onCrearGrupoYAsignar}
              >
                {operando ? 'Procesando...' : 'Crear y asignar'}
              </button>
            </div>

            <div className="modificadores-grid">
              <div className="modificadores-field">
                <label className="modificadores-label">Nombre</label>
                <input
                  className="modificadores-input"
                  value={nuevoGrupo.nombre}
                  onChange={(e) => cambiarNuevoGrupo({ nombre: e.target.value })}
                  placeholder="Ej: Ingredientes"
                />
              </div>

              <div className="modificadores-field">
                <label className="modificadores-label">Tipo selección</label>
                <select
                  className="modificadores-input"
                  value={nuevoGrupo.tipoSeleccion}
                  onChange={(e) => cambiarNuevoGrupo({ tipoSeleccion: e.target.value })}
                >
                  <option value="multiple">Multiple</option>
                  <option value="unica">Única</option>
                </select>
              </div>

              <div className="modificadores-field">
                <label className="modificadores-label">Obligatorio</label>
                <select
                  className="modificadores-input"
                  value={nuevoGrupo.obligatorio ? 'si' : 'no'}
                  onChange={(e) => cambiarNuevoGrupo({ obligatorio: e.target.value === 'si' })}
                >
                  <option value="no">No</option>
                  <option value="si">Sí</option>
                </select>
              </div>

              <div className="modificadores-field">
                <label className="modificadores-label">Min selección (opcional)</label>
                <input
                  className="modificadores-input"
                  type="number"
                  min="0"
                  value={nuevoGrupo.minSeleccion}
                  onChange={(e) => cambiarNuevoGrupo({ minSeleccion: e.target.value })}
                  placeholder="Ej: 0"
                />
              </div>

              <div className="modificadores-field">
                <label className="modificadores-label">Max selección (opcional)</label>
                <input
                  className="modificadores-input"
                  type="number"
                  min="0"
                  value={nuevoGrupo.maxSeleccion}
                  onChange={(e) => cambiarNuevoGrupo({ maxSeleccion: e.target.value })}
                  placeholder="Ej: 3"
                />
              </div>

              <div className="modificadores-field">
                <label className="modificadores-label">Orden</label>
                <input
                  className="modificadores-input"
                  value={String(siguienteOrdenGrupo)}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* ===================== LISTADO GRUPOS + OPCIONES ===================== */}
          <div className="modificadores-lista">
            {cargando ? (
              <div className="modificadores-empty">
                <p>Cargando modificadores...</p>
              </div>
            ) : grupos.length === 0 ? (
              <div className="modificadores-empty">
                <p>No hay grupos asignados a este producto aún.</p>
              </div>
            ) : (
              grupos.map((g, index) => {
                const expanded = String(grupoExpandido) === String(g?.id);
                const opciones = Array.isArray(g?.opciones) ? g.opciones : [];

                return (
                  <article
                    key={g.id}
                    className={`modificadores-grupo fo-glass ${expanded ? 'open' : ''}`}
                  >
                    <div className="modificadores-grupo-head">
                      <button
                        type="button"
                        className="modificadores-grupo-toggle"
                        onClick={() => setGrupoExpandido(expanded ? null : g.id)}
                      >
                        <div className="modificadores-grupo-titles">
                          <h4 className="modificadores-h4">{g?.nombre}</h4>
                          <p className="modificadores-meta">{formatearResumenGrupo(g)}</p>
                        </div>

                        <span className="modificadores-chip">{opciones.length} opciones</span>
                      </button>

                      <div className="modificadores-grupo-actions">
                        <button
                          type="button"
                          className="modificadores-icon-btn"
                          disabled={index === 0}
                          onClick={() => moverGrupo(g.id, 'up')}
                          title="Subir"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="modificadores-icon-btn"
                          disabled={index === grupos.length - 1}
                          onClick={() => moverGrupo(g.id, 'down')}
                          title="Bajar"
                        >
                          ↓
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <>
                        <div className="modificadores-divider" />

                        {/* Crear opción inline */}
                        <div className="modificadores-crear-opcion">
                          <div className="modificadores-crear-opcion-left">
                            <div className="modificadores-field">
                              <label className="modificadores-label">Opción</label>
                              <input
                                className="modificadores-input"
                                value={opcionPorGrupo?.[g.id]?.nombre || ''}
                                onChange={(e) =>
                                  cambiarOpcionGrupo(g.id, { nombre: e.target.value })
                                }
                                placeholder="Ej: Sin cebolla"
                              />
                            </div>

                            <div className="modificadores-field">
                              <label className="modificadores-label">Tipo</label>
                              <select
                                className="modificadores-input"
                                value={opcionPorGrupo?.[g.id]?.tipo || 'opcion'}
                                onChange={(e) => cambiarOpcionGrupo(g.id, { tipo: e.target.value })}
                              >
                                <option value="opcion">Opción</option>
                                <option value="extra">Extra</option>
                                <option value="remover">Remover</option>
                              </select>
                            </div>

                            <div className="modificadores-field">
                              <label className="modificadores-label">Precio extra</label>
                              <input
                                className="modificadores-input"
                                type="number"
                                step="1"
                                value={opcionPorGrupo?.[g.id]?.precioExtra || ''}
                                onChange={(e) =>
                                  cambiarOpcionGrupo(g.id, { precioExtra: e.target.value })
                                }
                                placeholder="0"
                              />
                            </div>

                            <div className="modificadores-field">
                              <label className="modificadores-label">Orden</label>
                              <input
                                className="modificadores-input"
                                value={String(obtenerSiguienteOrdenOpcion(g.id))}
                                disabled
                              />
                            </div>
                          </div>

                          <div className="modificadores-crear-opcion-right">
                            <button
                              type="button"
                              className="modificadores-btn"
                              disabled={operando}
                              onClick={() => onCrearOpcion(g.id)}
                            >
                              {operando ? 'Procesando...' : 'Agregar opción'}
                            </button>
                          </div>
                        </div>

                        {/* Lista opciones */}
                        <div className="modificadores-opciones">
                          {opciones.length === 0 ? (
                            <div className="modificadores-empty mini">
                              <p>Este grupo no tiene opciones activas aún.</p>
                            </div>
                          ) : (
                            opciones.map((o, oIndex) => (
                              <div key={o.id} className="modificadores-opcion">
                                <div className="modificadores-opcion-main">
                                  <span className="modificadores-opcion-nombre">{o?.nombre}</span>
                                  <span className="modificadores-opcion-pill">
                                    {o?.tipo || 'opcion'}
                                  </span>
                                  <span className="modificadores-opcion-precio">
                                    + {safeNumber(o?.precioExtra, 0).toLocaleString('es-CO')}
                                  </span>
                                </div>

                                <div className="modificadores-opcion-actions">
                                  <button
                                    type="button"
                                    className="modificadores-icon-btn"
                                    disabled={oIndex === 0}
                                    onClick={() => moverOpcion(g.id, o.id, 'up')}
                                    title="Subir"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    className="modificadores-icon-btn"
                                    disabled={oIndex === opciones.length - 1}
                                    onClick={() => moverOpcion(g.id, o.id, 'down')}
                                    title="Bajar"
                                  >
                                    ↓
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </article>
                );
              })
            )}
          </div>

          <div className="modificadores-note">
            <p>
              Nota: el reordenamiento con ↑ ↓ es visual/local. Para persistir el orden en backend se
              requiere un endpoint de actualización de <b>orden</b>.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
