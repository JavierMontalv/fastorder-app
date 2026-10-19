import { useEffect, useMemo, useState } from 'react';
import {
  FiChevronDown,
  FiChevronUp,
  FiCircle,
  FiCopy,
  FiEdit3,
  FiPlus,
  FiSquare,
  FiTrash2
} from 'react-icons/fi';
import { obtenerModificadoresProducto } from '../services/modificadoresService';
import { formatCopInput, parseCopInput } from '../utils/copCurrency';

const PLANTILLAS = {
  hamburguesa: [
    {
      nombre: 'Adiciones',
      tituloCliente: 'Elige tus adiciones',
      estiloControl: 'mas',
      tipoSeleccion: 'multiple',
      obligatorio: false,
      minSeleccion: 0,
      maxSeleccion: 3,
      opciones: [
        { nombre: 'Queso', precioExtra: 2500, tipo: 'extra' },
        { nombre: 'Tocineta', precioExtra: 4500, tipo: 'extra' },
        { nombre: 'Salsa adicional', precioExtra: 1500, tipo: 'extra' }
      ]
    },
    {
      nombre: 'Retirar ingredientes',
      tituloCliente: 'Personaliza tu hamburguesa',
      estiloControl: 'casilla',
      tipoSeleccion: 'multiple',
      obligatorio: false,
      minSeleccion: 0,
      maxSeleccion: 3,
      opciones: [
        { nombre: 'Sin cebolla', precioExtra: 0, tipo: 'remover' },
        { nombre: 'Sin tomate', precioExtra: 0, tipo: 'remover' },
        { nombre: 'Sin salsas', precioExtra: 0, tipo: 'remover' }
      ]
    },
    {
      nombre: 'Acompañamiento',
      tituloCliente: 'Elige tu acompañamiento',
      estiloControl: 'circulo',
      tipoSeleccion: 'unica',
      obligatorio: true,
      minSeleccion: 1,
      maxSeleccion: 1,
      opciones: [
        { nombre: 'Papas a la francesa', precioExtra: 0, tipo: 'opcion' },
        { nombre: 'Ensalada', precioExtra: 0, tipo: 'opcion' },
        { nombre: 'Yuca frita', precioExtra: 2000, tipo: 'opcion' }
      ]
    }
  ],
  cafe: [
    {
      nombre: 'Tipo de leche',
      tituloCliente: 'Elige el tipo de leche',
      estiloControl: 'circulo',
      tipoSeleccion: 'unica',
      obligatorio: true,
      minSeleccion: 1,
      maxSeleccion: 1,
      opciones: [
        { nombre: 'Leche entera', precioExtra: 0, tipo: 'opcion' },
        { nombre: 'Leche deslactosada', precioExtra: 1000, tipo: 'opcion' },
        { nombre: 'Leche de almendras', precioExtra: 2500, tipo: 'opcion' }
      ]
    },
    {
      nombre: 'Extras',
      tituloCliente: 'Personaliza tu bebida',
      estiloControl: 'mas',
      tipoSeleccion: 'multiple',
      obligatorio: false,
      minSeleccion: 0,
      maxSeleccion: 3,
      opciones: [
        { nombre: 'Shot de café', precioExtra: 2500, tipo: 'extra' },
        { nombre: 'Crema', precioExtra: 1500, tipo: 'extra' },
        { nombre: 'Sirope', precioExtra: 1500, tipo: 'extra' }
      ]
    }
  ],
  bebida: [
    {
      nombre: 'Tamaño',
      tituloCliente: 'Elige el tamaño',
      estiloControl: 'circulo',
      tipoSeleccion: 'unica',
      obligatorio: true,
      minSeleccion: 1,
      maxSeleccion: 1,
      opciones: [
        { nombre: 'Personal', precioExtra: 0, tipo: 'opcion' },
        { nombre: 'Mediana', precioExtra: 2000, tipo: 'opcion' },
        { nombre: 'Grande', precioExtra: 4000, tipo: 'opcion' }
      ]
    },
    {
      nombre: 'Preparación',
      tituloCliente: '¿Cómo la prefieres?',
      estiloControl: 'circulo',
      tipoSeleccion: 'unica',
      obligatorio: false,
      minSeleccion: 0,
      maxSeleccion: 1,
      opciones: [
        { nombre: 'Con hielo', precioExtra: 0, tipo: 'opcion' },
        { nombre: 'Sin hielo', precioExtra: 0, tipo: 'opcion' },
        { nombre: 'Con limón', precioExtra: 500, tipo: 'extra' }
      ]
    }
  ]
};

