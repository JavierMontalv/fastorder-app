import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  actualizarConfiguracionDisplay,
  anunciarPedidoDisplay,
  limpiarDisplayActivo,
  obtenerConfiguracionDisplay
} from '../api/displayApi';
import { getKpis } from '../api/dashboardApi';
import {
  actualizarMesa,
  liberarMesa,
  listarMesas,
  unirMesas,
  separarMesas,
  obtenerCuentaUnificada
} from '../api/mesaApi';
import { marcarPagoEnCaja } from '../api/pagosApi';
import { actualizarEstadoPedido, eliminarPedido, obtenerPedidos } from '../api/pedidosApi';
import { obtenerRestaurante } from '../api/restauranteApi';
import PedidoCard from '../components/PedidoCard';
import SalonVisual from '../components/SalonVisual';
import { AuthContext } from '../context/AuthContext';
import '../styles/Pedidos.css';
import {
  agruparPedidosPorMesa,
  formatCurrency,
  normalizarPedidoBackend,
  obtenerAccionPrimariaPedido,
  obtenerMetodoPagoParaCaja,
  pedidoPagoPendienteOperativo,
  pedidoTieneAccionPendiente
} from '../utils/pedidos';
import {
  emitirPreferenciaSonidoPedidos,
  PEDIDOS_REALTIME_EVENTS
} from '../utils/pedidosRealtime';
import {
  obtenerCapacidadesUsuario,
  obtenerPerfilOperativoUsuario
} from '../utils/operationalAccess';

const ESTADOS = [
  { id: 'todos', label: 'Todos' },
  { id: 'pendiente_pago', label: 'Pendiente de pago' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'aceptado', label: 'Aceptados' },
  { id: 'preparacion', label: 'En preparacion' },
  { id: 'listo', label: 'Listos' },
  { id: 'entregado', label: 'Entregados' }
];

const SUBFILTROS_TODOS = [
  { id: 'panorama', label: 'Vista general' },
  { id: 'accion', label: 'Requieren accion' },
  { id: 'listos', label: 'Listos para entregar' },
  { id: 'pagos', label: 'Pagos pendientes' },
  { id: 'cerrados', label: 'Cerrados' }
];

const MESA_STATUS_FILTERS = [
  { id: 'todas', label: 'Todas las mesas' },
  { id: 'ocupada', label: 'Mesas ocupadas' },
  { id: 'disponible', label: 'Mesas disponibles' }
];

const FECHA_PRESETS = [
  { id: 'all', label: 'Todo' },
  { id: 'today', label: 'Hoy' },
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
  { id: 'custom', label: 'Personalizado' }
];

const PAGE_SIZE_OPTIONS = [6, 8, 12];
const DISPLAY_DURATIONS = [8, 10, 15];
const SOUND_PREFERENCE_KEY = 'comanda.pedidos.sonido';

function upsertPedido(lista, pedidoEntrante) {
  const pedido = normalizarPedidoBackend(pedidoEntrante);
  const existe = lista.some((item) => item.id === pedido.id);

  if (!existe) return [pedido, ...lista];

  return lista.map((item) => {
    if (item.id !== pedido.id) return item;
    return {
      ...item,
      ...pedido,
      items: pedido.items?.length ? pedido.items : item.items
    };
  });
}

function sincronizarMesaEnPedidos(lista, mesaActualizada = {}) {
  const mesaId = mesaActualizada?.id;
  if (!mesaId) return lista;

  return lista.map((pedido) => {
    if (String(pedido?.mesaId) !== String(mesaId)) return pedido;

    return {
      ...pedido,
      mesaEstado: mesaActualizada?.estado || pedido?.mesaEstado,
      mesaLabel: mesaActualizada?.numero ? `Mesa ${mesaActualizada.numero}` : pedido?.mesaLabel,
      mesa: pedido?.mesa
        ? {
            ...pedido.mesa,
            ...mesaActualizada
          }
        : mesaActualizada
    };
  });
}