const CONTROLES_VISUALES = [
  { value: 'auto', label: 'Automático', Icon: FiEdit3 },
  { value: 'mas', label: 'Signo +', Icon: FiPlus },
  { value: 'casilla', label: 'Casilla', Icon: FiSquare },
  { value: 'circulo', label: 'Círculo', Icon: FiCircle }
];

const crearIdLocal = () =>
  `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function normalizarGrupo(grupo) {
  const tipoSeleccion = grupo?.tipoSeleccion === 'unica' ? 'unica' : 'multiple';
  const opciones = Array.isArray(grupo?.opciones)
    ? grupo.opciones.map((opcion) => ({
        ...opcion,
        _key: opcion?._key || (opcion?.id ? `opcion-${opcion.id}` : crearIdLocal()),
        nombre: opcion?.nombre || '',
        precioExtra: Number(opcion?.precioExtra || 0),
        tipo: opcion?.tipo || 'opcion'
      }))
    : [];

  return {
    ...grupo,
    _key: grupo?._key || (grupo?.id ? `grupo-${grupo.id}` : crearIdLocal()),
    nombre: grupo?.nombre || '',
    tituloCliente: grupo?.tituloCliente || '',
    estiloControl: ['mas', 'casilla', 'circulo'].includes(grupo?.estiloControl)
      ? grupo.estiloControl
      : 'auto',
    tipoSeleccion,
    obligatorio: Boolean(grupo?.obligatorio),
    minSeleccion: Number(
      grupo?.minSeleccion ?? (grupo?.obligatorio ? 1 : 0)
    ),
    maxSeleccion: Number(
      grupo?.maxSeleccion ?? (tipoSeleccion === 'unica' ? 1 : Math.max(opciones.length, 1))
    ),
    opciones
  };
}

function nuevoGrupo() {
  return normalizarGrupo({
    nombre: 'Nuevo grupo',
    tituloCliente: '',
    estiloControl: 'auto',
    tipoSeleccion: 'multiple',
    obligatorio: false,
    minSeleccion: 0,
    maxSeleccion: 1,
    opciones: [{ nombre: '', precioExtra: 0, tipo: 'opcion' }]
  });
}

export default function ProductoEdiciones({
  productoId,
  value,
  onChange,
  disabled = false,
  onLoadingChange,
  onErrorChange
}) {
  const [abierto, setAbierto] = useState(false);
  const [expandidos, setExpandidos] = useState(new Set());
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');

  const grupos = useMemo(() => (Array.isArray(value) ? value : []), [value]);
  const totalOpciones = useMemo(
    () => grupos.reduce((total, grupo) => total + (grupo.opciones?.length || 0), 0),
    [grupos]
  );

  useEffect(() => {
    if (!productoId) return undefined;
    let activo = true;

    const cargar = async () => {
      setCargando(true);
      setErrorCarga('');
      onErrorChange?.('');
      onLoadingChange?.(true);
      try {
        const data = await obtenerModificadoresProducto(productoId);
        if (activo) onChange(data.map(normalizarGrupo));
      } catch (error) {
        if (activo) {
          const mensaje =
            error?.message || 'No fue posible cargar las ediciones del producto.';
          setErrorCarga(mensaje);
          onErrorChange?.(mensaje);
        }
      } finally {
        if (activo) {
          setCargando(false);
          onLoadingChange?.(false);
        }
      }
    };

    cargar();
    return () => {
      activo = false;
    };
  }, [onChange, onErrorChange, onLoadingChange, productoId]);

  const actualizarGrupo = (key, patch) => {
    onChange(
      grupos.map((grupo) => {
        if (grupo._key !== key) return grupo;
        const siguiente = { ...grupo, ...patch };
        if (patch.tipoSeleccion === 'unica') {
          siguiente.maxSeleccion = 1;
          siguiente.minSeleccion = siguiente.obligatorio ? 1 : 0;
        }
        if (Object.prototype.hasOwnProperty.call(patch, 'obligatorio')) {
          siguiente.minSeleccion = patch.obligatorio ? Math.max(1, siguiente.minSeleccion || 0) : 0;
        }
        return siguiente;
      })
    );
  };

  const actualizarOpcion = (grupoKey, opcionKey, patch) => {
    onChange(
      grupos.map((grupo) =>
        grupo._key === grupoKey
          ? {
              ...grupo,
              opciones: grupo.opciones.map((opcion) =>
                opcion._key === opcionKey ? { ...opcion, ...patch } : opcion
              )
            }
          : grupo
      )
    );
  };

  const agregarGrupo = () => {
    const grupo = nuevoGrupo();
    onChange([...grupos, grupo]);
    setExpandidos((prev) => new Set([...prev, grupo._key]));
    setAbierto(true);
  };

  const aplicarPlantilla = (tipo) => {
    const nuevos = (PLANTILLAS[tipo] || []).map(normalizarGrupo);
    onChange([...grupos, ...nuevos]);
    setExpandidos((prev) => new Set([...prev, ...nuevos.map((grupo) => grupo._key)]));
    setAbierto(true);
  };

  const duplicarGrupo = (grupo) => {
    const copia = normalizarGrupo({
      ...grupo,
      id: undefined,
      nombre: `${grupo.nombre} copia`,
      opciones: grupo.opciones.map((opcion) => ({ ...opcion, id: undefined, _key: undefined }))
    });
    onChange([...grupos, copia]);
    setExpandidos((prev) => new Set([...prev, copia._key]));
  };

  const eliminarGrupo = (key) => onChange(grupos.filter((grupo) => grupo._key !== key));

  const agregarOpcion = (grupoKey) => {
    const opcion = {
      _key: crearIdLocal(),
      nombre: '',
      precioExtra: 0,
      tipo: 'opcion'
    };
    onChange(
      grupos.map((grupo) =>
        grupo._key === grupoKey
          ? {
              ...grupo,
              opciones: [...grupo.opciones, opcion],
              maxSeleccion:
                grupo.tipoSeleccion === 'unica'
                  ? 1
                  : Math.max(grupo.maxSeleccion || 1, grupo.opciones.length + 1)
            }
          : grupo
      )
    );
  };

  const eliminarOpcion = (grupoKey, opcionKey) => {
    onChange(
      grupos.map((grupo) => {
        if (grupo._key !== grupoKey) return grupo;
        const opciones = grupo.opciones.filter((opcion) => opcion._key !== opcionKey);
        return {
          ...grupo,
          opciones,
          maxSeleccion:
            grupo.tipoSeleccion === 'unica'
              ? 1
              : Math.min(grupo.maxSeleccion || 1, Math.max(opciones.length, 1))
        };
      })
    );
  };

  const alternarExpandido = (key) => {
    setExpandidos((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(key)) siguiente.delete(key);
      else siguiente.add(key);
      return siguiente;
    });
  };

  return (
    <section className={`pm-ediciones ${abierto ? 'is-open' : ''}`}>
      <button
        type="button"
        className="pm-ediciones-trigger"
        onClick={() => setAbierto((actual) => !actual)}
        disabled={disabled}
        aria-expanded={abierto}
      >
        <span className="pm-ediciones-trigger-icon"><FiEdit3 /></span>
        <span className="pm-ediciones-trigger-copy">
          <strong>Ediciones y adicionales</strong>
          <small>
            {cargando
              ? 'Cargando configuración...'
              : grupos.length
                ? `${grupos.length} grupos · ${totalOpciones} opciones configuradas`
                : 'Queso, tocineta, sin cebolla, tamaños, bebidas y más'}
          </small>
        </span>
        <span className="pm-ediciones-trigger-action">
          {grupos.length > 0 && <b>{grupos.length}</b>}
          {abierto ? <FiChevronUp /> : <FiChevronDown />}
        </span>
      </button>

      {abierto && (
        <div className="pm-ediciones-content">
          <div className="pm-ediciones-intro">
            <div>
              <strong>¿Cómo puede personalizarlo el cliente?</strong>
              <p>Usa una plantilla o crea grupos según la carta del negocio.</p>
            </div>
            <button type="button" className="pm-ediciones-add-group" onClick={agregarGrupo}>
              <FiPlus /> Agregar grupo
            </button>
          </div>

          <div className="pm-ediciones-templates" aria-label="Plantillas de personalización">
            <button type="button" onClick={() => aplicarPlantilla('hamburguesa')}>
              🍔 Restaurante
            </button>
            <button type="button" onClick={() => aplicarPlantilla('cafe')}>
              ☕ Café
            </button>
            <button type="button" onClick={() => aplicarPlantilla('bebida')}>
              🥤 Bebidas
            </button>
          </div>

          {errorCarga && <div className="pm-ediciones-load-error">{errorCarga}</div>}

          {grupos.length === 0 ? (
            <div className="pm-ediciones-empty">
              <FiEdit3 />
              <div>
                <strong>Este producto todavía no tiene ediciones</strong>
                <span>El cliente lo pedirá tal como aparece en la carta.</span>
              </div>
            </div>
          ) : (
            <div className="pm-ediciones-groups">
              {grupos.map((grupo, index) => {
                const expandido = expandidos.has(grupo._key);
                return (
                  <article className="pm-edicion-group" key={grupo._key}>
                    <div className="pm-edicion-group-head">
                      <button type="button" onClick={() => alternarExpandido(grupo._key)}>
                        <span>{index + 1}</span>
                        <div>
                          <strong>{grupo.nombre || 'Grupo sin nombre'}</strong>
                          <small>
                            {grupo.tipoSeleccion === 'unica' ? 'Una opción' : 'Varias opciones'}
                            {' · '}
                            {grupo.obligatorio ? 'Obligatorio' : 'Opcional'}
                            {' · '}
                            {grupo.opciones.length} opciones
                          </small>
                        </div>
                        {expandido ? <FiChevronUp /> : <FiChevronDown />}
                      </button>
                      <button
                        type="button"
                        className="pm-edicion-icon-btn"
                        onClick={() => duplicarGrupo(grupo)}
                        title="Duplicar grupo"
                      >
                        <FiCopy />
                      </button>
                      <button
                        type="button"
                        className="pm-edicion-icon-btn danger"
                        onClick={() => eliminarGrupo(grupo._key)}
                        title="Eliminar grupo"
                      >
                        <FiTrash2 />
                      </button>
                    </div>

                    {expandido && (
                      <div className="pm-edicion-group-body">
                        <div className="pm-edicion-config-grid">
                          <label>
                            <span>Nombre del grupo</span>
                            <input
                              value={grupo.nombre}
                              onChange={(event) =>
                                actualizarGrupo(grupo._key, { nombre: event.target.value })
                              }
                              placeholder="Ej: Adiciones"
                            />
                          </label>
                          <label className="pm-edicion-customer-title">
                            <span>Título que verá el cliente</span>
                            <input
                              value={grupo.tituloCliente}
                              onChange={(event) =>
                                actualizarGrupo(grupo._key, {
                                  tituloCliente: event.target.value
                                })
                              }
                              placeholder="Ej: Elige tus adiciones"
                              maxLength={120}
                            />
                            <small>
                              Usa un texto comercial como “Personaliza tu hamburguesa”.
                            </small>
                          </label>
                          <label>
                            <span>El cliente puede elegir</span>
                            <select
                              value={grupo.tipoSeleccion}
                              onChange={(event) =>
                                actualizarGrupo(grupo._key, {
                                  tipoSeleccion: event.target.value
                                })
                              }
                            >
                              <option value="multiple">Varias opciones</option>
                              <option value="unica">Solo una opción</option>
                            </select>
                          </label>
                          <fieldset className="pm-edicion-control-style">
                            <legend>Control que verá el cliente</legend>
                            <div>
                              {CONTROLES_VISUALES.map((control) => {
                                const ControlIcon = control.Icon;
                                return (
                                  <button
                                    type="button"
                                    key={control.value}
                                    className={
                                      grupo.estiloControl === control.value ? 'is-active' : ''
                                    }
                                    onClick={() =>
                                      actualizarGrupo(grupo._key, {
                                        estiloControl: control.value
                                      })
                                    }
                                    aria-pressed={grupo.estiloControl === control.value}
                                    title={control.label}
                                  >
                                    <ControlIcon aria-hidden="true" />
                                    <span>{control.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                            <small>
                              Automático usa círculo para una opción y “+” para varias.
                            </small>
                          </fieldset>
                          <label className="pm-edicion-check">
                            <input
                              type="checkbox"
                              checked={grupo.obligatorio}
                              onChange={(event) =>
                                actualizarGrupo(grupo._key, {
                                  obligatorio: event.target.checked
                                })
                              }
                            />
                            <span>
                              <strong>Respuesta obligatoria</strong>
                              <small>El cliente debe elegir antes de agregar.</small>
                            </span>
                          </label>
                          {grupo.tipoSeleccion === 'multiple' && (
                            <label>
                              <span>Máximo de opciones</span>
                              <input
                                type="number"
                                min="1"
                                max={Math.max(grupo.opciones.length, 1)}
                                value={grupo.maxSeleccion}
                                onChange={(event) =>
                                  actualizarGrupo(grupo._key, {
                                    maxSeleccion: Number(event.target.value || 1)
                                  })
                                }
                              />
                            </label>
                          )}
                        </div>

                        <div className="pm-edicion-options-head">
                          <div>
                            <strong>Opciones disponibles</strong>
                            <span>Precio adicional en pesos colombianos.</span>
                          </div>
                          <button type="button" onClick={() => agregarOpcion(grupo._key)}>
                            <FiPlus /> Agregar opción
                          </button>
                        </div>

                        <div className="pm-edicion-options">
                          {grupo.opciones.map((opcion) => (
                            <div className="pm-edicion-option" key={opcion._key}>
                              <input
                                className="pm-edicion-option-name"
                                value={opcion.nombre}
                                onChange={(event) =>
                                  actualizarOpcion(grupo._key, opcion._key, {
                                    nombre: event.target.value
                                  })
                                }
                                placeholder="Ej: Queso"
                              />
                              <select
                                value={opcion.tipo}
                                onChange={(event) =>
                                  actualizarOpcion(grupo._key, opcion._key, {
                                    tipo: event.target.value
                                  })
                                }
                              >
                                <option value="opcion">Elección</option>
                                <option value="extra">Adición</option>
                                <option value="remover">Retirar</option>
                              </select>
                              <div className="pm-edicion-price">
                                <span>+$</span>
                                <input
                                  inputMode="numeric"
                                  value={formatCopInput(opcion.precioExtra)}
                                  onChange={(event) =>
                                    actualizarOpcion(grupo._key, opcion._key, {
                                      precioExtra: parseCopInput(event.target.value)
                                    })
                                  }
                                  aria-label={`Precio adicional de ${opcion.nombre || 'la opción'}`}
                                />
                              </div>
                              <button
                                type="button"
                                className="pm-edicion-icon-btn danger"
                                onClick={() => eliminarOpcion(grupo._key, opcion._key)}
                                title="Eliminar opción"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