function obtenerNumeroMesaComparable(grupo = {}) {
  if (Number.isFinite(Number(grupo?.mesaNumero)) && Number(grupo.mesaNumero) > 0) {
    return Number(grupo.mesaNumero);
  }

  const match = String(grupo?.mesaLabel || '').match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function enriquecerGrupoConMesaConfigurada(grupo = {}, mesaConfigurada = null) {
  if (!mesaConfigurada) return grupo;

  return {
    ...grupo,
    mesaNumero: Number(mesaConfigurada?.numero) || grupo?.mesaNumero || null,
    mesaNombre: mesaConfigurada?.nombre || grupo?.mesaNombre || '',
    mesaCapacidad: Number(mesaConfigurada?.capacidad) || Number(grupo?.mesaCapacidad) || 0,
    mesaEstado: String(mesaConfigurada?.estado || grupo?.mesaEstado || 'disponible'),
    cuentaCompartidaActiva: Boolean(mesaConfigurada?.cuentaCompartidaActiva),
    esMesaPrincipal: Boolean(mesaConfigurada?.esMesaPrincipal),
    esMesaSecundaria: Boolean(mesaConfigurada?.esMesaSecundaria),
    mesaCuentaNumero: mesaConfigurada?.mesaCuentaNumero || grupo?.mesaCuentaNumero || mesaConfigurada?.numero || null,
    grupoLabel: mesaConfigurada?.grupoLabel || grupo?.grupoLabel || null,
    grupoMesas: Array.isArray(mesaConfigurada?.grupoMesas) ? mesaConfigurada.grupoMesas : grupo?.grupoMesas || [],
    pedidosActivos: Number(grupo?.pedidosActivos) || 0
  };
}

function construirGrupoMesaSinPedidos(mesa = {}) {
  const mesaNumero = Number(mesa?.numero) || null;
  const mesaEstado = String(mesa?.estado || 'disponible');

  return {
    id: `mesa-${mesa.id}`,
    mesaId: mesa.id,
    mesaNumero,
    mesaLabel: mesaNumero ? `Mesa ${mesaNumero}` : 'Mesa configurada',
    mesaNombre: mesa?.nombre || '',
    mesaCapacidad: Number(mesa?.capacidad) || 0,
    mesaEstado,
    cuentaCompartidaActiva: Boolean(mesa?.cuentaCompartidaActiva),
    esMesaPrincipal: Boolean(mesa?.esMesaPrincipal),
    esMesaSecundaria: Boolean(mesa?.esMesaSecundaria),
    mesaCuentaNumero: mesa?.mesaCuentaNumero || mesaNumero,
    grupoLabel: mesa?.grupoLabel || null,
    grupoMesas: Array.isArray(mesa?.grupoMesas) ? mesa.grupoMesas : [],
    clienteNombre: mesaNumero ? `Mesa ${mesaNumero}` : 'Mesa configurada',
    pedidos: [],
    total: 0,
    totalItems: 0,
    pagosPendientes: 0,
    cantidadPedidos: 0,
    pedidoPrincipal: null,
    tiempoTexto: 'Sin actividad en el rango',
    estadoDominante: 'entregado',
    resumenItems: [],
    tieneAccionPendiente: false,
    pedidosActivos: 0
  };
}

function ordenarGruposMesa(a, b) {
  const prioridadAccionA = a?.tieneAccionPendiente ? 1 : 0;
  const prioridadAccionB = b?.tieneAccionPendiente ? 1 : 0;
  if (prioridadAccionA !== prioridadAccionB) return prioridadAccionB - prioridadAccionA;

  const cantidadPedidosA = Number(a?.cantidadPedidos) || 0;
  const cantidadPedidosB = Number(b?.cantidadPedidos) || 0;
  if (cantidadPedidosA !== cantidadPedidosB) return cantidadPedidosB - cantidadPedidosA;

  const prioridadOcupacionA = String(a?.mesaEstado || 'disponible') === 'ocupada' ? 1 : 0;
  const prioridadOcupacionB = String(b?.mesaEstado || 'disponible') === 'ocupada' ? 1 : 0;
  if (prioridadOcupacionA !== prioridadOcupacionB) return prioridadOcupacionB - prioridadOcupacionA;

  return obtenerNumeroMesaComparable(a) - obtenerNumeroMesaComparable(b);
}

function fusionarMesasConfiguradasConPedidos(grupos = [], mesasConfiguradas = [], incluirMesasSinPedidos = true) {
  const mesasMap = new Map(
    mesasConfiguradas
      .filter((mesa) => mesa?.id)
      .map((mesa) => [String(mesa.id), mesa])
  );

  const gruposEnriquecidos = grupos.map((grupo) =>
    grupo?.mesaId
      ? enriquecerGrupoConMesaConfigurada(grupo, mesasMap.get(String(grupo.mesaId)) || null)
      : grupo
  );

  if (!incluirMesasSinPedidos) {
    return gruposEnriquecidos.sort(ordenarGruposMesa);
  }

  const gruposPorId = new Set(
    gruposEnriquecidos
      .filter((grupo) => grupo?.mesaId)
      .map((grupo) => String(grupo.mesaId))
  );

  const mesasSinPedidos = mesasConfiguradas
    .filter((mesa) => mesa?.id && !gruposPorId.has(String(mesa.id)))
    .map((mesa) => construirGrupoMesaSinPedidos(mesa));

  return [...gruposEnriquecidos, ...mesasSinPedidos].sort(ordenarGruposMesa);
}

function grupoTieneActividadOperativa(grupo = {}) {
  const pedidos = Array.isArray(grupo?.pedidos) ? grupo.pedidos : [];
  const tienePedidoEnFlujo = pedidos.some((pedido) =>
    ['pendiente', 'aceptado', 'preparacion', 'listo'].includes(String(pedido?.estado || ''))
  );

  return Boolean(
    grupo?.tieneAccionPendiente ||
      tienePedidoEnFlujo ||
      Number(grupo?.pedidosActivos || 0) > 0 ||
      Number(grupo?.pagosPendientes || 0) > 0 ||
      String(grupo?.estadoDominante || '') === 'listo'
  );
}

function grupoTieneHistorialCerrado(grupo = {}) {
  return Boolean(grupo?.pedidoPrincipal || Number(grupo?.cantidadPedidos || 0) > 0);
}

function grupoVisibleEnTableroSalon(grupo = {}) {
  return grupoTieneActividadOperativa(grupo) || grupoTieneHistorialCerrado(grupo);
}

function resolverModoEntregaPreview(pedido, displayConfig) {
  const modoEntrega = displayConfig?.modoEntrega || 'auto';

  if (modoEntrega === 'caja' || modoEntrega === 'mesa') {
    return modoEntrega;
  }

  if (pedido?.tipoPedido === 'llevar') return 'caja';
  if (pedido?.estadoPago === 'pendiente') return 'caja';
  if (pedido?.metodoPago === 'caja') return 'caja';
  return 'mesa';
}

function construirDraftLlamado(pedido, displayConfig) {
  const mensajeCliente =
    displayConfig?.mensajeMesa ||
    displayConfig?.mensajeCaja ||
    'Te lo llevamos a la mesa';

  if (!pedido) {
    return {
      titulo: 'Mesa 3',
      mensaje: 'Tu pedido esta listo',
      submensaje: mensajeCliente
    };
  }

  return {
    titulo: pedido.mesaLabel || `Pedido #${pedido.numero || pedido.id}`,
    mensaje: 'Tu pedido esta listo',
    submensaje: mensajeCliente
  };
}

function obtenerFechaInput(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function inicioDiaLocal(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function finDiaLocal(date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function obtenerRangoPreset(preset) {
  const today = new Date();
  const end = finDiaLocal(today);

  switch (preset) {
    case 'today':
      return {
        fechaDesde: obtenerFechaInput(today),
        fechaHasta: obtenerFechaInput(today)
      };
    case '7d': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return {
        fechaDesde: obtenerFechaInput(start),
        fechaHasta: obtenerFechaInput(end)
      };
    }
    case '30d': {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return {
        fechaDesde: obtenerFechaInput(start),
        fechaHasta: obtenerFechaInput(end)
      };
    }
    case 'custom':
      return {
        fechaDesde: '',
        fechaHasta: ''
      };
    case 'all':
    default:
      return {
        fechaDesde: '',
        fechaHasta: ''
      };
  }
}

function pedidoEstaEnRango(pedido, fechaDesde, fechaHasta) {
  if (!fechaDesde && !fechaHasta) return true;

  const base = pedido?.horaBase ? new Date(pedido.horaBase) : null;
  if (!(base instanceof Date) || Number.isNaN(base?.getTime?.())) return false;

  if (fechaDesde) {
    const inicio = inicioDiaLocal(new Date(`${fechaDesde}T00:00:00`));
    if (base < inicio) return false;
  }

  if (fechaHasta) {
    const fin = finDiaLocal(new Date(`${fechaHasta}T00:00:00`));
    if (base > fin) return false;
  }

  return true;
}

function construirPaginasVisibles(actual, total) {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (actual <= 3) return [1, 2, 3, 4, 5];
  if (actual >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
  return [actual - 2, actual - 1, actual, actual + 1, actual + 2];
}

export default function Pedidos() {
  const { user } = useContext(AuthContext);
  const capacidades = obtenerCapacidadesUsuario(user);
  const perfilOperativo = obtenerPerfilOperativoUsuario(user)?.value || capacidades?.perfilOperativo || null;
  const [pedidos, setPedidos] = useState([]);
  const [mesasConfiguradas, setMesasConfiguradas] = useState([]);
  const [restaurante, setRestaurante] = useState(null);
  const [displayConfig, setDisplayConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [guardandoDisplay, setGuardandoDisplay] = useState(false);
  const [estadoActivo, setEstadoActivo] = useState('todos');
  const [subfiltroTodos, setSubfiltroTodos] = useState('panorama');
  const [mesaEstadoFiltro, setMesaEstadoFiltro] = useState('todas');
  const [fechaPreset, setFechaPreset] = useState('all');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [tarjetasPorPagina, setTarjetasPorPagina] = useState(8);
  const [error, setError] = useState('');
  const [metricasHoy, setMetricasHoy] = useState(null);
  const [pedidoLlamadoId, setPedidoLlamadoId] = useState(null);
  const [llamadoDraft, setLlamadoDraft] = useState(() => construirDraftLlamado(null, null));
  const [sonidoActivado, setSonidoActivado] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(SOUND_PREFERENCE_KEY) !== 'false';
  });
  const [pedidoAccionId, setPedidoAccionId] = useState(null);
  const [pedidoAnuncioId, setPedidoAnuncioId] = useState(null);
  const [pedidoPagoId, setPedidoPagoId] = useState(null);
  const [pedidoEliminandoId, setPedidoEliminandoId] = useState(null);
  const [mesaEstadoId, setMesaEstadoId] = useState(null);
  const [limpiandoDisplay, setLimpiandoDisplay] = useState(false);
  const syncRefreshTimerRef = useRef(null);
  const rolePresetAppliedRef = useRef(false);

  // â”€â”€ Unir mesas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [modoUnirMesas, setModoUnirMesas] = useState(false);
  const [mesasSeleccionadas, setMesasSeleccionadas] = useState(new Set());
  const [modalUnirMesas, setModalUnirMesas] = useState(false);
  const [mesaPrincipalSeleccionada, setMesaPrincipalSeleccionada] = useState('');
  const [uniendoMesas, setUniendoMesas] = useState(false);
  const [separandoMesas, setSeparandoMesas] = useState(null);
  const [modalCuentaUnificada, setModalCuentaUnificada] = useState(null);
  const [cuentaUnificadaData, setCuentaUnificadaData] = useState(null);
  const [cargandoCuenta, setCargandoCuenta] = useState(false);

  const esStaffMesero = user?.rol === 'staff' && perfilOperativo === 'mesero';
  const esStaffCocina = user?.rol === 'staff' && perfilOperativo === 'cocina';
  const esStaffCaja = user?.rol === 'staff' && perfilOperativo === 'caja';
  const esStaffLectura = user?.rol === 'staff' && perfilOperativo === 'lectura';
  const puedeVerDisplayConfig = Boolean(capacidades?.puedeConfigurarLocal);
  const puedeAnunciar = Boolean(capacidades?.esFullAccess);
  const puedeVerMetricasFinancieras = Boolean(capacidades?.esFullAccess);
  const puedeVerTotalesPedido = Boolean(capacidades?.esFullAccess || esStaffCaja);
  const puedeCancelarPedido = Boolean(capacidades?.puedeCancelarPedidos || capacidades?.esFullAccess);
  const puedeEliminarPedido = Boolean(capacidades?.puedeEliminarPedidos || capacidades?.esFullAccess);
  const puedeLiberarMesa = Boolean(capacidades?.puedeLiberarMesa || capacidades?.esFullAccess);
  const puedeMarcarPago = Boolean(
    capacidades?.puedeConfirmarPagoCaja ||
      capacidades?.puedeConfirmarPagos ||
      capacidades?.puedeVerPagos
  );

  const estacionOperativa = useMemo(() => {
    if (esStaffCocina) {
      return {
        etiqueta: 'Estacion de cocina',
        titulo: 'Prepara pedidos sin ruido administrativo',
        descripcion: 'Ves pendientes de produccion y puedes marcar listo cuando el plato sale de cocina.',
        foco: 'Prioridad: aceptados y en preparacion'
      };
    }

    if (esStaffMesero) {
      return {
        etiqueta: 'Estacion de mesero',
        titulo: 'Entrega lo que ya esta listo y mantiene la sala al dia',
        descripcion: 'El panel destaca pedidos listos para llevarlos a mesa y cerrarlos como entregados.',
        foco: 'Prioridad: listos para entregar'
      };
    }

    if (esStaffCaja) {
      return {
        etiqueta: 'Estacion de caja',
        titulo: 'Cierra pagos sin tocar cocina ni catalogo',
        descripcion: 'Tu vista se enfoca en pedidos con pago pendiente para conciliarlos rapidamente.',
        foco: 'Prioridad: pagos pendientes'
      };
    }

    if (esStaffLectura) {
      return {
        etiqueta: 'Vista de supervision',
        titulo: 'Observa la operacion sin ejecutar cambios',
        descripcion: 'Ideal para seguimiento en sala o auditoria ligera sin permisos de edicion.',
        foco: 'Prioridad: panorama operativo'
      };
    }

    return {
      etiqueta: 'Control operativo',
      titulo: 'Operacion completa de pedidos, caja y llamados',
      descripcion: 'Administra el flujo completo del servicio, pagos, TV del local y cierre de mesas.',
      foco: 'Prioridad: control total'
    };
  }, [esStaffCaja, esStaffCocina, esStaffLectura, esStaffMesero]);

  useEffect(() => {
    if (rolePresetAppliedRef.current || !user) return;
    rolePresetAppliedRef.current = true;

    if (esStaffCaja) {
      setEstadoActivo('pendiente_pago');
      setSubfiltroTodos('pagos');
      setFechaPreset('today');
      return;
    }

    if (esStaffMesero) {
      setEstadoActivo('todos');
      setSubfiltroTodos('listos');
      setFechaPreset('today');
      return;
    }

    if (esStaffCocina) {
      setEstadoActivo('todos');
      setSubfiltroTodos('accion');
      setFechaPreset('today');
      return;
    }

    if (esStaffLectura) {
      setEstadoActivo('todos');
      setSubfiltroTodos('panorama');
      setFechaPreset('today');
    }
  }, [esStaffCaja, esStaffCocina, esStaffLectura, esStaffMesero, user]);

  const cargarDisplay = async () => {
    const [restauranteRes, displayRes] = await Promise.all([
      obtenerRestaurante(),
      obtenerConfiguracionDisplay()
    ]);

    setRestaurante(restauranteRes?.data?.data || restauranteRes?.data || null);
    setDisplayConfig(displayRes?.data || null);
  };

  const cargarPedidos = async ({ silencioso = false } = {}) => {
    try {
      if (silencioso) {
        setActualizando(true);
      } else {
        setLoading(true);
      }

      setError('');

      const [pedidosRes, mesasRes] = await Promise.all([
        obtenerPedidos(),
        listarMesas(),
        !silencioso && !displayConfig && puedeVerDisplayConfig ? cargarDisplay() : Promise.resolve()
      ]);

      const pedidosSource = Array.isArray(pedidosRes?.data) ? pedidosRes.data : [];
      const mesasSource = mesasRes?.data?.data || mesasRes?.data || [];

      const pedidosNormalizadosLista = Array.isArray(pedidosSource)
        ? pedidosSource.map(normalizarPedidoBackend)
        : [];

      setPedidos(pedidosNormalizadosLista);
      setMesasConfiguradas(Array.isArray(mesasSource) ? mesasSource : []);
    } catch (err) {
      const mensaje = err?.message || 'No se pudieron cargar los pedidos.';
      setError(mensaje);
      if (silencioso) toast.error(mensaje);
    } finally {
      setLoading(false);
      setActualizando(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  useEffect(() => {
    if (!puedeVerMetricasFinancieras) {
      setMetricasHoy(null);
      return;
    }

    getKpis()
      .then((res) => setMetricasHoy(res?.data?.data || null))
      .catch(() => setMetricasHoy(null));
  }, [puedeVerMetricasFinancieras]);

  useEffect(() => {
    window.localStorage.setItem(SOUND_PREFERENCE_KEY, String(sonidoActivado));
    emitirPreferenciaSonidoPedidos(sonidoActivado);
  }, [sonidoActivado]);

  useEffect(() => {
    const manejarPedidoNuevo = (event) => {
      if (!event?.detail) return;
      setPedidos((prev) => upsertPedido(prev, event.detail));
    };

    const manejarPedidoActualizado = (event) => {
      const pedido = event?.detail;
      if (!pedido) return;

      setPedidos((prev) => {
        const previo = prev.find((item) => item.id === pedido?.id);
        if (esStaffMesero && pedido?.estado === 'listo' && previo?.estado !== 'listo') {
          toast.info(`Pedido #${pedido?.numero || pedido?.id || ''} listo para entregar.`);
        }
        return upsertPedido(prev, pedido);
      });
    };

    const manejarPedidoEliminado = (event) => {
      const idPedido = event?.detail;
      if (!idPedido) return;
      setPedidos((prev) => prev.filter((pedido) => pedido.id !== idPedido));
    };

    const manejarMesasSync = (event) => {
      const detail = event?.detail;
      if (!detail?.type) return;

      if (detail.type === 'mesa:nueva' && detail.mesa?.id) {
        setMesasConfiguradas((prev) => {
          if (prev.some((mesa) => String(mesa?.id) === String(detail.mesa.id))) return prev;
          return [...prev, detail.mesa];
        });
        return;
      }

      if (detail.type === 'mesa:actualizada' && detail.mesa?.id) {
        setMesasConfiguradas((prev) =>
          prev.map((mesa) => (String(mesa?.id) === String(detail.mesa.id) ? { ...mesa, ...detail.mesa } : mesa))
        );
        setPedidos((prev) => sincronizarMesaEnPedidos(prev, detail.mesa));
        return;
      }

      if (detail.type === 'mesa:eliminada' && detail.mesaId) {
        setMesasConfiguradas((prev) => prev.filter((mesa) => String(mesa?.id) !== String(detail.mesaId)));
      }
    };

    const manejarSyncSolicitado = () => {
      window.clearTimeout(syncRefreshTimerRef.current);
      syncRefreshTimerRef.current = window.setTimeout(() => {
        cargarPedidos({ silencioso: true });
      }, 350);
    };

    const manejarGrupoCreado = (event) => {
      const payload = event?.detail;
      if (!payload?.mesaPrincipalId || !Array.isArray(payload?.mesasIds)) return;
      setMesasConfiguradas((prev) =>
        prev.map((m) => {
          if (m.id === payload.mesaPrincipalId) return { ...m, mesaGrupoId: null };
          if (payload.mesasIds.includes(m.id) && m.id !== payload.mesaPrincipalId) {
            return { ...m, mesaGrupoId: payload.mesaPrincipalId };
          }
          return m;
        })
      );
      cargarPedidos({ silencioso: true });
    };

    const manejarGrupoDisuelto = (event) => {
      const payload = event?.detail;
      if (!payload?.mesasIds) return;
      setMesasConfiguradas((prev) =>
        prev.map((m) =>
          payload.mesasIds.includes(m.id) ? { ...m, mesaGrupoId: null } : m
        )
      );
      cargarPedidos({ silencioso: true });
    };

    window.addEventListener(PEDIDOS_REALTIME_EVENTS.nuevo, manejarPedidoNuevo);
    window.addEventListener(PEDIDOS_REALTIME_EVENTS.actualizado, manejarPedidoActualizado);
    window.addEventListener(PEDIDOS_REALTIME_EVENTS.eliminado, manejarPedidoEliminado);
    window.addEventListener(PEDIDOS_REALTIME_EVENTS.grupoCreado, manejarGrupoCreado);
    window.addEventListener(PEDIDOS_REALTIME_EVENTS.grupoDisuelto, manejarGrupoDisuelto);
    window.addEventListener(PEDIDOS_REALTIME_EVENTS.mesasSync, manejarMesasSync);
    window.addEventListener(PEDIDOS_REALTIME_EVENTS.syncSolicitado, manejarSyncSolicitado);

    return () => {
      window.removeEventListener(PEDIDOS_REALTIME_EVENTS.nuevo, manejarPedidoNuevo);
      window.removeEventListener(PEDIDOS_REALTIME_EVENTS.actualizado, manejarPedidoActualizado);
      window.removeEventListener(PEDIDOS_REALTIME_EVENTS.eliminado, manejarPedidoEliminado);
      window.removeEventListener(PEDIDOS_REALTIME_EVENTS.grupoCreado, manejarGrupoCreado);
      window.removeEventListener(PEDIDOS_REALTIME_EVENTS.grupoDisuelto, manejarGrupoDisuelto);
      window.removeEventListener(PEDIDOS_REALTIME_EVENTS.mesasSync, manejarMesasSync);
      window.removeEventListener(PEDIDOS_REALTIME_EVENTS.syncSolicitado, manejarSyncSolicitado);
      window.clearTimeout(syncRefreshTimerRef.current);
    };
  }, [esStaffMesero]);

  const resolverAccionEstado = (pedido) => {
    if (capacidadadesToBool(capacidades?.esFullAccess)) {
      return obtenerAccionPrimariaPedido(pedido);
    }

    if (capacidadadesToBool(capacidades?.puedeMarcarPedidoListo) && ['aceptado', 'preparacion'].includes(pedido.estado)) {
      return {
        label: 'Marcar listo',
        estado: 'listo',
        next: 'listo'
      };
    }

    if (capacidadadesToBool(capacidades?.puedeEntregarPedidos) && pedido.estado === 'listo') {
      return {
        label: 'Marcar entregado',
        estado: 'entregado',
        next: 'entregado'
      };
    }

    return null;
  };

  useEffect(() => {
    if (fechaPreset === 'custom') return;
    const rango = obtenerRangoPreset(fechaPreset);
    setFechaDesde(rango.fechaDesde);
    setFechaHasta(rango.fechaHasta);
  }, [fechaPreset]);

  const pedidosEnRango = useMemo(
    () => pedidos.filter((pedido) => pedidoEstaEnRango(pedido, fechaDesde, fechaHasta)),
    [fechaDesde, fechaHasta, pedidos]
  );

  const pedidosFiltrados = useMemo(() => {
    if (estadoActivo === 'todos') return pedidosEnRango;

    if (estadoActivo === 'pendiente_pago') {
      return pedidosEnRango.filter((pedido) => pedidoPagoPendienteOperativo(pedido));
    }

    return pedidosEnRango.filter((pedido) => pedido.estado === estadoActivo);
  }, [pedidosEnRango, estadoActivo]);

  const mesasAgrupadasTodas = useMemo(
    () => fusionarMesasConfiguradasConPedidos(agruparPedidosPorMesa(pedidosEnRango), mesasConfiguradas)
      .filter((grupo) => grupoVisibleEnTableroSalon(grupo)),
    [mesasConfiguradas, pedidosEnRango]
  );
  const pedidosListos = useMemo(
    () => pedidosEnRango.filter((pedido) => pedido.estado === 'listo'),
    [pedidosEnRango]
  );
  const mesasAgrupadasFiltradas = useMemo(
    () => fusionarMesasConfiguradasConPedidos(agruparPedidosPorMesa(pedidosFiltrados), mesasConfiguradas, false)
      .filter((grupo) => grupoVisibleEnTableroSalon(grupo)),
    [mesasConfiguradas, pedidosFiltrados]
  );

  const conteoEstados = useMemo(() => ({
    todos: pedidosEnRango.length,
    pendiente_pago: pedidosEnRango.filter((pedido) => pedidoPagoPendienteOperativo(pedido)).length,
    pendiente: pedidosEnRango.filter((pedido) => pedido.estado === 'pendiente').length,
    aceptado: pedidosEnRango.filter((pedido) => pedido.estado === 'aceptado').length,
    preparacion: pedidosEnRango.filter((pedido) => pedido.estado === 'preparacion').length,
    listo: pedidosEnRango.filter((pedido) => pedido.estado === 'listo').length,
    entregado: pedidosEnRango.filter((pedido) => pedido.estado === 'entregado').length
  }), [pedidosEnRango]);

  const conteoSubfiltrosTodos = useMemo(() => ({
    panorama: mesasAgrupadasTodas.filter((mesa) => grupoTieneActividadOperativa(mesa)).length,
    accion: mesasAgrupadasTodas.filter((mesa) => mesa.tieneAccionPendiente).length,
    listos: mesasAgrupadasTodas.filter((mesa) => mesa.estadoDominante === 'listo').length,
    pagos: mesasAgrupadasTodas.filter((mesa) => mesa.pagosPendientes > 0).length,
    cerrados: mesasAgrupadasTodas.filter((mesa) => !grupoTieneActividadOperativa(mesa) && grupoTieneHistorialCerrado(mesa)).length
  }), [mesasAgrupadasTodas]);

  const mesasVisiblesBase = useMemo(() => {
    if (estadoActivo !== 'todos') return mesasAgrupadasFiltradas;

    switch (subfiltroTodos) {
      case 'accion':
        return mesasAgrupadasTodas.filter((mesa) => mesa.tieneAccionPendiente);
      case 'listos':
        return mesasAgrupadasTodas.filter((mesa) => mesa.estadoDominante === 'listo');
      case 'pagos':
        return mesasAgrupadasTodas.filter((mesa) => mesa.pagosPendientes > 0);
      case 'cerrados':
        return mesasAgrupadasTodas.filter((mesa) => !grupoTieneActividadOperativa(mesa) && grupoTieneHistorialCerrado(mesa));
      case 'panorama':
      default:
        return mesasAgrupadasTodas.filter((mesa) => grupoTieneActividadOperativa(mesa));
    }
  }, [estadoActivo, mesasAgrupadasFiltradas, mesasAgrupadasTodas, subfiltroTodos]);

  const conteoMesaEstado = useMemo(() => ({
    todas: mesasVisiblesBase.length,
    ocupada: mesasVisiblesBase.filter(
      (mesa) => mesa?.mesaId && String(mesa?.mesaEstado || 'disponible') === 'ocupada'
    ).length,
    disponible: mesasVisiblesBase.filter(
      (mesa) => mesa?.mesaId && String(mesa?.mesaEstado || 'disponible') === 'disponible'
    ).length
  }), [mesasVisiblesBase]);

  const mesasVisibles = useMemo(() => {
    if (mesaEstadoFiltro === 'todas') return mesasVisiblesBase;

    return mesasVisiblesBase.filter(
      (mesa) => mesa?.mesaId && String(mesa?.mesaEstado || 'disponible') === mesaEstadoFiltro
    );
  }, [mesaEstadoFiltro, mesasVisiblesBase]);

  const resumen = useMemo(() => {
    const totalVentas = pedidosEnRango.reduce((sum, pedido) => {
      if (pedido.estado === 'cancelado') return sum;
      return sum + (Number(pedido.total) || 0);
    }, 0);
    const totalPendienteCobro = pedidosEnRango.reduce((sum, pedido) => {
      if (!pedidoPagoPendienteOperativo(pedido)) return sum;
      return sum + (Number(pedido.total) || 0);
    }, 0);
    const abiertos = pedidosEnRango.filter((pedido) => pedidoTieneAccionPendiente(pedido)).length;
    const pendientes = pedidosEnRango.filter((pedido) => pedido.estado === 'pendiente').length;
    const enCurso = pedidosEnRango.filter((pedido) =>
      ['aceptado', 'preparacion', 'listo'].includes(pedido.estado)
    ).length;
    const pendientesPago = pedidosEnRango.filter((pedido) => pedidoPagoPendienteOperativo(pedido)).length;
    const listosParaEntregar = pedidosEnRango.filter((pedido) => pedido.estado === 'listo').length;

    return {
      total: abiertos,
      totalVentas,
      totalPendienteCobro,
      pendientes,
      enCurso,
      pendientesPago,
      listosParaEntregar
    };
  }, [pedidosEnRango]);

  const ventasHoy = Number(metricasHoy?.ventasHoy || 0);
  const pedidosHoy = Number(metricasHoy?.pedidosHoy || 0);

  const mesaDestacada = useMemo(() => {
    const mesasConPendientes = mesasAgrupadasTodas.filter((mesa) => mesa.tieneAccionPendiente);

    return mesasConPendientes.find((mesa) => mesa.estadoDominante === 'listo')
      || mesasConPendientes.find((mesa) => mesa.pagosPendientes > 0)
      || mesasConPendientes.find((mesa) => ['preparacion', 'aceptado', 'pendiente'].includes(mesa.estadoDominante))
      || null;
  }, [mesasAgrupadasTodas]);

  const etiquetaRangoFecha = useMemo(() => {
    switch (fechaPreset) {
      case 'today':
        return 'Hoy';
      case '7d':
        return 'Ultimos 7 dias';
      case '30d':
        return 'Ultimos 30 dias';
      case 'custom':
        return fechaDesde && fechaHasta
          ? `${fechaDesde} a ${fechaHasta}`
          : 'Rango personalizado';
      case 'all':
      default:
        return 'Historico completo';
    }
  }, [fechaDesde, fechaHasta, fechaPreset]);

  useEffect(() => {
    if (pedidosListos.length === 0) {
      setPedidoLlamadoId(null);
      return;
    }

    const pedidoSugerido = mesaDestacada?.pedidos?.find((pedido) => pedido.estado === 'listo') || pedidosListos[0];
    const existeSeleccion = pedidosListos.some(
      (pedido) => String(pedido.id) === String(pedidoLlamadoId)
    );

    if (!existeSeleccion) {
      setPedidoLlamadoId(String(pedidoSugerido.id));
    }
  }, [mesaDestacada, pedidoLlamadoId, pedidosListos]);

  const pedidoLlamadoSeleccionado = useMemo(
    () => pedidosListos.find((pedido) => String(pedido.id) === String(pedidoLlamadoId)) || null,
    [pedidoLlamadoId, pedidosListos]
  );

  useEffect(() => {
    setLlamadoDraft(construirDraftLlamado(pedidoLlamadoSeleccionado, displayConfig));
  }, [
    displayConfig?.mensajeCaja,
    displayConfig?.mensajeMesa,
    displayConfig?.modoEntrega,
    pedidoLlamadoSeleccionado?.id
  ]);

  const previewPedidoNumero = pedidoLlamadoSeleccionado?.numero || pedidoLlamadoSeleccionado?.id || 27;
  const previewMesaLabel = llamadoDraft.titulo || pedidoLlamadoSeleccionado?.mesaLabel || 'Mesa 3';
  const previewMensajePrincipal = llamadoDraft.mensaje || 'Tu pedido esta listo';
  const previewMensajeEntrega = llamadoDraft.submensaje || 'Te lo llevamos a la mesa';
  const previewModoEntrega = pedidoLlamadoSeleccionado
    ? resolverModoEntregaPreview(pedidoLlamadoSeleccionado, displayConfig)
    : (displayConfig?.modoEntrega || 'auto');
  const previewTotal = pedidoLlamadoSeleccionado ? formatCurrency(pedidoLlamadoSeleccionado.total) : formatCurrency(0);
  const previewEstadoPago = pedidoLlamadoSeleccionado?.estadoPago === 'pagado' ? 'Pago confirmado' : 'Pago pendiente';

  // â”€â”€ Unir mesas: toggle selecciÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const toggleSeleccionMesa = (mesaId) => {
    setMesasSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(mesaId)) next.delete(mesaId);
      else next.add(mesaId);
      return next;
    });
  };

  const cancelarModoUnir = () => {
    setModoUnirMesas(false);
    setMesasSeleccionadas(new Set());
    setModalUnirMesas(false);
    setMesaPrincipalSeleccionada('');
  };

  const confirmarUnionMesas = async () => {
    if (!mesaPrincipalSeleccionada || mesasSeleccionadas.size < 2) return;

    const secundarias = [...mesasSeleccionadas].filter(
      (id) => String(id) !== String(mesaPrincipalSeleccionada)
    );

    try {
      setUniendoMesas(true);
      await unirMesas(Number(mesaPrincipalSeleccionada), secundarias.map(Number));
      await cargarPedidos({ silencioso: true });

      toast.success('Mesas unidas correctamente. La cuenta es ahora unificada.');
      cancelarModoUnir();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'No se pudo unir las mesas.');
    } finally {
      setUniendoMesas(false);
    }
  };

  const handleSepararMesas = async (mesaPrincipalId) => {
    try {
      setSeparandoMesas(mesaPrincipalId);
      await separarMesas(Number(mesaPrincipalId));
      await cargarPedidos({ silencioso: true });

      toast.success('Mesas separadas. Las cuentas activas siguen abiertas por mesa.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'No se pudo separar las mesas.');
    } finally {
      setSeparandoMesas(null);
    }
  };

  const abrirCuentaUnificada = async (mesa) => {
    try {
      setCargandoCuenta(true);
      setModalCuentaUnificada(mesa);
      setCuentaUnificadaData(null);
      const res = await obtenerCuentaUnificada(mesa.mesaId || mesa.id);
      setCuentaUnificadaData(res?.data?.data || res?.data || null);
    } catch {
      toast.error('No se pudo cargar la cuenta unificada.');
      setModalCuentaUnificada(null);
    } finally {
      setCargandoCuenta(false);
    }
  };

  const cambiarEstado = async (pedido, estadoSiguiente) => {
    const pedidoId = pedido?.id || pedido?.pedidoId;
    const estadoDestino = estadoSiguiente?.estado || estadoSiguiente?.next || estadoSiguiente;

    if (!pedidoId || !estadoDestino) {
      toast.error('No se pudo identificar el pedido o su siguiente estado. Recarga el panel e intenta de nuevo.');
      return;
    }

    if (pedidoAccionId) return;

    setPedidoAccionId(pedidoId);
    // Optimistic update: refleja el cambio antes de que llegue la respuesta HTTP.
    setPedidos((prev) => upsertPedido(prev, { ...pedido, id: pedidoId, estado: estadoDestino }));

    try {
      const res = await actualizarEstadoPedido(pedidoId, estadoDestino);
      const pedidoActualizado = normalizarPedidoBackend(res?.data || res);
      setPedidos((prev) => upsertPedido(prev, pedidoActualizado));
      toast.success(`Pedido #${pedido.numero || pedidoId} actualizado.`);
    } catch (err) {
      // Rollback al estado anterior si falla.
      setPedidos((prev) => upsertPedido(prev, pedido));
      toast.error(err?.message || 'No fue posible actualizar el estado del pedido.');
    } finally {
      setPedidoAccionId(null);
    }
  };

  const noAceptarOCancelarPedido = async (pedido) => {
    if (!pedido?.id) return;
    const esPendiente = pedido.estado === 'pendiente';
    const confirmado = window.confirm(
      `${esPendiente ? 'No aceptar' : 'Cancelar'} el pedido #${pedido.numero || pedido.id}?\n\n${
        esPendiente
          ? 'El pedido no entrara a cocina ni a caja. Quedara cancelado para conservar trazabilidad.'
          : 'El pedido saldra del flujo operativo y quedara cancelado para auditoria.'
      }`
    );
    if (!confirmado) return;

    await cambiarEstado(pedido, 'cancelado');
  };

  const borrarPedido = async (pedido) => {
    if (!pedido?.id) return;
    const confirmado = window.confirm(
      `¿Eliminar definitivamente el pedido #${pedido.numero || pedido.id}? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    try {
      setPedidoEliminandoId(pedido.id);
      await eliminarPedido(pedido.id);
      setPedidos((prev) => prev.filter((item) => item.id !== pedido.id));
      await cargarPedidos({ silencioso: true });
      toast.success(`Pedido #${pedido.numero || pedido.id} eliminado.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'No fue posible eliminar el pedido.');
    } finally {
      setPedidoEliminandoId(null);
    }
  };

  const anunciarPedido = async (pedido, overrides = null) => {
    try {
      setPedidoAnuncioId(pedido.id);
      const payload = overrides
        ? {
            titulo: overrides.titulo,
            mensaje: overrides.mensaje,
            submensaje: overrides.submensaje
          }
        : {};

      await anunciarPedidoDisplay(pedido.id, payload);
      toast.success(`Llamado relanzado en TV y panel cliente para el pedido #${pedido.numero || pedido.id}.`);
    } catch (err) {
      toast.error(err?.message || 'No fue posible anunciar el pedido.');
    } finally {
      setPedidoAnuncioId(null);
    }
  };

  const marcarPagado = async (pedido) => {
    setPedidoPagoId(pedido.id);
    setPedidos((prev) => upsertPedido(prev, { ...pedido, estadoPago: 'pagado' }));

    try {
      const metodoPago = obtenerMetodoPagoParaCaja(pedido);
      const res = await marcarPagoEnCaja(pedido.id, metodoPago);
      const pedidoActualizado = normalizarPedidoBackend(res?.data);
      setPedidos((prev) => upsertPedido(prev, pedidoActualizado));
      toast.success(`Pago del pedido #${pedido.numero || pedido.id} confirmado.`);
    } catch (err) {
      setPedidos((prev) => upsertPedido(prev, pedido));
      toast.error(err?.message || 'No fue posible marcar el pago.');
    } finally {
      setPedidoPagoId(null);
    }
  };

  const marcarMesaDisponible = async (grupo) => {
    const mesaId = grupo?.mesaId || grupo?.id;
    if (!mesaId) return;

    if (Number(grupo?.pedidosActivos || 0) > 0) {
      toast.info('La mesa solo puede pasar a disponible cuando ya no tiene pedidos activos.');
      return;
    }

    try {
      setMesaEstadoId(mesaId);
      const { data } = await liberarMesa(mesaId);
      const mesaActualizada = data?.data || { id: mesaId, estado: 'disponible', comensalesActuales: 0 };

      setPedidos((prev) => sincronizarMesaEnPedidos(prev, mesaActualizada));
      setMesasConfiguradas((prev) =>
        prev.map((mesa) => (String(mesa?.id) === String(mesaId) ? { ...mesa, ...mesaActualizada } : mesa))
      );
      toast.success(`${grupo.mesaLabel || `Mesa ${grupo.numero || mesaId}`} marcada como disponible.`);
    } catch (err) {
      const message = err?.response?.data?.message || 'No fue posible actualizar el estado de la mesa.';
      toast.error(message);
    } finally {
      setMesaEstadoId(null);
    }
  };

  const actualizarComensalesMesa = async (mesa, comensales) => {
    const mesaId = mesa?.id || mesa?.mesaId;
    if (!mesaId) return;

    const cantidad = Math.max(0, Number(comensales) || 0);
    const capacidad = Math.max(Number(mesa?.capacidad) || cantidad || 1, 1);
    const estado = cantidad > 0 ? 'ocupada' : 'disponible';

    try {
      setMesaEstadoId(mesaId);
      const { data } = await actualizarMesa(mesaId, {
        estado,
        comensalesActuales: cantidad,
        capacidad
      });
      const mesaActualizada = data?.data || {
        ...mesa,
        id: mesaId,
        estado,
        comensalesActuales: estado === 'ocupada' ? Math.min(cantidad, capacidad) : 0,
        capacidad
      };

      setPedidos((prev) => sincronizarMesaEnPedidos(prev, mesaActualizada));
      setMesasConfiguradas((prev) =>
        prev.map((item) => (String(item?.id) === String(mesaId) ? { ...item, ...mesaActualizada } : item))
      );
      toast.success(
        estado === 'ocupada'
          ? `Mesa ${mesa.numero || mesaId} actualizada con ${mesaActualizada.comensalesActuales || cantidad} comensal(es).`
          : `Mesa ${mesa.numero || mesaId} marcada como disponible.`
      );
    } catch (err) {
      const message = err?.response?.data?.message || 'No fue posible actualizar los comensales de la mesa.';
      toast.error(message);
    } finally {
      setMesaEstadoId(null);
    }
  };

  const guardarDisplay = async () => {
    try {
      setGuardandoDisplay(true);
      const mensajeCliente =
        displayConfig?.mensajeMesa ||
        displayConfig?.mensajeCaja ||
        'Te lo llevamos a la mesa';
      const payload = {
        ...displayConfig,
        mensajeCaja: mensajeCliente,
        mensajeMesa: mensajeCliente
      };
      const res = await actualizarConfiguracionDisplay(payload);
      setDisplayConfig(res?.data || payload);
      toast.success('Configuracion de pantalla TV actualizada.');
    } catch (err) {
      toast.error(err?.message || 'No fue posible guardar la configuracion de pantalla.');
    } finally {
      setGuardandoDisplay(false);
    }
  };

  const limpiarPantallaTV = async () => {
    const confirmado = window.confirm(
      'Esto limpiara todos los llamados activos de la TV y reiniciara la cola visible. Los pedidos seguiran existiendo y podran relanzarse despues. Deseas continuar?'
    );

    if (!confirmado) return;

    try {
      setLimpiandoDisplay(true);
      const res = await limpiarDisplayActivo();
      const cleared = Number(res?.data?.cleared || 0);
      toast.success(
        cleared > 0
          ? `Pantalla TV reiniciada. ${cleared} llamado(s) fueron limpiados.`
          : 'Pantalla TV reiniciada. No habia llamados activos.'
      );
    } catch (err) {
      const message = err?.status === 404
        ? 'La versión del panel quedó desfasada. Recarga la página y vuelve a intentar.'
        : err?.status === 401
          ? 'Tu sesión expiró. Inicia sesión de nuevo para limpiar la pantalla TV.'
          : (err?.message || 'No fue posible limpiar los llamados de la TV.');
      toast.error(message);
    } finally {
      setLimpiandoDisplay(false);
    }
  };

  const abrirPantallaTV = () => {
    if (!restaurante?.slug) {
      toast.error('No se encontro el slug del restaurante.');
      return;
    }

    window.open(`/display/${restaurante.slug}`, '_blank', 'noopener,noreferrer');
  };

  const restablecerDraftLlamado = () => {
    setLlamadoDraft(construirDraftLlamado(pedidoLlamadoSeleccionado, displayConfig));
  };

  useEffect(() => {
    setPaginaActual(1);
  }, [estadoActivo, subfiltroTodos, mesaEstadoFiltro, fechaDesde, fechaHasta, tarjetasPorPagina]);

  const totalPaginas = Math.max(1, Math.ceil(mesasVisibles.length / tarjetasPorPagina));

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  const mesasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * tarjetasPorPagina;
    return mesasVisibles.slice(inicio, inicio + tarjetasPorPagina);
  }, [mesasVisibles, paginaActual, tarjetasPorPagina]);

  const paginasVisibles = useMemo(
    () => construirPaginasVisibles(paginaActual, totalPaginas),
    [paginaActual, totalPaginas]
  );

  const totalMesasVisibles = mesasVisibles.length;
  const inicioVisible = totalMesasVisibles === 0 ? 0 : ((paginaActual - 1) * tarjetasPorPagina) + 1;
  const finVisible = Math.min(paginaActual * tarjetasPorPagina, totalMesasVisibles);

  const seleccionarEstadoFiltro = (estadoId) => {
    setEstadoActivo(estadoId);
    if (estadoId === 'todos') {
      setSubfiltroTodos('panorama');
    }
    setMesaEstadoFiltro('todas');
  };

  const seleccionarSubfiltroTodos = (filtroId) => {
    setSubfiltroTodos(filtroId);
    setMesaEstadoFiltro('todas');
  };

  return (
    <div className="pedidos-page">
      <section className="pedidos-hero">
        <div className="pedidos-hero-copy">
          <span className="pedidos-kicker">{estacionOperativa.etiqueta}</span>
          <h1>{estacionOperativa.titulo}</h1>
          <p>{estacionOperativa.descripcion}</p>
        </div>

        <div className="pedidos-hero-side">
          <div className="pedidos-hero-chip">
            <span>Estado del panel</span>
            <strong>{actualizando ? 'Actualizando...' : 'Sincronizado'}</strong>
          </div>
          <div className="pedidos-hero-chip">
            <span>Pedidos abiertos</span>
            <strong>{resumen.total}</strong>
          </div>
          <label className="pedidos-sonido-toggle">
            <input
              type="checkbox"
              checked={sonidoActivado}
              onChange={(e) => setSonidoActivado(e.target.checked)}
            />
            <span>Alertas sonoras del panel</span>
          </label>
        </div>
      </section>

      <section className="pedidos-summary-grid">
        <article className="pedidos-summary-card pedidos-summary-card-accent pedidos-summary-card-sales">
          <span>{puedeVerMetricasFinancieras ? 'Ventas en rango' : 'Por cobrar visible'}</span>
          <strong>{formatCurrency(puedeVerMetricasFinancieras ? resumen.totalVentas : resumen.totalPendienteCobro)}</strong>
          <p>
            {puedeVerMetricasFinancieras
              ? `${etiquetaRangoFecha}. Incluye los pedidos visibles dentro del periodo seleccionado.`
              : 'Solo muestra el valor pendiente de cobro de pedidos visibles. No revela ventas del dia, mes o historico.'}
          </p>
        </article>

        <article className="pedidos-summary-card pedidos-summary-card-pending">
          <span>Pendientes</span>
          <strong>{resumen.pendientes}</strong>
          <p>Pedidos recien recibidos esperando aprobacion del equipo.</p>
        </article>

        <article className="pedidos-summary-card pedidos-summary-card-progress">
          <span>En proceso</span>
          <strong>{resumen.enCurso}</strong>
          <p>Pedidos en produccion entre aceptacion, preparacion y pase.</p>
        </article>

        <article className="pedidos-summary-card pedidos-summary-card-payment">
          <span>Pagos pendientes</span>
          <strong>{resumen.pendientesPago}</strong>
          <p>Ordenes que todavia necesitan conciliacion en caja.</p>
        </article>
      </section>

      <section className="pedidos-context-strip">
        <article className="pedidos-context-card">
          <span>Base de calculo</span>
          <strong>{etiquetaRangoFecha}</strong>
          <p>
            La lectura operativa se ajusta al rango temporal activo para que el tablero no mezcle
            cierres antiguos con la operacion actual.
          </p>
        </article>

        <article className="pedidos-context-card">
          <span>Punto comun con panel</span>
          <strong>{puedeVerMetricasFinancieras ? `${formatCurrency(ventasHoy)} hoy` : `${pedidosEnRango.length} pedidos visibles`}</strong>
          <p>
            {puedeVerMetricasFinancieras
              ? `${pedidosHoy} pedido(s) registrados hoy. Esta es la referencia directa para comparar con el panel sin confundir historico con periodo.`
              : 'Vista operativa sin acumulados financieros del dia, del mes ni del restaurante.'}
          </p>
        </article>

        <article className="pedidos-context-card">
          <span>Ahora mismo</span>
          <strong>{resumen.total} abiertos</strong>
          <p>
            Los indicadores de pendientes, en proceso y pagos pendientes si representan solo lo
            que requiere accion dentro del periodo filtrado.
          </p>
        </article>
      </section>

      {puedeVerDisplayConfig ? (
      <section className="pedidos-display-panel">
        <div className="pedidos-display-copy">
          <span className="pedidos-priority-kicker">Pantalla TV</span>
          <h2>Orquesta el llamado publico del pedido listo</h2>
          <p>
            Aqui configuras lo que aparece en la TV publica del local. No es el menu del cliente:
            es la pantalla que anuncia pedidos listos en tiempo real.
          </p>
          <div className="pedidos-display-links">
            <button type="button" className="pedidos-refresh-btn" onClick={abrirPantallaTV}>
              Abrir pantalla TV
            </button>
            {restaurante?.slug && (
              <span className="pedidos-display-url">/display/{restaurante.slug}</span>
            )}
          </div>
        </div>

        <div className="pedidos-display-controls">
          <label className="pedidos-display-field">
            <span>Duracion en pantalla</span>
            <div className="pedidos-display-segmented">
              {DISPLAY_DURATIONS.map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  className={displayConfig?.duracionSegundos === seconds ? 'active' : ''}
                  onClick={() => setDisplayConfig((prev) => ({ ...prev, duracionSegundos: seconds }))}
                >
                  {seconds}s
                </button>
              ))}
            </div>
          </label>

          <label className="pedidos-display-field pedidos-display-switch">
            <span>Sonido en pantalla TV</span>
            <input
              type="checkbox"
              checked={Boolean(displayConfig?.sonidoActivo)}
              onChange={(e) => setDisplayConfig((prev) => ({ ...prev, sonidoActivo: e.target.checked }))}
            />
          </label>

          <label className="pedidos-display-field pedidos-display-switch">
            <span>Anuncio automatico al marcar listo</span>
            <input
              type="checkbox"
              checked={Boolean(displayConfig?.anuncioAutomatico)}
              onChange={(e) =>
                setDisplayConfig((prev) => ({
                  ...prev,
                  anuncioAutomatico: e.target.checked
                }))
              }
            />
          </label>

          <label className="pedidos-display-field">
            <span>Modo de entrega</span>
            <select
              value={displayConfig?.modoEntrega || 'auto'}
              onChange={(e) =>
                setDisplayConfig((prev) => ({
                  ...prev,
                  modoEntrega: e.target.value
                }))
              }
            >
              <option value="auto">Automatico</option>
              <option value="caja">Siempre pasa por caja</option>
              <option value="mesa">Siempre servicio a mesa</option>
            </select>
          </label>

          <label className="pedidos-display-field pedidos-display-field-full">
            <span>Mensaje del llamado</span>
            <textarea
              value={displayConfig?.mensajeMesa || displayConfig?.mensajeCaja || ''}
              maxLength={180}
              rows={3}
              onChange={(e) => {
                const mensajeCliente = e.target.value;
                setDisplayConfig((prev) => ({
                  ...prev,
                  mensajeCaja: mensajeCliente,
                  mensajeMesa: mensajeCliente
                }));
              }}
              placeholder="Ej: Te lo llevamos a la mesa. Gracias por esperar."
            />
            <small>
              Este texto aparece igual en TV, estado del pedido y menu QR. Asi no hay cruces entre caja y servicio.
            </small>
          </label>

          <p className="pedidos-display-helper">
            El modo de entrega define la operacion interna; el mensaje visible queda unificado para el cliente.
          </p>

          <button
            type="button"
            className="pedido-btn pedido-btn-primary pedidos-display-save"
            onClick={guardarDisplay}
            disabled={guardandoDisplay || !displayConfig}
          >
            {guardandoDisplay ? 'Guardando...' : 'Guardar configuracion TV'}
          </button>
        </div>

        <div className="pedidos-display-preview-grid">
          <article className="pedidos-display-preview-card pedidos-display-preview-card-live">
            <div className="pedidos-display-preview-head">
              <div>
                <span className="pedidos-priority-kicker">Vista previa en vivo</span>
                <h3>Asi se ve la TV real</h3>
              </div>
              {restaurante?.slug ? (
                <span className="pedidos-display-url">/display/{restaurante.slug}</span>
              ) : null}
            </div>

            <div className="pedidos-display-iframe-shell">
              {restaurante?.slug ? (
                <iframe
                  title="Vista previa TV"
                  src={`/display/${restaurante.slug}`}
                  className="pedidos-display-iframe"
                />
              ) : (
                <div className="pedidos-display-iframe-fallback">
                  Configura el restaurante para habilitar la vista previa.
                </div>
              )}
            </div>
          </article>

          <article className="pedidos-display-preview-card pedidos-display-preview-card-call">
            <div className="pedidos-display-preview-head">
              <div>
                <span className="pedidos-priority-kicker">Centro de relanzamiento</span>
                <h3>Relanza el llamado en TV y client QR</h3>
              </div>
              <div className="pedidos-display-preview-meta">
                <span className="pedidos-display-preview-duration">{displayConfig?.duracionSegundos || 10}s</span>
                <span className="pedidos-display-preview-count">
                  {pedidosListos.length} listo(s)
                </span>
              </div>
            </div>

            {pedidosListos.length === 0 ? (
              <div className="pedidos-display-call-empty">
                <strong>No hay pedidos listos para relanzar.</strong>
                <p>
                  Apenas un pedido pase a estado listo, podras editar el copy del llamado y
                  volver a empujarlo a la TV y al panel del cliente.
                </p>
              </div>
            ) : (
              <>
                <div className="pedidos-display-call-editor">
                  <label className="pedidos-display-field pedidos-display-field-full">
                    <span>Pedido listo a relanzar</span>
                    <select
                      value={pedidoLlamadoId || ''}
                      onChange={(e) => setPedidoLlamadoId(e.target.value)}
                    >
                      {pedidosListos.map((pedido) => (
                        <option key={pedido.id} value={pedido.id}>
                          {pedido.mesaLabel} · Pedido #{pedido.numero || pedido.id} · {formatCurrency(pedido.total)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="pedidos-display-call-context">
                    <span>Impacto del relanzamiento</span>
                    <div className="pedidos-display-call-chips">
                      <span>TV publica del local</span>
                      <span>Panel client QR en espera</span>
                      <span>{previewModoEntrega}</span>
                    </div>
                    <p>
                      El aviso se vuelve a emitir en la pantalla de llamados y, si el cliente sigue
                      viendo su estado, recibe el mismo mensaje en vivo.
                    </p>
                  </div>

                  <div className="pedidos-display-call-summary-grid">
                    <article className="pedidos-display-call-summary-card">
                      <span>Lectura principal</span>
                      <strong>{previewMesaLabel}</strong>
                      <small>Etiqueta visible en TV y cliente</small>
                    </article>
                    <article className="pedidos-display-call-summary-card">
                      <span>Turno operativo</span>
                      <strong>Pedido #{previewPedidoNumero}</strong>
                      <small>{previewEstadoPago}</small>
                    </article>
                    <article className="pedidos-display-call-summary-card">
                      <span>Cuenta asociada</span>
                      <strong>{previewTotal}</strong>
                      <small>{previewModoEntrega}</small>
                    </article>
                  </div>

                  <label className="pedidos-display-field">
                    <span>Titulo visible</span>
                    <input
                      type="text"
                      value={llamadoDraft.titulo}
                      onChange={(e) =>
                        setLlamadoDraft((prev) => ({ ...prev, titulo: e.target.value }))
                      }
                      placeholder="Mesa 3"
                    />
                  </label>

                  <label className="pedidos-display-field">
                    <span>Mensaje principal</span>
                    <input
                      type="text"
                      value={llamadoDraft.mensaje}
                      onChange={(e) =>
                        setLlamadoDraft((prev) => ({ ...prev, mensaje: e.target.value }))
                      }
                      placeholder="Tu pedido esta listo"
                    />
                  </label>

                  <label className="pedidos-display-field pedidos-display-field-full">
                    <span>Instruccion final para el cliente</span>
                    <input
                      type="text"
                      value={llamadoDraft.submensaje}
                      onChange={(e) =>
                        setLlamadoDraft((prev) => ({ ...prev, submensaje: e.target.value }))
                      }
                      placeholder="Pasa por caja o te lo llevamos a la mesa"
                    />
                  </label>
                </div>

                <div className="pedidos-display-live-previews">
                  <div className="pedidos-tv-call-preview">
                    <div className="pedidos-tv-call-copy">
                      <span className="pedidos-tv-call-tag">Pedido listo</span>
                      <strong>{previewMesaLabel}</strong>
                      <p>{previewMensajePrincipal}</p>
                      <small>{previewMensajeEntrega}</small>
                      <div className="pedidos-tv-call-chips">
                        <span>Pedido #{previewPedidoNumero}</span>
                        <span>{previewModoEntrega}</span>
                      </div>
                    </div>

                    <div className="pedidos-tv-call-stage">
                      <div className="pedidos-tv-call-ticket">
                        <span>Turno</span>
                        <strong>{previewPedidoNumero}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pedidos-mobile-call-preview">
                    <div className="pedidos-mobile-call-phone">
                      <span className="pedidos-mobile-call-status">En vivo</span>
                      <div className="pedidos-mobile-call-card">
                        <span className="pedidos-mobile-call-tag">Comanda avisa</span>
                        <strong>{previewMesaLabel}</strong>
                        <p>{previewMensajePrincipal}</p>
                        <small>{previewMensajeEntrega}</small>
                        <div className="pedidos-mobile-call-meta">
                          <span>Pedido #{previewPedidoNumero}</span>
                          <span>{previewModoEntrega}</span>
                        </div>
                        <button type="button">Entendido</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pedidos-display-call-actions">
                  <button
                    type="button"
                    className="pedido-btn pedido-btn-ghost"
                    onClick={restablecerDraftLlamado}
                  >
                    Restablecer copy
                  </button>

                  <button
                    type="button"
                    className="pedido-btn pedido-btn-ghost pedidos-display-reset-btn"
                    onClick={limpiarPantallaTV}
                    disabled={limpiandoDisplay}
                  >
                    {limpiandoDisplay ? 'Limpiando pantalla...' : 'Limpiar pantalla TV'}
                  </button>

                  <button
                    type="button"
                    className="pedido-btn pedido-btn-primary"
                    onClick={() => anunciarPedido(pedidoLlamadoSeleccionado, llamadoDraft)}
                    disabled={!pedidoLlamadoSeleccionado || pedidoAnuncioId === pedidoLlamadoSeleccionado?.id}
                  >
                    {pedidoAnuncioId === pedidoLlamadoSeleccionado?.id
                      ? 'Relanzando aviso...'
                      : 'Relanzar llamado ahora'}
                  </button>
                </div>
              </>
            )}
          </article>
        </div>
      </section>
      ) : null}

      <section className="pedidos-toolbar">
        <div className="pedidos-toolbar-main">
          <div className="pedidos-toolbar-state-group">
            <div className="pedidos-toolbar-secondary-copy">
              <span>Estado del pedido</span>
              <p>Elige una etapa operativa. Los contadores respetan el rango de fecha activo.</p>
            </div>

          <div className="pedidos-tabs" role="tablist" aria-label="Filtros de pedidos">
            {ESTADOS.map((estado) => (
              <button
                key={estado.id}
                type="button"
                className={`pedidos-tab ${estadoActivo === estado.id ? 'active' : ''}`}
                onClick={() => seleccionarEstadoFiltro(estado.id)}
              >
                <span>{estado.label}</span>
                <strong>{conteoEstados[estado.id] || 0}</strong>
              </button>
            ))}
          </div>
          </div>

          <div className="pedidos-toolbar-actions">
          <button
            type="button"
            className="pedidos-refresh-btn"
            onClick={() => cargarPedidos({ silencioso: true })}
            disabled={actualizando}
          >
            {actualizando ? 'Actualizando...' : 'Actualizar pedidos'}
          </button>

          {capacidades?.esFullAccess && mesasConfiguradas.length >= 2 && (
            <button
              type="button"
              className={`pedidos-refresh-btn pedidos-unir-btn${modoUnirMesas ? ' active' : ''}`}
              onClick={() => modoUnirMesas ? cancelarModoUnir() : setModoUnirMesas(true)}
            >
              {modoUnirMesas ? 'Cancelar unión' : 'Unir mesas'}
            </button>
          )}
          </div>
        </div>

        <div className="pedidos-toolbar-secondary">
          <div className="pedidos-toolbar-secondary-block">
            <div className="pedidos-toolbar-secondary-copy">
              <span>Rango temporal</span>
              <p>Filtra las tarjetas por fecha para leer mejor la operacion y el historico reciente.</p>
            </div>

            <div className="pedidos-date-presets" role="tablist" aria-label="Filtros por fecha">
              {FECHA_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`pedidos-date-preset ${fechaPreset === preset.id ? 'active' : ''}`}
                  onClick={() => setFechaPreset(preset.id)}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="pedidos-date-inputs">
              <label className="pedidos-date-field">
                <span>Desde</span>
                <input
                  type="date"
                  value={fechaDesde}
                  max={fechaHasta || undefined}
                  onChange={(e) => {
                    setFechaPreset('custom');
                    setFechaDesde(e.target.value);
                  }}
                />
              </label>

              <label className="pedidos-date-field">
                <span>Hasta</span>
                <input
                  type="date"
                  value={fechaHasta}
                  min={fechaDesde || undefined}
                  onChange={(e) => {
                    setFechaPreset('custom');
                    setFechaHasta(e.target.value);
                  }}
                />
              </label>
            </div>
          </div>

          {estadoActivo === 'todos' ? (
            <div className="pedidos-toolbar-secondary-block pedidos-toolbar-secondary-block-end">
              <div className="pedidos-toolbar-filter-cluster">
                <div className="pedidos-toolbar-secondary-copy">
                  <span>Vista dentro de Todos</span>
                  <p>Enfoca la operacion sin salir del panorama general del dia.</p>
                </div>

                <div className="pedidos-subfilters" role="tablist" aria-label="Subfiltros de todos">
                  {SUBFILTROS_TODOS.map((filtro) => (
                    <button
                      key={filtro.id}
                      type="button"
                      className={`pedidos-subfilter ${subfiltroTodos === filtro.id ? 'active' : ''}`}
                      onClick={() => seleccionarSubfiltroTodos(filtro.id)}
                    >
                      <span>{filtro.label}</span>
                      <strong>{conteoSubfiltrosTodos[filtro.id] || 0}</strong>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pedidos-toolbar-filter-cluster">
                <div className="pedidos-toolbar-secondary-copy">
                  <span>Estado de mesas</span>
                  <p>Lee el salón con las mesas creadas en configuración y filtra por disponibilidad real.</p>
                </div>

                <div className="pedidos-subfilters pedidos-subfilters-mesas" role="tablist" aria-label="Filtros por estado de mesa">
                  {MESA_STATUS_FILTERS.map((filtro) => (
                    <button
                      key={filtro.id}
                      type="button"
                      className={`pedidos-subfilter ${mesaEstadoFiltro === filtro.id ? 'active' : ''}`}
                      onClick={() => setMesaEstadoFiltro(filtro.id)}
                    >
                      <span>{filtro.label}</span>
                      <strong>{conteoMesaEstado[filtro.id] || 0}</strong>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="pedidos-toolbar-secondary-block pedidos-toolbar-secondary-block-end pedidos-toolbar-secondary-block-single">
              <div className="pedidos-toolbar-filter-cluster">
                <div className="pedidos-toolbar-secondary-copy">
                  <span>Estado de mesas</span>
                  <p>Filtra las tarjetas por ocupación o disponibilidad del salón configurado.</p>
                </div>

                <div className="pedidos-subfilters pedidos-subfilters-mesas" role="tablist" aria-label="Filtros por estado de mesa">
                  {MESA_STATUS_FILTERS.map((filtro) => (
                    <button
                      key={filtro.id}
                      type="button"
                      className={`pedidos-subfilter ${mesaEstadoFiltro === filtro.id ? 'active' : ''}`}
                      onClick={() => setMesaEstadoFiltro(filtro.id)}
                    >
                      <span>{filtro.label}</span>
                      <strong>{conteoMesaEstado[filtro.id] || 0}</strong>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <SalonVisual
        mesas={mesasConfiguradas}
        pedidos={mesasAgrupadasTodas.filter((mesa) => grupoTieneActividadOperativa(mesa))}
        onUpdateComensales={puedeLiberarMesa ? actualizarComensalesMesa : null}
        onReleaseMesa={puedeLiberarMesa ? marcarMesaDisponible : null}
        mesaActionId={mesaEstadoId}
        title="Salon en tiempo real"
        description="Mesas, comensales y pedidos activos organizados para una lectura inmediata."
      />

      <section className="pedidos-priority-panel">
        <div>
          <span className="pedidos-priority-kicker">Foco operativo</span>
          <h2>
            {mesaDestacada
              ? mesaDestacada.estadoDominante === 'listo'
                ? `${mesaDestacada.mesaLabel} tiene un pedido listo para entregar`
                : `${mesaDestacada.mesaLabel} requiere seguimiento`
              : 'Operacion al dia, sin mesas pendientes'}
          </h2>
          <p>
            {mesaDestacada
              ? `${mesaDestacada.pedidosActivos} pedido(s) activos · ${mesaDestacada.totalItems} item(s) · ${mesaDestacada.tiempoTexto} en flujo.`
              : 'Todos los pedidos visibles ya fueron entregados o no tienen acciones pendientes.'}
          </p>
        </div>

        <div className="pedidos-priority-stats">
          <div>
            <span>Listos para entregar</span>
            <strong>{resumen.listosParaEntregar}</strong>
          </div>
          <div>
            <span>Pendientes de pago</span>
            <strong>{resumen.pendientesPago}</strong>
          </div>
        </div>
      </section>

      {error && <div className="pedidos-feedback pedidos-feedback-error">{error}</div>}

      {loading ? (
        <div className="pedidos-state-shell">
          <div className="pedidos-loader-card" />
          <div className="pedidos-loader-card" />
          <div className="pedidos-loader-card" />
        </div>
      ) : mesasVisibles.length === 0 ? (
        <div className="pedidos-feedback pedidos-feedback-empty">
          {mesaEstadoFiltro !== 'todas'
            ? `No hay mesas ${mesaEstadoFiltro === 'ocupada' ? 'ocupadas' : 'disponibles'} que coincidan con la vista actual.`
            : estadoActivo === 'todos'
            ? 'No hay mesas que coincidan con la vista seleccionada dentro de Todos.'
            : 'No hay pedidos que coincidan con el filtro actual.'}
        </div>
      ) : (
        <>
          {modoUnirMesas && (
            <div className="pedidos-unir-instruccion">
              <span>Selecciona 2 o más mesas operativas fuera de otros grupos. Al confirmar, los tickets activos pasan a la mesa principal y la cuenta queda unificada.</span>
            </div>
          )}

          <section className="pedidos-grid">
            {mesasPaginadas.map((mesa) => {
              const mesaIdActual = mesa?.mesaId || null;
              const esMesaPrincipal = mesasConfiguradas.some(
                (m) => mesaIdActual && m.mesaGrupoId && String(m.mesaGrupoId) === String(mesaIdActual)
              );
              const esMesaSecundaria = mesasConfiguradas.find(
                (m) => mesaIdActual && String(m.id) === String(mesaIdActual) && m.mesaGrupoId
              )?.mesaGrupoId;
              const enGrupo = esMesaPrincipal || Boolean(esMesaSecundaria);
              const mesaPrincipalIdGrupo = esMesaSecundaria || (esMesaPrincipal ? mesa.mesaId : null);
              const seleccionada = mesasSeleccionadas.has(mesa.mesaId);
              const mesaSeleccionable =
                Boolean(mesa.mesaId) &&
                !enGrupo &&
                !['inactiva', 'reservada'].includes(String(mesa?.mesaEstado || 'disponible'));

              return (
                <div
                  key={mesa.id}
                  className={`pedidos-mesa-wrapper${modoUnirMesas ? ' modo-seleccion' : ''}${seleccionada ? ' seleccionada' : ''}${enGrupo ? ' en-grupo' : ''}`}
                  onClick={modoUnirMesas && mesaSeleccionable ? () => toggleSeleccionMesa(mesa.mesaId) : undefined}
                  style={modoUnirMesas ? { cursor: mesaSeleccionable ? 'pointer' : 'not-allowed' } : undefined}
                >
                  {modoUnirMesas && mesa.mesaId && (
                    <div className="pedidos-mesa-checkbox">
                      <input
                        type="checkbox"
                        readOnly
                        checked={seleccionada}
                        disabled={!mesaSeleccionable}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleSeleccionMesa(mesa.mesaId)}
                      />
                    </div>
                  )}

                  {enGrupo && !modoUnirMesas && (
                    <div className="pedidos-grupo-badge">
                      <span>Grupo activo</span>
                      {esMesaPrincipal && (
                        <>
                          <button
                            type="button"
                            className="pedidos-grupo-btn pedidos-grupo-btn-cuenta"
                            onClick={() => abrirCuentaUnificada(mesa)}
                          >
                            Cuenta unificada
                          </button>
                          <button
                            type="button"
                            className="pedidos-grupo-btn pedidos-grupo-btn-separar"
                            disabled={Boolean(separandoMesas) && String(separandoMesas) === String(mesa.mesaId)}
                            onClick={() => handleSepararMesas(mesa.mesaId)}
                          >
                            {Boolean(separandoMesas) && String(separandoMesas) === String(mesa.mesaId) ? 'Separando...' : 'Separar'}
                          </button>
                        </>
                      )}
                      {Boolean(esMesaSecundaria) && (
                        <span className="pedidos-grupo-secundaria">
                          Unida a Mesa {mesasConfiguradas.find((m) => m.id === mesaPrincipalIdGrupo)?.numero || mesaPrincipalIdGrupo}
                        </span>
                      )}
                    </div>
                  )}

                  <PedidoCard
                    grupo={mesa}
                    onEstado={cambiarEstado}
                    onAnunciar={anunciarPedido}
                      onMarcarPagado={marcarPagado}
                      onCancelarPedido={puedeCancelarPedido ? noAceptarOCancelarPedido : null}
                      onEliminarPedido={puedeEliminarPedido ? borrarPedido : null}
                      onMesaDisponible={puedeLiberarMesa ? marcarMesaDisponible : null}
                    puedeAnunciar={puedeAnunciar}
                    puedeMarcarPagado={puedeMarcarPago}
                    puedeVerTotales={puedeVerTotalesPedido}
                    resolverAccionEstado={resolverAccionEstado}
                    pedidoAccionId={pedidoAccionId}
                    pedidoAnuncioId={pedidoAnuncioId}
                      pedidoPagoId={pedidoPagoId}
                      pedidoEliminandoId={pedidoEliminandoId}
                      mesaEstadoId={mesaEstadoId}
                  />
                </div>
              );
            })}
          </section>

          {/* â”€â”€ Barra flotante de selecciÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {modoUnirMesas && mesasSeleccionadas.size >= 2 && (
            <div className="pedidos-unir-float-bar">
              <span>{mesasSeleccionadas.size} mesas seleccionadas</span>
              <button
                type="button"
                className="pedido-btn pedido-btn-primary"
                onClick={() => {
                  const primeraId = [...mesasSeleccionadas][0];
                  setMesaPrincipalSeleccionada(String(primeraId));
                  setModalUnirMesas(true);
                }}
              >
                Unir mesas
              </button>
              <button type="button" className="pedido-btn pedido-btn-ghost" onClick={cancelarModoUnir}>
                Cancelar
              </button>
            </div>
          )}

          {/* â”€â”€ Modal: confirmar uniÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {modalUnirMesas && (
            <div className="pedidos-modal-overlay" onClick={() => !uniendoMesas && cancelarModoUnir()}>
              <div className="pedidos-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Unir mesas seleccionadas</h3>
                <p>
                  Elige cuál es la <strong>mesa principal</strong>. Los pedidos de todas las
                  mesas del grupo se mostrarán juntos en la cuenta unificada.
                </p>

                <label className="pedidos-modal-field">
                  <span>Mesa principal del grupo</span>
                  <select
                    value={mesaPrincipalSeleccionada}
                    onChange={(e) => setMesaPrincipalSeleccionada(e.target.value)}
                  >
                    {[...mesasSeleccionadas].map((mesaId) => {
                      const mc = mesasConfiguradas.find((m) => m.id === mesaId);
                      return (
                        <option key={mesaId} value={mesaId}>
                          Mesa {mc?.numero || mesaId}{mc?.nombre ? ` — ${mc.nombre}` : ''}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <div className="pedidos-modal-mesas-preview">
                  {[...mesasSeleccionadas].map((mesaId) => {
                    const mc = mesasConfiguradas.find((m) => m.id === mesaId);
                    const esPrincipal = String(mesaId) === String(mesaPrincipalSeleccionada);
                    return (
                      <div key={mesaId} className={`pedidos-modal-mesa-chip${esPrincipal ? ' principal' : ''}`}>
                        <span>Mesa {mc?.numero || mesaId}</span>
                        {esPrincipal && <strong>Principal</strong>}
                      </div>
                    );
                  })}
                </div>

                <div className="pedidos-modal-actions">
                  <button
                    type="button"
                    className="pedido-btn pedido-btn-ghost"
                    onClick={cancelarModoUnir}
                    disabled={uniendoMesas}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="pedido-btn pedido-btn-primary"
                    onClick={confirmarUnionMesas}
                    disabled={uniendoMesas || !mesaPrincipalSeleccionada}
                  >
                    {uniendoMesas ? 'Uniendo...' : 'Confirmar unión'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* â”€â”€ Modal: cuenta unificada â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {modalCuentaUnificada && (
            <div className="pedidos-modal-overlay" onClick={() => { setModalCuentaUnificada(null); setCuentaUnificadaData(null); }}>
              <div className="pedidos-modal pedidos-modal-cuenta" onClick={(e) => e.stopPropagation()}>
                <h3>Cuenta unificada — {modalCuentaUnificada.mesaLabel}</h3>

                {cargandoCuenta ? (
                  <div className="pedidos-modal-loading">Cargando cuenta...</div>
                ) : cuentaUnificadaData ? (
                  <>
                    <div className="pedidos-cuenta-mesas">
                      {cuentaUnificadaData.mesas?.map((m) => (
                        <span key={m.id} className="pedidos-cuenta-mesa-chip">
                          Mesa {m.numero}{m.nombre ? ` — ${m.nombre}` : ''}
                        </span>
                      ))}
                    </div>

                    <div className="pedidos-cuenta-resumen">
                      <div><span>Pedidos activos</span><strong>{cuentaUnificadaData.resumen?.totalPedidos}</strong></div>
                      <div><span>Total</span><strong>{formatCurrency(cuentaUnificadaData.resumen?.total)}</strong></div>
                      <div><span>Pagado</span><strong>{formatCurrency(cuentaUnificadaData.resumen?.totalPagado)}</strong></div>
                      <div><span>Pendiente de pago</span><strong>{formatCurrency(cuentaUnificadaData.resumen?.pendientePago)}</strong></div>
                    </div>

                    {cuentaUnificadaData.pedidos?.map((pedido) => (
                      <div key={pedido.id} className="pedidos-cuenta-pedido">
                        <div className="pedidos-cuenta-pedido-head">
                          <span>
                            Mesa {pedido.mesa?.numero} · Pedido #{pedido.numero || pedido.id}
                          </span>
                          <span className={`pedidos-estado-chip pedidos-estado-${pedido.estado}`}>
                            {pedido.estado}
                          </span>
                          <strong>{formatCurrency(pedido.total)}</strong>
                        </div>
                        <ul className="pedidos-cuenta-items">
                          {pedido.items?.map((item) => (
                            <li key={item.id}>
                              <span>{item.cantidad}× {item.nombreProducto}</span>
                              <span>{formatCurrency(item.subtotal || item.totalItem)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </>
                ) : (
                  <p>No hay pedidos activos en este grupo.</p>
                )}

                <div className="pedidos-modal-actions">
                  <button
                    type="button"
                    className="pedido-btn pedido-btn-ghost"
                    onClick={() => { setModalCuentaUnificada(null); setCuentaUnificadaData(null); }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          <section className="pedidos-pagination">
            <div className="pedidos-pagination-copy">
              <span>Lectura paginada</span>
              <strong>
                Mostrando {inicioVisible}-{finVisible} de {totalMesasVisibles} mesa(s)
              </strong>
              <p>Evita scroll infinito y mantiene la vista estable para operacion diaria.</p>
            </div>

            <div className="pedidos-pagination-controls">
              <label className="pedidos-page-size">
                <span>Tarjetas por pagina</span>
                <select
                  value={tarjetasPorPagina}
                  onChange={(e) => setTarjetasPorPagina(Number(e.target.value))}
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>

              <div className="pedidos-page-nav">
                <button
                  type="button"
                  className="pedidos-page-btn"
                  onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
                  disabled={paginaActual === 1}
                >
                  Anterior
                </button>

                <div className="pedidos-page-numbers">
                  {paginasVisibles.map((pagina) => (
                    <button
                      key={pagina}
                      type="button"
                      className={`pedidos-page-btn ${paginaActual === pagina ? 'active' : ''}`}
                      onClick={() => setPaginaActual(pagina)}
                    >
                      {pagina}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="pedidos-page-btn"
                  onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function capacidadadesToBool(value) {
  return Boolean(value);
}
