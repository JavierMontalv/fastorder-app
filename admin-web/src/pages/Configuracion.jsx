import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import LogoUploader from '../components/LogoUploader';
import PortadaUploader from '../components/PortadaUploader';
import PublicMenuPreview from '../components/PublicMenuPreview';
import QRCard from '../components/QRCard';
import {
  actualizarConfigRestaurante,
  obtenerConfigRestaurante,
  obtenerQRRestaurante,
  obtenerSedesRestaurante,
  seleccionarSedeRestaurante
} from '../api/restauranteApi';
import {
  actualizarMesa,
  crearMesa,
  descargarPDFQRMesa,
  eliminarMesa,
  liberarMesa,
  listarMesas,
  obtenerQRMesa,
  obtenerCuentaUnificada,
  ocuparMesa,
  quitarMesaDelGrupo,
  separarMesas,
  unirMesas
} from '../api/mesaApi';
import { normalizeAssetUrl } from '../config/env';
import { AuthContext } from '../context/AuthContext';
import { useIAContext } from '../context/IAContext';
import { PEDIDOS_REALTIME_EVENTS } from '../utils/pedidosRealtime';
import '../styles/Configuracion.css';
import '../styles/ConfigurationWorkspace.css';
import { configurationSections, featureLabels } from '../config/configurationSections.mjs';

const CONFIG_INICIAL = {
  nombre: '',
  descripcion: '',
  telefono: '',
  direccion: '',
  tiempoPreparacion: 15,
  horarioApertura: '08:00',
  horarioCierre: '22:00',
  permitirPedidosParaLlevar: true,
  aceptaPropinas: false,
  propinaSugerida: 0,
  idiomaMenu: 'es',
  tema: 'light',
  colorTemaQR: '#FF4C29',
  colorSecundario: '#1F1F1F',
  mensajeBienvenida: '',
  activarIA: false,
  modoIA: 'off',
  traduccionAutomatica: false,
  upsellActivo: false,
  estadoOperacion: 'cerrado'
};

const monedaCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});

const LOGO_ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml'
]);

const PORTADA_ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']);

const extensionMatches = (fileName = '', extensions = []) => {
  const lower = String(fileName).toLowerCase();
  return extensions.some((extension) => lower.endsWith(extension));
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const compareMesaNumero = (a, b) => {
  const numeroA = toNumber(a?.numero);
  const numeroB = toNumber(b?.numero);

  if (numeroA != null && numeroB != null) return numeroA - numeroB;
  return String(a?.numero || '').localeCompare(String(b?.numero || ''), 'es');
};

const formatMesaLabel = (mesa) => {
  if (!mesa) return 'Mesa sin identificar';
  return `Mesa ${mesa.numero}${mesa.nombre ? ` · ${mesa.nombre}` : ''}`;
};

const normalizeMesaForGroupMember = (mesa, mesaPrincipalId) => ({
  id: Number(mesa?.id),
  numero: mesa?.numero ?? null,
  nombre: mesa?.nombre ?? null,
  capacidad: Number(mesa?.capacidad) || 0,
  estado: mesa?.estado || 'ocupada',
  esPrincipal: Number(mesa?.id) === Number(mesaPrincipalId) || Boolean(mesa?.esPrincipal)
});

const applyGroupSummaryToMesas = (mesasActuales, grupoPayload) => {
  const mesaPrincipalId = Number(grupoPayload?.mesaPrincipalId || grupoPayload?.mesaCuentaId);
  if (!mesaPrincipalId) return mesasActuales;

  const miembrosBase = Array.isArray(grupoPayload?.grupoMesas) && grupoPayload.grupoMesas.length > 0
    ? grupoPayload.grupoMesas
    : Array.isArray(grupoPayload?.mesas) && grupoPayload.mesas.length > 0
      ? grupoPayload.mesas
      : [];

  const miembrosGrupo = miembrosBase
    .map((mesa) => normalizeMesaForGroupMember(mesa, mesaPrincipalId))
    .filter((mesa) => Number.isFinite(mesa.id))
    .sort(compareMesaNumero);

  if (miembrosGrupo.length === 0) return mesasActuales;

  const miembrosIds = new Set(miembrosGrupo.map((mesa) => Number(mesa.id)));
  const mesaPrincipal =
    miembrosGrupo.find((mesa) => mesa.esPrincipal) ||
    miembrosGrupo.find((mesa) => Number(mesa.id) === mesaPrincipalId) ||
    miembrosGrupo[0];

  const capacidadGrupo =
    Number(grupoPayload?.capacidadGrupo) ||
    miembrosGrupo.reduce((sum, mesa) => sum + (Number(mesa?.capacidad) || 0), 0);
  const pedidosActivosGrupo = Number(grupoPayload?.pedidosActivosGrupo || 0);
  const grupoLabel =
    grupoPayload?.grupoLabel ||
    `Mesas ${miembrosGrupo.map((mesa) => mesa.numero).filter(Boolean).join(' + ')}`;
  const grupoMesasResumen = miembrosGrupo.map((mesa) => ({
    id: Number(mesa.id),
    numero: mesa.numero,
    nombre: mesa.nombre,
    capacidad: Number(mesa.capacidad) || 0,
    estado: mesa.estado || 'ocupada',
    esPrincipal: Number(mesa.id) === Number(mesaPrincipal?.id)
  }));

  return mesasActuales.map((mesa) => {
    if (!miembrosIds.has(Number(mesa.id))) return mesa;

    const miembro = miembrosGrupo.find((item) => Number(item.id) === Number(mesa.id)) || mesa;
    const esPrincipal = Number(miembro.id) === Number(mesaPrincipal?.id);

    return {
      ...mesa,
      numero: miembro.numero ?? mesa.numero,
      nombre: miembro.nombre ?? mesa.nombre,
      capacidad: Number(miembro.capacidad) || Number(mesa.capacidad) || 0,
      estadoPersistido: 'ocupada',
      estado: mesa.estado === 'inactiva' || mesa.estado === 'reservada' ? mesa.estado : 'ocupada',
      mesaGrupoId: esPrincipal ? null : Number(mesaPrincipal?.id),
      mesaCuentaId: Number(mesaPrincipal?.id),
      mesaCuentaNumero: mesaPrincipal?.numero ?? mesa.numero,
      mesaCuentaNombre: mesaPrincipal?.nombre ?? null,
      cuentaCompartidaActiva: true,
      capacidadGrupo,
      pedidosActivosGrupo,
      grupoLabel,
      grupoMesas: grupoMesasResumen,
      totalMesasGrupo: grupoMesasResumen.length,
      esMesaPrincipal: esPrincipal,
      esMesaSecundaria: !esPrincipal,
      grupoInconsistente: false
    };
  });
};

const clearGroupSummaryFromMesas = (mesasActuales, mesasIds = []) => {
  const ids = new Set((mesasIds || []).map(Number).filter(Boolean));
  if (ids.size === 0) return mesasActuales;

  return mesasActuales.map((mesa) => {
    if (!ids.has(Number(mesa.id))) return mesa;

    const estadoBase = mesa.estado === 'inactiva' || mesa.estado === 'reservada'
      ? mesa.estado
      : Number(mesa.pedidosActivos) > 0
        ? 'ocupada'
        : 'disponible';

    return {
      ...mesa,
      estadoPersistido: estadoBase,
      estado: estadoBase,
      mesaGrupoId: null,
      mesaCuentaId: Number(mesa.id),
      mesaCuentaNumero: mesa.numero,
      mesaCuentaNombre: mesa.nombre || null,
      cuentaCompartidaActiva: false,
      capacidadGrupo: Number(mesa.capacidad) || 0,
      pedidosActivosGrupo: Number(mesa.pedidosActivos) || 0,
      grupoLabel: formatMesaLabel(mesa),
      grupoMesas: [{
        id: Number(mesa.id),
        numero: mesa.numero,
        nombre: mesa.nombre,
        capacidad: Number(mesa.capacidad) || 0,
        estado: estadoBase,
        esPrincipal: true
      }],
      totalMesasGrupo: 1,
      esMesaPrincipal: false,
      esMesaSecundaria: false,
      grupoInconsistente: false
    };
  });
};

const buildRenderableGroup = (grupoPayload, mesasFallback = []) => {
  if (!grupoPayload) return null;

  const mesaPrincipalId = Number(grupoPayload?.mesaPrincipalId || grupoPayload?.mesaCuentaId);
  if (!mesaPrincipalId) return null;

  const miembrosBase = Array.isArray(grupoPayload?.grupoMesas) && grupoPayload.grupoMesas.length > 0
    ? grupoPayload.grupoMesas
    : Array.isArray(grupoPayload?.mesas) && grupoPayload.mesas.length > 0
      ? grupoPayload.mesas
      : [];

  const grupoMesas = miembrosBase
    .map((mesa) => normalizeMesaForGroupMember(mesa, mesaPrincipalId))
    .filter((mesa) => Number.isFinite(mesa.id))
    .sort(compareMesaNumero);

  if (grupoMesas.length === 0) return null;

  const mesaPrincipal =
    grupoMesas.find((mesa) => mesa.esPrincipal) ||
    mesasFallback.find((mesa) => Number(mesa.id) === mesaPrincipalId) ||
    grupoMesas[0];

  const capacidadGrupo =
    Number(grupoPayload?.capacidadGrupo) ||
    grupoMesas.reduce((sum, mesa) => sum + (Number(mesa?.capacidad) || 0), 0);
  const pedidosActivosGrupo = Number(grupoPayload?.pedidosActivosGrupo || 0);
  const numerosGrupo = grupoMesas.map((mesa) => mesa.numero).filter(Boolean);

  return {
    ...(mesaPrincipal || {}),
    id: Number(mesaPrincipal?.id || mesaPrincipalId),
    mesaCuentaId: Number(mesaPrincipalId),
    mesaCuentaNumero: mesaPrincipal?.numero || grupoMesas[0]?.numero || null,
    mesaPrincipalId: Number(mesaPrincipal?.id || mesaPrincipalId),
    mesaPrincipalLabel: formatMesaLabel(mesaPrincipal || grupoMesas[0]),
    grupoLabel:
      grupoPayload?.grupoLabel ||
      (numerosGrupo.length > 1
        ? `Mesas ${numerosGrupo.join(' + ')}`
        : formatMesaLabel(mesaPrincipal || grupoMesas[0])),
    grupoMesas: grupoMesas.map((mesa) => ({
      id: Number(mesa.id),
      numero: mesa.numero,
      nombre: mesa.nombre,
      capacidad: Number(mesa.capacidad) || 0,
      estado: mesa.estado || 'ocupada',
      esPrincipal: Boolean(mesa.esPrincipal)
    })),
    totalMesasGrupo: grupoMesas.length,
    capacidadGrupo,
    pedidosActivosGrupo,
    cuentaCompartidaActiva: grupoMesas.length > 1,
    grupoInconsistente: false
  };
};

const upsertManualGroup = (gruposActuales, grupo) => {
  if (!grupo?.mesaCuentaId && !grupo?.id) return gruposActuales;
  const next = new Map(
    (gruposActuales || []).map((item) => [Number(item.mesaCuentaId || item.id), item])
  );
  next.set(Number(grupo.mesaCuentaId || grupo.id), grupo);
  return [...next.values()].sort(compareMesaNumero);
};

const removeManualGroup = (gruposActuales, mesaPrincipalId) =>
  (gruposActuales || []).filter(
    (item) => Number(item.mesaCuentaId || item.id) !== Number(mesaPrincipalId)
  );

const esArchivoBrandingValido = (file, tipo = 'logo') => {
  if (!file) return { valido: false, mensaje: 'No se encontro archivo para subir.' };

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valido: false, mensaje: 'El archivo supera el limite de 5 MB.' };
  }

  const mime = String(file.type || '').toLowerCase();
  if (tipo === 'logo') {
    if (
      LOGO_ALLOWED_MIME.has(mime) ||
      extensionMatches(file.name, ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg'])
    ) {
      return { valido: true };
    }

    return {
      valido: false,
      mensaje: 'Logo no permitido. Usa PNG, JPG, WEBP, AVIF o SVG.'
    };
  }

  if (
    PORTADA_ALLOWED_MIME.has(mime) ||
    extensionMatches(file.name, ['.png', '.jpg', '.jpeg', '.webp', '.avif'])
  ) {
    return { valido: true };
  }

  return {
    valido: false,
    mensaje: 'Portada no permitida. Usa PNG, JPG, WEBP o AVIF.'
  };
};

export default function Configuracion() {
  const navigate = useNavigate();
  const [sectionParams, setSectionParams] = useSearchParams();
  const requestedSection = configurationSections.some(item => item.id === sectionParams.get('seccion')) ? sectionParams.get('seccion') : 'restaurante';
  function selectSection(id) { setSectionParams(previous => { const next = new URLSearchParams(previous); next.set('seccion', id); return next; }, { replace: true }); }
  const { user, refreshProfile } = useContext(AuthContext);
  const [config, setConfig] = useState(CONFIG_INICIAL);
  const [logoArchivo, setLogoArchivo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [portadaArchivo, setPortadaArchivo] = useState(null);
  const [portadaPreview, setPortadaPreview] = useState(null);
  const [clearLogoRequested, setClearLogoRequested] = useState(false);
  const [clearPortadaRequested, setClearPortadaRequested] = useState(false);
  const [qrData, setQrData] = useState({ qrUrl: null, menuUrl: '' });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [multisede, setMultisede] = useState({ multisede_habilitado: false, sedes: [] });
  const activeSection = requestedSection === 'sedes' && !multisede.multisede_habilitado ? 'restaurante' : requestedSection;
  const [gestionandoSedeId, setGestionandoSedeId] = useState(null);
  const { estadoIA, planAllowsAI, hasFeature } = useIAContext();

  // ── Mesas ──
  const [mesas, setMesas] = useState([]);
  const [mesasQR, setMesasQR] = useState({});          // { [id]: { qrBase64, qrUrl } }
  const [mesasQRLoading, setMesasQRLoading] = useState({});
  const [mesaForm, setMesaForm] = useState({ numero: '', nombre: '', capacidad: 4 });
  const [mesaEditando, setMesaEditando] = useState(null); // id
  const [mesaGuardando, setMesaGuardando] = useState(false);
  const [mesaEstadoActualizandoId, setMesaEstadoActualizandoId] = useState(null);
  const [mesaError, setMesaError] = useState('');
  const [sincronizandoMesas, setSincronizandoMesas] = useState(false);
  const [mesasGrupoSeleccionadas, setMesasGrupoSeleccionadas] = useState(new Set());
  const [mesaPrincipalGrupoId, setMesaPrincipalGrupoId] = useState('');
  const [guardandoGrupoMesas, setGuardandoGrupoMesas] = useState(false);
  const [gruposMesasManuales, setGruposMesasManuales] = useState([]);
  const [separandoGrupoId, setSeparandoGrupoId] = useState(null);
  const [removiendoMesaGrupoId, setRemoviendoMesaGrupoId] = useState(null);
  const [cuentaGrupoModal, setCuentaGrupoModal] = useState(null);
  const [cuentaGrupoData, setCuentaGrupoData] = useState(null);
  const [cuentaGrupoLoading, setCuentaGrupoLoading] = useState(false);
  const mesaFormRef = useRef(null);
  const mesasSyncTimeoutRef = useRef(null);
  const scheduleMesasSyncRef = useRef(() => {});
  const mesasRef = useRef([]);

  const refrescarMesas = async ({ silencioso = false } = {}) => {
    try {
      if (!silencioso) setSincronizandoMesas(true);
      const { data } = await listarMesas();
      const mesasActualizadas = data?.data || [];
      const hayGruposPersistidos = mesasActualizadas.some((mesa) =>
        Boolean(mesa?.cuentaCompartidaActiva || mesa?.esMesaPrincipal || mesa?.esMesaSecundaria || mesa?.mesaGrupoId)
      );

      setMesas(mesasActualizadas);
      if (hayGruposPersistidos) {
        setGruposMesasManuales([]);
      }

      return mesasActualizadas;
    } catch (err) {
      if (!silencioso) {
        toast.error(err?.response?.data?.message || 'No se pudo sincronizar el estado de las mesas.');
      }
      return [];
    } finally {
      if (!silencioso) setSincronizandoMesas(false);
    }
  };

  scheduleMesasSyncRef.current = ({ delay = 900, silencioso = true } = {}) => {
    if (typeof window === 'undefined') return;
    if (mesasSyncTimeoutRef.current) {
      window.clearTimeout(mesasSyncTimeoutRef.current);
    }

    mesasSyncTimeoutRef.current = window.setTimeout(() => {
      refrescarMesas({ silencioso });
    }, delay);
  };

  useEffect(() => {
    mesasRef.current = mesas;
  }, [mesas]);

  const cargarConfig = async () => {
    try {
      setCargando(true);
      setError('');

      const [{ data: configRes }, { data: qrRes }, { data: mesasRes }, sedesResult] = await Promise.all([
        obtenerConfigRestaurante(),
        obtenerQRRestaurante(),
        listarMesas(),
        obtenerSedesRestaurante().catch(() => null)
      ]);

      const data = configRes?.data || {};
      setConfig({ ...CONFIG_INICIAL, ...data });
      setLogoArchivo(null);
      setPortadaArchivo(null);
      setLogoPreview(normalizeAssetUrl(data.logoUrl) || null);
      setPortadaPreview(normalizeAssetUrl(data.portadaUrl) || null);
      setClearLogoRequested(false);
      setClearPortadaRequested(false);
      setQrData({
        qrUrl: qrRes?.data?.qrUrl || null,
        menuUrl: qrRes?.data?.menuUrl || data.menuUrl || ''
      });
      setMultisede(sedesResult?.data?.data || { multisede_habilitado: false, sedes: [] });
      const mesasIniciales = mesasRes?.data?.data || mesasRes?.data || [];
      const hayGruposPersistidos = mesasIniciales.some((mesa) =>
        Boolean(mesa?.cuentaCompartidaActiva || mesa?.esMesaPrincipal || mesa?.esMesaSecundaria || mesa?.mesaGrupoId)
      );

      setMesas(mesasIniciales);
      if (hayGruposPersistidos) {
        setGruposMesasManuales([]);
      }
    } catch (err) {
      setError(err?.message || 'No se pudo cargar la configuracion del restaurante.');
    } finally {
      setCargando(false);
    }
  };

  const gestionarSede = async (sede) => {
    const sedeId = Number(sede?.id);
    if (!sedeId) return;

    if (sedeId === Number(user?.restauranteId)) {
      toast.info('Ya estas gestionando esta sede.');
      return;
    }

    try {
      setGestionandoSedeId(sedeId);
      await seleccionarSedeRestaurante(sedeId);
      localStorage.setItem('comanda_sede_activa_id', String(sedeId));
      await refreshProfile?.();
      toast.success(`Ahora estas gestionando ${sede.sede_nombre || sede.nombre}.`);
      navigate('/configuracion', { replace: true });
      window.location.reload();
    } catch (err) {
      toast.error(err?.message || 'No fue posible cambiar a esta sede.');
    } finally {
      setGestionandoSedeId(null);
    }
  };

  // ── Cargar QR de una mesa (lazy, al hacer clic en "Ver QR") ──
  const cargarQRMesa = async (id) => {
    if (mesasQR[id] || mesasQRLoading[id]) return;
    setMesasQRLoading((p) => ({ ...p, [id]: true }));
    try {
      const { data } = await obtenerQRMesa(id);
      setMesasQR((p) => ({ ...p, [id]: data.data }));
    } catch {
      toast.error('No se pudo cargar el QR de esta mesa.');
    } finally {
      setMesasQRLoading((p) => ({ ...p, [id]: false }));
    }
  };

  // ── Descargar PDF QR de mesa ──
  const descargarPDF = async (id, numero) => {
    try {
      const { data: blob } = await descargarPDFQRMesa(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-mesa-${numero}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('No se pudo descargar el PDF.');
    }
  };

  // ── Guardar mesa (crear o actualizar) ──
  const guardarMesa = async (e) => {
    e.preventDefault();
    if (!mesaForm.numero) return setMesaError('El número de mesa es obligatorio.');
    setMesaGuardando(true);
    setMesaError('');
    try {
      if (mesaEditando) {
        const { data: res } = await actualizarMesa(mesaEditando, {
          numero: Number(mesaForm.numero),
          nombre: mesaForm.nombre || undefined,
          capacidad: Number(mesaForm.capacidad)
        });
        setMesas((prev) => prev.map((m) => (m.id === mesaEditando ? res.data : m)));
        // Invalidar QR cacheado si cambió número
        setMesasQR((p) => { const n = { ...p }; delete n[mesaEditando]; return n; });
        toast.success(`Mesa ${res.data?.numero} actualizada.`);
      } else {
        const { data: res } = await crearMesa({
          numero: Number(mesaForm.numero),
          nombre: mesaForm.nombre || undefined,
          capacidad: Number(mesaForm.capacidad)
        });
        setMesas((prev) => [...prev, res.data]);
        toast.success(`Mesa ${res.data?.numero} creada.`);
      }
      setMesaForm({ numero: '', nombre: '', capacidad: 4 });
      setMesaEditando(null);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al guardar la mesa.';
      setMesaError(msg);
      toast.error(msg);
    } finally {
      setMesaGuardando(false);
    }
  };

  // ── Editar mesa ──
  const iniciarEdicion = (mesa) => {
    setMesaEditando(mesa.id);
    setMesaForm({ numero: mesa.numero, nombre: mesa.nombre || '', capacidad: mesa.capacidad });
    setMesaError('');
    mesaFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // ── Cancelar edición ──
  const cancelarEdicion = () => {
    setMesaEditando(null);
    setMesaForm({ numero: '', nombre: '', capacidad: 4 });
    setMesaError('');
  };

  // ── Eliminar mesa ──
  const borrarMesa = async (id, numero) => {
    if (!window.confirm(`¿Eliminar mesa ${numero}? Solo es posible si no tiene pedidos activos.`)) return;
    try {
      await eliminarMesa(id);
      setMesas((prev) => prev.filter((m) => m.id !== id));
      setMesasQR((p) => { const n = { ...p }; delete n[id]; return n; });
      toast.success(`Mesa ${numero} eliminada.`);
    } catch (err) {
      const msg = err?.response?.data?.message || 'No se pudo eliminar la mesa.';
      toast.error(msg);
    }
  };

  const marcarMesaDisponible = async (mesa) => {
    setMesaEstadoActualizandoId(mesa.id);
    try {
      const { data } = await liberarMesa(mesa.id);
      setMesas((prev) => prev.map((item) => (item.id === mesa.id ? data.data : item)));
      toast.success(`Mesa ${mesa.numero} marcada como disponible.`);
    } catch (err) {
      const msg = err?.response?.data?.message || 'No se pudo liberar la mesa.';
      toast.error(msg);
      await refrescarMesas({ silencioso: true });
    } finally {
      setMesaEstadoActualizandoId(null);
    }
  };

  const marcarMesaOcupada = async (mesa) => {
    setMesaEstadoActualizandoId(mesa.id);
    try {
      const { data } = await ocuparMesa(mesa.id);
      setMesas((prev) => prev.map((item) => (item.id === mesa.id ? data.data : item)));
      toast.success(`Mesa ${mesa.numero} marcada como ocupada.`);
    } catch (err) {
      const msg = err?.response?.data?.message || 'No se pudo marcar la mesa como ocupada.';
      toast.error(msg);
      await refrescarMesas({ silencioso: true });
    } finally {
      setMesaEstadoActualizandoId(null);
    }
  };

  const limpiarConstructorGrupo = () => {
    setMesasGrupoSeleccionadas(new Set());
    setMesaPrincipalGrupoId('');
  };

  const toggleMesaGrupoSeleccionada = (mesaId) => {
    setMesasGrupoSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(mesaId)) {
        next.delete(mesaId);
      } else {
        next.add(mesaId);
      }
      return next;
    });
  };

  useEffect(() => {
    cargarConfig();

    const intervalId = window.setInterval(() => {
      refrescarMesas({ silencioso: true });
    }, 30000);

    const handleWindowFocus = () => {
      scheduleMesasSyncRef.current({ delay: 150, silencioso: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleMesasSyncRef.current({ delay: 150, silencioso: true });
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (mesasSyncTimeoutRef.current) {
        window.clearTimeout(mesasSyncTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleMesasRealtimeSync = (event) => {
      const detail = event?.detail || {};

      if (detail?.type === 'mesas:grupo_creado') {
        const grupo = buildRenderableGroup(detail?.payload, mesasRef.current);
        if (grupo) {
          setGruposMesasManuales((prev) => upsertManualGroup(prev, grupo));
          setMesas((prev) => applyGroupSummaryToMesas(prev, grupo));
        }
      }

      if (detail?.type === 'mesas:grupo_disuelto') {
        const mesaPrincipalId = Number(detail?.payload?.mesaPrincipalId);
        const mesasIds = detail?.payload?.mesasIds || [];
        if (mesaPrincipalId) {
          setGruposMesasManuales((prev) => removeManualGroup(prev, mesaPrincipalId));
        }
        if (Array.isArray(mesasIds) && mesasIds.length > 0) {
          setMesas((prev) => clearGroupSummaryFromMesas(prev, mesasIds));
        }
      }

      if (detail?.type === 'mesas:grupo_actualizado') {
        const payload = detail?.payload || {};
        const grupo = buildRenderableGroup(
          payload?.grupoActual ? { ...payload.grupoActual, mesaPrincipalId: payload.mesaPrincipalId } : null,
          mesasRef.current
        );

        if (payload?.mesaPrincipalId && !grupo) {
          setGruposMesasManuales((prev) => removeManualGroup(prev, payload.mesaPrincipalId));
        }

        if (grupo) {
          setGruposMesasManuales((prev) => upsertManualGroup(prev, grupo));
          setMesas((prev) => applyGroupSummaryToMesas(prev, grupo));
        }
      }

      scheduleMesasSyncRef.current({ delay: 1100, silencioso: true });
    };

    window.addEventListener(PEDIDOS_REALTIME_EVENTS.mesasSync, handleMesasRealtimeSync);

    return () => {
      window.removeEventListener(PEDIDOS_REALTIME_EVENTS.mesasSync, handleMesasRealtimeSync);
    };
  }, []);

  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const manejarLogo = (file) => {
    if (file) {
      const validacion = esArchivoBrandingValido(file, 'logo');
      if (!validacion.valido) {
        toast.error(validacion.mensaje);
        return;
      }
    }

    setLogoArchivo(file || null);
    setClearLogoRequested(false);

    if (!file) {
      setLogoPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const manejarRemoverLogo = () => {
    setLogoArchivo(null);
    setLogoPreview(null);
    setClearLogoRequested(true);
    setConfig((prev) => ({ ...prev, logoUrl: '' }));
  };

  const manejarPortada = (file) => {
    if (file) {
      const validacion = esArchivoBrandingValido(file, 'portada');
      if (!validacion.valido) {
        toast.error(validacion.mensaje);
        return;
      }
    }

    setPortadaArchivo(file || null);
    setClearPortadaRequested(false);
    if (!file) { setPortadaPreview(null); return; }
    const reader = new FileReader();
    reader.onload = () => setPortadaPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const manejarRemoverPortada = () => {
    setPortadaArchivo(null);
    setPortadaPreview(null);
    setClearPortadaRequested(true);
    setConfig((prev) => ({ ...prev, portadaUrl: '' }));
  };

  const descargarQR = () => {
    if (!qrData.qrUrl) return;
    const link = document.createElement('a');
    link.href = qrData.qrUrl;
    link.download = `comanda-qr-${config.nombre || 'restaurante'}.png`;
    link.click();
  };

  const copiarMenuUrl = async () => {
    if (!qrData.menuUrl) return;
    await navigator.clipboard.writeText(qrData.menuUrl);
    toast.success('Enlace del menu copiado.');
  };

  const abrirMenuPublico = () => {
    if (!qrData.menuUrl) return;
    window.open(qrData.menuUrl, '_blank', 'noopener,noreferrer');
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError('');

    try {
      const formData = new FormData();
      Object.entries(config).forEach(([clave, valor]) => {
        formData.append(clave, valor);
      });

      if (logoArchivo) {
        formData.append('logo', logoArchivo);
      }
      if (portadaArchivo) {
        formData.append('portada', portadaArchivo);
      }
      if (clearLogoRequested) {
        formData.append('removeLogo', 'true');
      }
      if (clearPortadaRequested) {
        formData.append('removePortada', 'true');
      }

      const res = await actualizarConfigRestaurante(formData);
      const data = res?.data?.data || {};

      setConfig((prev) => ({
        ...prev,
        ...data
      }));
      setLogoPreview(normalizeAssetUrl(data.logoUrl) || logoPreview);
      setPortadaPreview(normalizeAssetUrl(data.portadaUrl) || portadaPreview);
      setLogoArchivo(null);
      setPortadaArchivo(null);
      setClearLogoRequested(false);
      setClearPortadaRequested(false);
      setQrData((prev) => ({
        ...prev,
        menuUrl: data.menuUrl || prev.menuUrl
      }));

      toast.success('Configuracion guardada correctamente.');
      await cargarConfig();
    } catch (err) {
      const mensaje = err?.message || 'No se pudo guardar la configuracion.';
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  const estadoOperacionTexto = useMemo(() => {
    return config.estadoOperacion === 'abierto'
      ? 'Abierto y recibiendo pedidos'
      : 'Cerrado al publico';
  }, [config.estadoOperacion]);

  const resumenMesas = useMemo(() => {
    const total = mesas.length;
    const disponibles = mesas.filter((mesa) => String(mesa.estado || 'disponible') === 'disponible').length;
    const ocupadas = mesas.filter((mesa) => String(mesa.estado || 'disponible') === 'ocupada').length;
    const capacidadTotal = mesas.reduce((sum, mesa) => sum + (Number(mesa.capacidad) || 0), 0);

    return {
      total,
      disponibles,
      ocupadas,
      capacidadTotal
    };
  }, [mesas]);

  const gruposMesasPersistidos = useMemo(() => {
    const gruposMap = new Map();

    mesas.forEach((mesa) => {
      const grupoId = Number(mesa?.mesaCuentaId || mesa?.mesaGrupoId || mesa?.id);
      const tieneRelacionGrupo = Boolean(
        mesa?.cuentaCompartidaActiva || mesa?.esMesaPrincipal || mesa?.esMesaSecundaria || mesa?.mesaGrupoId
      );

      if (!grupoId || !tieneRelacionGrupo) return;

      const entry = gruposMap.get(grupoId) || {
        groupId: grupoId,
        mesaPrincipal: null,
        mesasMap: new Map(),
        capacidadGrupo: 0,
        pedidosActivosGrupo: 0
      };

      const miembros = Array.isArray(mesa?.grupoMesas) && mesa.grupoMesas.length > 0
        ? mesa.grupoMesas
        : [{
            id: mesa.id,
            numero: mesa.numero,
            nombre: mesa.nombre,
            capacidad: mesa.capacidad,
            estado: mesa.estado,
            esPrincipal: Number(mesa.id) === grupoId
          }];

      miembros.forEach((miembro) => {
        entry.mesasMap.set(Number(miembro.id), {
          ...miembro,
          id: Number(miembro.id),
          esPrincipal: Boolean(miembro.esPrincipal || Number(miembro.id) === grupoId)
        });
      });

      if (mesa?.esMesaPrincipal || Number(mesa?.id) === grupoId) {
        entry.mesaPrincipal = mesa;
      }

      const capacidadMiembros = miembros.reduce(
        (sum, miembro) => sum + (Number(miembro?.capacidad) || 0),
        0
      );

      entry.capacidadGrupo = Math.max(
        entry.capacidadGrupo,
        Number(mesa?.capacidadGrupo) || 0,
        capacidadMiembros
      );
      entry.pedidosActivosGrupo = Math.max(
        entry.pedidosActivosGrupo,
        Number(mesa?.pedidosActivosGrupo) || 0
      );

      gruposMap.set(grupoId, entry);
    });

    return [...gruposMap.values()]
      .map((entry) => {
        const mesasGrupo = [...entry.mesasMap.values()].sort(compareMesaNumero);
        const mesaPrincipal =
          entry.mesaPrincipal ||
          mesas.find((mesa) => Number(mesa.id) === Number(entry.groupId)) ||
          mesasGrupo.find((mesa) => mesa.esPrincipal) ||
          mesasGrupo[0] ||
          null;

        const capacidadGrupo =
          entry.capacidadGrupo ||
          mesasGrupo.reduce((sum, mesa) => sum + (Number(mesa?.capacidad) || 0), 0);
        const numerosGrupo = mesasGrupo.map((mesa) => mesa.numero).filter(Boolean);

        return {
          ...(mesaPrincipal || {}),
          id: Number(mesaPrincipal?.id || entry.groupId),
          mesaCuentaId: Number(entry.groupId),
          mesaCuentaNumero: mesaPrincipal?.numero || mesasGrupo[0]?.numero || null,
          mesaPrincipalId: Number(mesaPrincipal?.id || entry.groupId),
          mesaPrincipalLabel: formatMesaLabel(mesaPrincipal || mesasGrupo[0]),
          grupoLabel:
            numerosGrupo.length > 1
              ? `Mesas ${numerosGrupo.join(' + ')}`
              : formatMesaLabel(mesaPrincipal || mesasGrupo[0]),
          grupoMesas: mesasGrupo,
          totalMesasGrupo: mesasGrupo.length,
          capacidadGrupo,
          pedidosActivosGrupo: entry.pedidosActivosGrupo,
          cuentaCompartidaActiva: mesasGrupo.length > 1,
          grupoInconsistente: !mesasGrupo.some((mesa) => Number(mesa.id) === Number(entry.groupId))
        };
      })
      .sort(compareMesaNumero);
  }, [mesas]);

  const gruposMesas = useMemo(() => {
    const groupsMap = new Map();

    gruposMesasPersistidos.forEach((grupo) => {
      groupsMap.set(Number(grupo.mesaCuentaId || grupo.id), grupo);
    });

    gruposMesasManuales.forEach((grupo) => {
      if (!grupo || Number(grupo.totalMesasGrupo || 0) < 2) return;
      groupsMap.set(Number(grupo.mesaCuentaId || grupo.id), grupo);
    });

    return [...groupsMap.values()].sort(compareMesaNumero);
  }, [gruposMesasManuales, gruposMesasPersistidos]);

  const grupoPorMesaId = useMemo(() => {
    const lookup = new Map();
    gruposMesas.forEach((grupo) => {
      (grupo?.grupoMesas || []).forEach((mesa) => {
        lookup.set(Number(mesa.id), grupo);
      });
    });
    return lookup;
  }, [gruposMesas]);

  const mesasAgrupadasIds = useMemo(
    () => new Set([...grupoPorMesaId.keys()].map((id) => Number(id))),
    [grupoPorMesaId]
  );

  const mesasElegiblesParaGrupo = useMemo(
    () =>
      mesas.filter(
        (mesa) =>
          !mesasAgrupadasIds.has(Number(mesa.id)) &&
          !['inactiva', 'reservada'].includes(String(mesa?.estado || 'disponible'))
      ),
    [mesas, mesasAgrupadasIds]
  );

  const resumenGrupos = useMemo(() => {
    const mesasAgrupadas = gruposMesas.reduce(
      (sum, grupo) => sum + (Array.isArray(grupo?.grupoMesas) ? grupo.grupoMesas.length : 0),
      0
    );
    const capacidadAgrupada = gruposMesas.reduce(
      (sum, grupo) => sum + (Number(grupo?.capacidadGrupo) || 0),
      0
    );
    const gruposInconsistentes = gruposMesas.filter((grupo) => grupo?.grupoInconsistente).length;

    return {
      totalGrupos: gruposMesas.length,
      mesasAgrupadas,
      capacidadAgrupada,
      gruposInconsistentes
    };
  }, [gruposMesas]);

  const mesasSeleccionadasGrupo = useMemo(
    () =>
      [...mesasGrupoSeleccionadas]
        .map((mesaId) => mesas.find((mesa) => Number(mesa.id) === Number(mesaId)))
        .filter(Boolean)
        .sort(compareMesaNumero),
    [mesas, mesasGrupoSeleccionadas]
  );

  const grupoPreview = useMemo(() => {
    if (mesasSeleccionadasGrupo.length < 2) return null;

    const mesaPrincipal =
      mesasSeleccionadasGrupo.find((mesa) => String(mesa.id) === String(mesaPrincipalGrupoId)) ||
      mesasSeleccionadasGrupo[0];

    if (!mesaPrincipal) return null;

    const capacidadGrupo = mesasSeleccionadasGrupo.reduce(
      (sum, mesa) => sum + (Number(mesa?.capacidad) || 0),
      0
    );

    const pedidosActivosGrupo = mesasSeleccionadasGrupo.reduce(
      (sum, mesa) => sum + (Number(mesa?.pedidosActivos || 0) || 0),
      0
    );

    return {
      id: `preview-${mesaPrincipal.id}`,
      mesaCuentaId: Number(mesaPrincipal.id),
      mesaPrincipalId: Number(mesaPrincipal.id),
      mesaCuentaNumero: mesaPrincipal.numero,
      mesaPrincipalLabel: formatMesaLabel(mesaPrincipal),
      grupoLabel: `Mesas ${mesasSeleccionadasGrupo.map((mesa) => mesa.numero).join(' + ')}`,
      grupoMesas: mesasSeleccionadasGrupo.map((mesa) => ({
        id: mesa.id,
        numero: mesa.numero,
        nombre: mesa.nombre,
        capacidad: mesa.capacidad,
        estado: mesa.estado,
        esPrincipal: Number(mesa.id) === Number(mesaPrincipal.id)
      })),
      totalMesasGrupo: mesasSeleccionadasGrupo.length,
      capacidadGrupo,
      pedidosActivosGrupo,
      grupoInconsistente: false,
      esPreview: true
    };
  }, [mesaPrincipalGrupoId, mesasSeleccionadasGrupo]);

  useEffect(() => {
    const elegiblesIds = new Set(mesasElegiblesParaGrupo.map((mesa) => Number(mesa.id)));

    setMesasGrupoSeleccionadas((prev) => {
      const next = new Set([...prev].filter((mesaId) => elegiblesIds.has(Number(mesaId))));
      if (next.size === prev.size) return prev;
      return next;
    });

    if (mesaPrincipalGrupoId && !elegiblesIds.has(Number(mesaPrincipalGrupoId))) {
      setMesaPrincipalGrupoId('');
    }
  }, [mesasElegiblesParaGrupo, mesaPrincipalGrupoId]);

  useEffect(() => {
    if (mesasGrupoSeleccionadas.size < 2) {
      setMesaPrincipalGrupoId('');
      return;
    }

    if (
      mesaPrincipalGrupoId &&
      [...mesasGrupoSeleccionadas].some((mesaId) => String(mesaId) === String(mesaPrincipalGrupoId))
    ) {
      return;
    }

    const primeraMesa = [...mesasGrupoSeleccionadas][0];
    setMesaPrincipalGrupoId(primeraMesa ? String(primeraMesa) : '');
  }, [mesaPrincipalGrupoId, mesasGrupoSeleccionadas]);

  const confirmarGrupoMesas = async () => {
    if (mesasGrupoSeleccionadas.size < 2 || !mesaPrincipalGrupoId) {
      toast.info('Selecciona al menos dos mesas y define una principal.');
      return;
    }

    const mesasSeleccionadas = [...mesasGrupoSeleccionadas]
      .map((mesaId) => mesas.find((item) => Number(item.id) === Number(mesaId)))
      .filter(Boolean);

    const mesaEnConflicto = mesasSeleccionadas.find((mesa) => grupoPorMesaId.has(Number(mesa.id)));
    if (mesaEnConflicto) {
      const grupoActual = grupoPorMesaId.get(Number(mesaEnConflicto.id));
      toast.info(
        `${formatMesaLabel(mesaEnConflicto)} ya está vinculada a ${grupoActual?.grupoLabel || 'un grupo activo'}. Sepárala o retírala del grupo antes de crear uno nuevo.`
      );
      await refrescarMesas({ silencioso: true });
      return;
    }

    const secundarias = [...mesasGrupoSeleccionadas]
      .map(Number)
      .filter((mesaId) => String(mesaId) !== String(mesaPrincipalGrupoId));

    try {
      setGuardandoGrupoMesas(true);
      const { data } = await unirMesas(Number(mesaPrincipalGrupoId), secundarias);
      const grupoCreado = buildRenderableGroup(data?.data ?? data ?? null, mesas);

      if (grupoCreado) {
        setGruposMesasManuales((prev) => upsertManualGroup(prev, grupoCreado));
        setMesas((prev) => applyGroupSummaryToMesas(prev, grupoCreado));
      } else {
        await refrescarMesas({ silencioso: true });
      }

      limpiarConstructorGrupo();
      scheduleMesasSyncRef.current({ delay: 1100, silencioso: true });
      toast.success('Grupo de mesas creado. La cuenta queda unificada en la mesa principal.');
    } catch (err) {
      await refrescarMesas({ silencioso: true });
      toast.error(err?.response?.data?.message || 'No se pudo unir las mesas seleccionadas.');
    } finally {
      setGuardandoGrupoMesas(false);
    }
  };

  const separarGrupoMesas = async (grupo) => {
    const mesaPrincipalId = Number(grupo?.mesaPrincipalId || grupo?.id);
    const pedidosActivosGrupo = Number(grupo?.pedidosActivosGrupo || 0);
    if (!mesaPrincipalId) return;
    if (pedidosActivosGrupo > 0) {
      toast.info(
        `Este grupo sigue con ${pedidosActivosGrupo} pedido(s) abiertos. Cierra la cuenta unificada antes de separar las mesas.`
      );
      return;
    }
    if (
      !window.confirm(
        `¿Separar ${grupo?.grupoLabel || 'este grupo'}? La acción solo funciona si la cuenta unificada ya no tiene pedidos activos.`
      )
    ) {
      return;
    }

    try {
      setSeparandoGrupoId(mesaPrincipalId);
      const { data } = await separarMesas(Number(mesaPrincipalId));
      const mesasIds = data?.data?.mesasIds || grupo?.grupoMesas?.map((mesa) => Number(mesa.id)) || [];
      setGruposMesasManuales((prev) => removeManualGroup(prev, mesaPrincipalId));
      setMesas((prev) => clearGroupSummaryFromMesas(prev, mesasIds));
      scheduleMesasSyncRef.current({ delay: 1100, silencioso: true });
      toast.success('Grupo separado correctamente. Las mesas quedaron listas para una nueva operación.');
    } catch (err) {
      await refrescarMesas({ silencioso: true });
      toast.error(err?.response?.data?.message || 'No se pudo separar el grupo de mesas.');
    } finally {
      setSeparandoGrupoId(null);
    }
  };

  const quitarMesaSecundariaDeGrupo = async (mesa, grupo) => {
    const pedidosActivosGrupo = Number(grupo?.pedidosActivosGrupo || 0);
    if (!mesa?.id || !grupo?.mesaPrincipalId) return;
    if (pedidosActivosGrupo > 0) {
      toast.info(
        `La cuenta unificada de ${grupo?.grupoLabel || 'este grupo'} sigue abierta. Cierra primero los ${pedidosActivosGrupo} pedido(s) activos.`
      );
      return;
    }
    if (
      !window.confirm(
        `¿Retirar ${formatMesaLabel(mesa)} de ${grupo.grupoLabel || 'este grupo'}? La cuenta unificada debe estar sin pedidos activos.`
      )
    ) {
      return;
    }

    try {
      setRemoviendoMesaGrupoId(Number(mesa.id));
      const { data } = await quitarMesaDelGrupo(Number(mesa.id));
      const payload = data?.data ?? data ?? null;
      setMesas((prev) => {
        let next = clearGroupSummaryFromMesas(prev, [Number(mesa.id)]);

        if (payload?.grupoDisuelto) {
          return clearGroupSummaryFromMesas(next, [Number(payload?.mesaPrincipalId)]);
        }

        if (payload?.grupoActual) {
          next = applyGroupSummaryToMesas(next, {
            ...payload.grupoActual,
            mesaPrincipalId: payload.mesaPrincipalId
          });
        }

        return next;
      });
      if (payload?.grupoDisuelto) {
        setGruposMesasManuales((prev) => removeManualGroup(prev, payload?.mesaPrincipalId));
      } else if (payload?.grupoActual) {
        const grupoActual = buildRenderableGroup(
          { ...payload.grupoActual, mesaPrincipalId: payload.mesaPrincipalId },
          mesas
        );
        if (grupoActual) {
          setGruposMesasManuales((prev) => upsertManualGroup(prev, grupoActual));
        }
      }
      scheduleMesasSyncRef.current({ delay: 1100, silencioso: true });
      toast.success(`${formatMesaLabel(mesa)} salió del grupo correctamente.`);
    } catch (err) {
      await refrescarMesas({ silencioso: true });
      toast.error(err?.response?.data?.message || 'No se pudo retirar la mesa del grupo.');
    } finally {
      setRemoviendoMesaGrupoId(null);
    }
  };

  const abrirCuentaGrupo = async (mesa) => {
    try {
      setCuentaGrupoLoading(true);
      setCuentaGrupoModal(mesa);
      setCuentaGrupoData(null);
      const { data } = await obtenerCuentaUnificada(mesa.id);
      setCuentaGrupoData(data?.data || data || null);
    } catch (err) {
      setCuentaGrupoModal(null);
      toast.error(err?.response?.data?.message || 'No se pudo cargar la cuenta unificada del grupo.');
    } finally {
      setCuentaGrupoLoading(false);
    }
  };

  if (cargando) {
    return (
      <div className="configuracion-page">
        <div className="configuracion-loading" />
        <div className="configuracion-loading" />
      </div>
    );
  }

  return (
    <div className="configuracion-page config-workspace" data-config-section={activeSection}>
      <section className="configuracion-hero">
        <div className="configuracion-hero-copy">
          <span className="configuracion-kicker">TU RESTAURANTE, EN ORDEN</span>
          <h1>Configura tu restaurante.</h1>
          <p>
            Tu identidad, tu carta y tu operación. Elige una sección y guarda los cambios cuando termines.
          </p>
        </div>

        <div className="configuracion-hero-stats">
          <div className="configuracion-stat-card">
            <span>Estado operativo</span>
            <strong>{estadoOperacionTexto}</strong>
          </div>
          <div className="configuracion-stat-card">
            <span>Idioma del menú</span>
            <strong>{config.idiomaMenu.toUpperCase()}</strong>
          </div>

        </div>
      </section>

      <nav className="config-section-nav" aria-label="Secciones de configuración">{configurationSections.filter(item => item.id !== 'sedes' || multisede?.multisede_habilitado).map(item => <button key={item.id} type="button" aria-pressed={activeSection === item.id} onClick={() => selectSection(item.id)}><span>{item.label}</span><small>{item.hint}</small></button>)}</nav>
      <div className="config-workspace-path"><span>{configurationSections.find(item => item.id === activeSection)?.hint}</span><button type="button" onClick={() => navigate('/productos?carga=rapida')}>Cargar productos con fotos <FiArrowRight size={16} /></button></div>
      {error && <div className="configuracion-feedback configuracion-feedback-error">{error}</div>}

      {multisede?.multisede_habilitado ? (
        <section className="config-panel config-multisede-panel" hidden={activeSection !== 'sedes'}>
          <div className="config-panel-head">
            <div>
              <span className="config-panel-kicker">Operacion multisede</span>
              <h2>Elige la sede que vas a gestionar</h2>
            </div>
            <p>Cada sede conserva su carta, mesas y pedidos. Confirma la sede seleccionada antes de editar.</p>
          </div>

          <div className="config-multisede-grid">
            {(multisede.sedes || []).map((sede) => {
              const esSedeActual = Number(sede.id) === Number(user?.restauranteId);
              const estaCambiando = Number(gestionandoSedeId) === Number(sede.id);

              return (
                <article
                  key={sede.id}
                  className={`config-multisede-card ${sede.es_principal ? 'is-main' : ''} ${esSedeActual ? 'is-active' : ''}`}
                >
                  <div>
                    <span>{sede.es_principal ? 'Sede principal' : 'Sede'}</span>
                    <strong>{sede.sede_nombre || sede.nombre}</strong>
                    <p>{sede.direccion || 'Dirección pendiente por configurar'}</p>
                  </div>
                  <div className="config-multisede-card__meta">
                    <span>{sede.estado}</span>
                    <span>{sede.estadoOperacion}</span>
                    <span>/{sede.slug}</span>
                  </div>
                  <button
                    type="button"
                    className={`config-multisede-action ${esSedeActual ? 'is-current' : ''}`}
                    onClick={() => gestionarSede(sede)}
                    disabled={esSedeActual || estaCambiando || Boolean(gestionandoSedeId)}
                  >
                    {esSedeActual ? (
                      <>
                        <FiCheckCircle size={16} />
                        Sede actual
                      </>
                    ) : (
                      <>
                        {estaCambiando ? 'Cambiando...' : 'Gestionar sede'}
                        <FiArrowRight size={16} />
                      </>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <form id="configuracion-form" className="configuracion-layout" onSubmit={manejarSubmit}>
        <div className="configuracion-main" hidden={! ['restaurante', 'menu'].includes(activeSection)}>
          <section className="config-panel config-panel-brand" hidden={activeSection !== 'restaurante'}>
            <div className="config-panel-head">
              <div>
                <span className="config-panel-kicker">Identidad del negocio</span>
                <h2>La información que verán tus clientes</h2>
              </div>
              <p>Completa los datos esenciales de tu restaurante.</p>
            </div>

            <div className="config-form-grid">
              <label className="config-field config-field-span-2">
                <span>Nombre del restaurante</span>
                <input name="nombre" value={config.nombre} onChange={manejarCambio} />
              </label>

              <label className="config-field config-field-span-2">
                <span>Descripción del restaurante</span>
                <textarea
                  name="descripcion"
                  value={config.descripcion}
                  onChange={manejarCambio}
                  placeholder="Cuenta en una frase que hace especial tu restaurante."
                />
              </label>

              <label className="config-field">
                <span>Teléfono</span>
                <input name="telefono" value={config.telefono} onChange={manejarCambio} />
              </label>

              <label className="config-field">
                <span>Dirección</span>
                <input name="direccion" value={config.direccion} onChange={manejarCambio} />
              </label>

              <label className="config-field">
                <span>Hora de apertura</span>
                <input
                  type="time"
                  name="horarioApertura"
                  value={config.horarioApertura}
                  onChange={manejarCambio}
                />
              </label>

              <label className="config-field">
                <span>Hora de cierre</span>
                <input
                  type="time"
                  name="horarioCierre"
                  value={config.horarioCierre}
                  onChange={manejarCambio}
                />
              </label>

              <label className="config-field">
                <span>Tiempo promedio de preparación</span>
                <input
                  type="number"
                  min="5"
                  max="120"
                  name="tiempoPreparacion"
                  value={config.tiempoPreparacion}
                  onChange={manejarCambio}
                />
              </label>

              <label className="config-field">
                <span>Mensaje de bienvenida</span>
                <input
                  name="mensajeBienvenida"
                  value={config.mensajeBienvenida}
                  onChange={manejarCambio}
                  placeholder="Bienvenidos, elige y ordena desde tu mesa."
                />
              </label>
            </div>
          </section>

          <section className="config-panel" hidden={activeSection !== 'menu'}>
            <div className="config-panel-head">
              <div>
                <span className="config-panel-kicker">Experiencia QR y menú</span>
                <h2>Dale tu estilo a la carta</h2>
              </div>
              <p>Elige los colores y el idioma de tu menú digital.</p>
            </div>

            <div className="config-form-grid">
              <label className="config-field">
                <span>Color principal QR</span>
                <div className="config-color-input">
                  <input
                    type="color"
                    name="colorTemaQR"
                    value={config.colorTemaQR}
                    onChange={manejarCambio}
                  />
                  <input name="colorTemaQR" value={config.colorTemaQR} onChange={manejarCambio} />
                </div>
              </label>

              <label className="config-field">
                <span>Color secundario</span>
                <div className="config-color-input">
                  <input
                    type="color"
                    name="colorSecundario"
                    value={config.colorSecundario}
                    onChange={manejarCambio}
                  />
                  <input
                    name="colorSecundario"
                    value={config.colorSecundario}
                    onChange={manejarCambio}
                  />
                </div>
              </label>

              <label className="config-field">
                <span>Idioma del menú</span>
                <select name="idiomaMenu" value={config.idiomaMenu} onChange={manejarCambio}>
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                </select>
              </label>

              <label className="config-field">
                <span>Tema visual</span>
                <select name="tema" value={config.tema} onChange={manejarCambio}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </label>
            </div>
          </section>

          <section className="config-panel config-panel-branding" hidden={activeSection !== 'restaurante'}>
            <div className="config-panel-head config-branding-head">
              <div>
                <span className="config-panel-kicker">Branding</span>
                <h2>Logo y portada</h2>
              </div>
              <p>
                Añade tu logo y una portada que represente tu restaurante.
              </p>
            </div>

            <div className="config-branding-layout">
              <div className="config-branding-media">
                <div className="config-branding-block">
                  <p className="config-branding-label">Logo del restaurante</p>
                  <LogoUploader
                    preview={logoPreview}
                    onChange={manejarLogo}
                    onRemove={manejarRemoverLogo}
                  />
                </div>

                <div className="config-branding-block">
                  <p className="config-branding-label">Portada del menú</p>
                  <PortadaUploader
                    preview={portadaPreview}
                    onChange={manejarPortada}
                    onRemove={manejarRemoverPortada}
                  />
                </div>
              </div>


            </div>
          </section>
        </div>

        <aside className="configuracion-side" hidden={! ['asistente', 'operacion'].includes(activeSection)}>
          {estadoIA && (
            <section className="config-panel config-panel-ia" hidden={activeSection !== 'asistente'}>
              <div className="config-panel-head">
                <div>
                  <span className="config-panel-kicker">Inteligencia artificial</span>
                  <h2>Tu asistente y su consumo</h2>
                </div>
                <p>Consulta la capacidad disponible antes de solicitar ayuda para organizar tu carta.</p>
              </div>

              <div className="config-ia-summary">
                <div className="config-ia-summary-card">
                  <span>Plan activo</span>
                  <strong>{estadoIA.planNombre || `Plan ${estadoIA.plan}`}</strong>
                </div>
                <div className="config-ia-summary-card">
                  <span>Presupuesto</span>
                  <strong>{monedaCOP.format(Number(estadoIA.presupuestoCOP || 0))}</strong>
                </div>
                <div className="config-ia-summary-card">
                  <span>Costo real</span>
                  <strong>{monedaCOP.format(Number(estadoIA.costoMesCOP || 0))}</strong>
                </div>
                <div className="config-ia-summary-card">
                  <span>Disponible</span>
                  <strong>{monedaCOP.format(Number(estadoIA.restanteCOP || 0))}</strong>
                </div>
              </div>

              <div className="config-ia-progress">
                <div className="config-ia-progress-track">
                  <div
                    className={`config-ia-progress-fill ${
                      Number(estadoIA.porcentajePresupuestoUSD || 0) >= 90
                        ? 'danger'
                        : Number(estadoIA.porcentajePresupuestoUSD || 0) >= 70
                          ? 'warn'
                          : ''
                    }`}
                    style={{ width: `${Math.min(100, Number(estadoIA.porcentajePresupuestoUSD || 0))}%` }}
                  />
                </div>
                <strong>{Math.min(100, Number(estadoIA.porcentajePresupuestoUSD || 0)).toFixed(1)}% del presupuesto mensual IA</strong>
              </div>

              <div className="config-ia-stats-grid">
                <div className="config-ia-mini">
                  <span>Ejecuciones</span>
                  <strong>{Number(estadoIA.ejecucionesMes || 0).toLocaleString('es-CO')}</strong>
                </div>
                <div className="config-ia-mini">
                  <span>Tokens</span>
                  <strong>{Number(estadoIA.tokensMes || 0).toLocaleString('es-CO')}</strong>
                </div>
                <div className="config-ia-mini">
                  <span>Ratio costo / plan</span>
                  <strong>{Number(estadoIA.ratioCostoPlan || 0).toFixed(2)}%</strong>
                </div>
                <div className="config-ia-mini">
                  <span>Estado actual</span>
                  <strong>{estadoIA.estado}</strong>
                </div>
              </div>

              <div className="config-ia-features">
                <span>Funciones habilitadas</span>
                <div className="config-ia-feature-cloud">
                  {(estadoIA.funcionesDisponibles || []).map((feature) => (
                    <span key={feature} className="config-ia-feature-pill">{featureLabels[feature] || 'Función adicional'}</span>
                  ))}
                  {!estadoIA.funcionesDisponibles?.length && (
                    <span className="config-ia-feature-pill muted">Sin funciones habilitadas</span>
                  )}
                </div>
              </div>
            </section>
          )}

          <section className="config-panel" hidden={activeSection !== 'operacion'}>
            <div className="config-panel-head">
              <div>
                <span className="config-panel-kicker">Funciones activas</span>
                <h2>Capacidades del restaurante</h2>
              </div>
              <p>Activa únicamente las opciones que necesita tu servicio.</p>
            </div>

            <label className="config-toggle-row">
              <div>
                <strong>Pedidos para llevar</strong>
                <span>Habilita pedidos fuera de salon.</span>
              </div>
              <input
                type="checkbox"
                name="permitirPedidosParaLlevar"
                checked={config.permitirPedidosParaLlevar}
                onChange={manejarCambio}
              />
            </label>

            <label className="config-toggle-row">
              <div>
                <strong>Propinas</strong>
                <span>Activa propina sugerida en la experiencia del cliente.</span>
              </div>
              <input
                type="checkbox"
                name="aceptaPropinas"
                checked={config.aceptaPropinas}
                onChange={manejarCambio}
              />
            </label>

            <label className="config-field">
              <span>Propina sugerida (%)</span>
              <input
                type="number"
                min="0"
                max="30"
                name="propinaSugerida"
                value={config.propinaSugerida}
                onChange={manejarCambio}
              />
            </label>

            <label className="config-toggle-row">
              <div>
                <strong>IA del restaurante</strong>
                <span>Activa capacidades inteligentes para este negocio.</span>
              </div>
              <input
                type="checkbox"
                name="activarIA"
                checked={config.activarIA}
                onChange={manejarCambio}
                disabled={!planAllowsAI}
              />
            </label>

            <label className="config-field">
              <span>Modo IA</span>
              <select name="modoIA" value={config.modoIA} onChange={manejarCambio} disabled={!planAllowsAI}>
                <option value="off">Off</option>
                <option value="pro">Pro</option>
              </select>
            </label>

            <label className="config-toggle-row">
              <div>
                <strong>Traduccion automatica</strong>
                <span>Prepara el menu para operacion bilingue.</span>
              </div>
              <input
                type="checkbox"
                name="traduccionAutomatica"
                checked={config.traduccionAutomatica}
                onChange={manejarCambio}
                disabled={!hasFeature('traducirMenu')}
              />
            </label>

            <label className="config-toggle-row">
              <div>
                <strong>Upsell y destacados</strong>
                <span>Activa recomendaciones comerciales en menu QR.</span>
              </div>
              <input
                type="checkbox"
                name="upsellActivo"
                checked={config.upsellActivo}
                onChange={manejarCambio}
                disabled={!hasFeature('sugerirCombos')}
              />
            </label>

            {!planAllowsAI && (
              <div className="configuracion-feedback">
                Las funciones de IA se habilitan solo para restaurantes con plan IA.
              </div>
            )}
          </section>
        </aside>

        <section className="config-panel config-share-panel" hidden={activeSection !== 'publicar'}><div className="config-panel-head"><div><span className="config-panel-kicker">COMPARTE TU CARTA</span><h2>Tu menú, a un escaneo.</h2></div><p>Abre el menú real, revisa los precios y prueba el QR antes de imprimirlo.</p></div>              <div className="config-branding-block config-branding-qr">
                <p className="config-branding-label">QR del restaurante</p>
                <QRCard
                  qrUrl={qrData.qrUrl}
                  menuUrl={qrData.menuUrl}
                  onDownload={descargarQR}
                  onOpen={abrirMenuPublico}
                  onCopy={copiarMenuUrl}
                />
              </div></section>
        <section className="config-panel config-panel-horizontal config-app-preview" hidden={activeSection !== 'publicar'}>
          <div className="config-panel-head config-panel-head-horizontal">
            <div>
              <span className="config-panel-kicker">App conectada</span>
              <h2>Así verán tu menú</h2>
            </div>
            <p>
              Revisa la experiencia real del cliente desde el panel admin y abre la app publica
              con un clic cuando necesites validarla completa.
            </p>
          </div>

          {qrData.menuUrl ? (
            <div className="config-app-preview-shell">
              <div className="config-app-preview-toolbar">
                <div className="config-app-preview-meta">
                  <span className="config-app-preview-dot" />
                  <strong>Menú público</strong>
                  <span>{qrData.menuUrl}</span>
                </div>

                <div className="config-logo-actions">
                  <button type="button" className="config-inline-btn" onClick={abrirMenuPublico}>
                    Abrir menú completo
                  </button>
                  <button type="button" className="config-inline-btn ghost" onClick={copiarMenuUrl}>
                    Copiar enlace
                  </button>
                </div>
              </div>

              <div className="config-app-preview-frame">
                <PublicMenuPreview
                  menuUrl={qrData.menuUrl}
                  colorPrincipal={config.colorTemaQR}
                  colorSecundario={config.colorSecundario}
                />
              </div>
            </div>
          ) : (
            <div className="config-qr-empty">
              <p>
                La app del restaurante se conectara automaticamente cuando el backend entregue la
                URL publica del menu.
              </p>
            </div>
          )}
        </section>
      </form>

      {/* ══════════════════════════════════════════════
          🍽️ GESTIÓN DE MESAS Y CÓDIGOS QR
      ══════════════════════════════════════════════ */}
      <section className="config-panel config-mesas-section" hidden={activeSection !== 'operacion'}>
        <div className="config-mesas-hero">
          <div className="config-panel-head config-mesas-head">
            <div>
              <span className="config-panel-kicker">Mesas y acceso QR</span>
              <h2>Gestión de mesas y códigos QR individuales</h2>
            </div>
            <p>
              Crea tus mesas, imprime el QR de cada una y colócalo en la mesa física. Cuando un
              cliente lo escanee, llegará al menú digital y su pedido llegará identificado con el
              número de mesa.
            </p>

            <div className="config-mesas-head__chips">
              <span>Lectura operativa en tiempo real</span>
              <span>QR individual por mesa</span>
              <span>Corrección manual controlada</span>
            </div>
          </div>

          <div className="config-mesas-overview">
            <article className="config-mesas-overview-card">
              <span>Mesas creadas</span>
              <strong>{resumenMesas.total}</strong>
              <small>Base actual del salón</small>
            </article>
            <article className="config-mesas-overview-card">
              <span>Disponibles</span>
              <strong>{resumenMesas.disponibles}</strong>
              <small>Listas para recibir clientes</small>
            </article>
            <article className="config-mesas-overview-card">
              <span>Ocupadas</span>
              <strong>{resumenMesas.ocupadas}</strong>
              <small>Con bloqueo operativo o servicio activo</small>
            </article>
            <article className="config-mesas-overview-card">
              <span>Capacidad total</span>
              <strong>{resumenMesas.capacidadTotal}</strong>
              <small>Sillas o cupos configurados</small>
            </article>
          </div>
        </div>

        {/* Formulario crear / editar mesa */}
        <form ref={mesaFormRef} className="config-mesa-form" onSubmit={guardarMesa}>
          <div className="config-mesa-form__intro">
            <span className="config-mesa-form__eyebrow">
              {mesaEditando ? 'Edición controlada' : 'Alta rápida de mesas'}
            </span>
            <strong>
              {mesaEditando ? `Actualizando mesa ${mesaForm.numero || ''}`.trim() : 'Crea una nueva mesa en segundos'}
            </strong>
            <p>
              Define número, alias operativo y capacidad. El panel usa esta base para QR, pedidos
              identificados y lectura del salón.
            </p>

            <div className="config-mesa-form__tips">
              <span>Número único</span>
              <span>Alias opcional por zona</span>
              <span>Capacidad para lectura comercial</span>
            </div>
          </div>

          <div className="config-mesa-form__body">
            <div className="config-mesa-form__fields">
              <label className="config-field">
                <span>Número de mesa *</span>
                <input
                  type="number"
                  min="1"
                  placeholder="Ej: 1"
                  value={mesaForm.numero}
                  onChange={(e) => setMesaForm((p) => ({ ...p, numero: e.target.value }))}
                  disabled={mesaGuardando}
                />
              </label>
              <label className="config-field">
                <span>Nombre (opcional)</span>
                <input
                  type="text"
                  placeholder="Ej: Terraza, VIP..."
                  maxLength={80}
                  value={mesaForm.nombre}
                  onChange={(e) => setMesaForm((p) => ({ ...p, nombre: e.target.value }))}
                  disabled={mesaGuardando}
                />
              </label>
              <label className="config-field">
                <span>Capacidad</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={mesaForm.capacidad}
                  onChange={(e) => setMesaForm((p) => ({ ...p, capacidad: e.target.value }))}
                  disabled={mesaGuardando}
                />
              </label>
            </div>

            {mesaError && <p className="config-mesa-form__error">{mesaError}</p>}

            <div className="config-mesa-form__actions">
              <button type="submit" className="config-mesa-btn config-mesa-btn--primary" disabled={mesaGuardando}>
                {mesaGuardando ? 'Guardando…' : mesaEditando ? 'Actualizar mesa' : '+ Agregar mesa'}
              </button>
              {mesaEditando && (
                <button type="button" className="config-mesa-btn config-mesa-btn--ghost" onClick={cancelarEdicion}>
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Lista de mesas */}
        {mesas.length === 0 ? (
          <div className="config-mesas-empty">
            <span>🍽️</span>
            <p>Aún no tienes mesas configuradas. Agrega la primera para generar su QR.</p>
          </div>
        ) : (
          <>
            <div className="config-mesas-toolbar">
              <div className="config-mesas-toolbar__copy">
                <strong>Estado operativo de mesas</strong>
                <span>La vista se sincroniza con pedidos activos reales. Si una mesa ya quedó libre, puedes marcarla disponible aquí; si está disponible y necesitas bloquearla, puedes marcarla ocupada desde esta misma configuración.</span>
              </div>
              <div className="config-mesas-toolbar__actions">
                <span className={`config-mesas-sync-pill ${sincronizandoMesas ? 'is-syncing' : ''}`}>
                  {sincronizandoMesas ? 'Sincronizando en vivo' : 'Sincronizado con pedidos'}
                </span>
                <button
                  type="button"
                  className="config-mesa-btn config-mesa-btn--ghost"
                  onClick={() => refrescarMesas()}
                  disabled={sincronizandoMesas}
                >
                  {sincronizandoMesas ? 'Sincronizando...' : 'Sincronizar mesas'}
                </button>
              </div>
            </div>

            <div className="config-mesas-group-shell">
              <div className="config-mesas-group-builder">
                <div className="config-mesas-group-builder__copy">
                  <span className="config-panel-kicker">Cuenta unificada para grupos</span>
                  <h3>Une mesas sin romper la operación</h3>
                  <p>
                    Cuando llega un grupo grande, define una mesa principal y suma las demás a esa
                    cuenta. Los pedidos activos de las mesas secundarias pasan a la principal para
                    que caja, cocina y QR lean una sola cuenta.
                  </p>
                </div>

                <div className="config-mesas-group-stats">
                  <article className="config-mesas-group-stat">
                    <span>Grupos activos</span>
                    <strong>{resumenGrupos.totalGrupos}</strong>
                  </article>
                  <article className="config-mesas-group-stat">
                    <span>Mesas agrupadas</span>
                    <strong>{resumenGrupos.mesasAgrupadas}</strong>
                  </article>
                  <article className="config-mesas-group-stat">
                    <span>Capacidad agrupada</span>
                    <strong>{resumenGrupos.capacidadAgrupada} pax</strong>
                  </article>
                </div>

                <div className="config-mesas-group-insights">
                  <article className="config-mesas-group-insight">
                    <span>Listas para agrupar</span>
                    <strong>{mesasElegiblesParaGrupo.length}</strong>
                    <small>Mesas operativas y sin vínculo con otros grupos.</small>
                  </article>
                  <article className="config-mesas-group-insight">
                    <span>Mesas ya vinculadas</span>
                    <strong>{mesasAgrupadasIds.size}</strong>
                    <small>Se gestionan abajo para separar o retirar con claridad.</small>
                  </article>
                  <article className={`config-mesas-group-insight ${resumenGrupos.gruposInconsistentes ? 'is-warning' : ''}`}>
                    <span>Referencias a revisar</span>
                    <strong>{resumenGrupos.gruposInconsistentes}</strong>
                    <small>Mesas que siguen apuntando a un grupo y requieren revisión visual.</small>
                  </article>
                </div>

                <div className="config-mesas-group-selector">
                  {mesasElegiblesParaGrupo.length >= 2 ? (
                    <>
                      <div className="config-mesas-group-pills">
                        {mesasElegiblesParaGrupo.map((mesa) => {
                          const seleccionada = mesasGrupoSeleccionadas.has(mesa.id);
                          return (
                            <button
                              key={mesa.id}
                              type="button"
                              className={`config-mesas-group-pill ${seleccionada ? 'is-selected' : ''}`}
                              onClick={() => toggleMesaGrupoSeleccionada(mesa.id)}
                              disabled={guardandoGrupoMesas}
                            >
                              <span>{formatMesaLabel(mesa)}</span>
                              <small>{mesa.capacidad || 0} pax · {String(mesa.estado || 'disponible')}</small>
                            </button>
                          );
                        })}
                      </div>

                      <div className="config-mesas-group-footer">
                        <label className="config-field">
                          <span>Mesa principal del grupo</span>
                          <select
                            value={mesaPrincipalGrupoId}
                            onChange={(e) => setMesaPrincipalGrupoId(e.target.value)}
                            disabled={mesasGrupoSeleccionadas.size < 2 || guardandoGrupoMesas}
                          >
                            <option value="">Selecciona la mesa principal</option>
                            {[...mesasGrupoSeleccionadas].map((mesaId) => {
                              const mesa = mesas.find((item) => item.id === mesaId);
                              return (
                                <option key={mesaId} value={mesaId}>
                                  {formatMesaLabel(mesa)}
                                </option>
                              );
                            })}
                          </select>
                        </label>

                        <div className="config-mesas-group-actions">
                          <button
                            type="button"
                            className="config-mesa-btn config-mesa-btn--ghost"
                            onClick={limpiarConstructorGrupo}
                            disabled={guardandoGrupoMesas || mesasGrupoSeleccionadas.size === 0}
                          >
                            Limpiar selección
                          </button>
                          <button
                            type="button"
                            className="config-mesa-btn config-mesa-btn--primary"
                            onClick={confirmarGrupoMesas}
                            disabled={guardandoGrupoMesas || mesasGrupoSeleccionadas.size < 2 || !mesaPrincipalGrupoId}
                          >
                            {guardandoGrupoMesas ? 'Uniendo...' : 'Crear grupo y unificar cuenta'}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="config-mesas-group-empty">
                      Necesitas al menos dos mesas operativas y fuera de grupos para crear una unión.
                    </div>
                  )}
                </div>
              </div>

              <div className="config-mesas-group-list">
                <div className="config-mesas-group-list__head">
                  <div>
                    <span className="config-panel-kicker">Mapa operativo de grupos</span>
                    <h3>Qué mesas están agrupadas y dónde</h3>
                  </div>
                  <p>Desde aquí auditas la capacidad total, revisas la cuenta consolidada y separas solo cuando ya no haya tickets activos.</p>
                </div>

                {gruposMesas.length === 0 && !grupoPreview ? (
                  <div className="config-mesas-group-empty">
                    No hay grupos activos en este momento. Cuando unas mesas, aparecerán aquí.
                  </div>
                ) : (
                  <div className="config-mesas-group-cards">
                    {grupoPreview ? (
                      <article key={grupoPreview.id} className="config-mesas-group-card config-mesas-group-card--preview">
                        <div className="config-mesas-group-card__head">
                          <div>
                            <span className="config-panel-kicker">Grupo en preparación</span>
                            <strong>{grupoPreview.grupoLabel}</strong>
                          </div>
                          <span className="config-mesas-group-badge is-preview">Pendiente de activar</span>
                        </div>

                        <div className="config-mesas-group-card__meta">
                          <div>
                            <span>Mesa principal</span>
                            <strong>{grupoPreview.mesaPrincipalLabel}</strong>
                          </div>
                          <div>
                            <span>Mesas del grupo</span>
                            <strong>{grupoPreview.totalMesasGrupo}</strong>
                          </div>
                          <div>
                            <span>Capacidad total</span>
                            <strong>{Number(grupoPreview.capacidadGrupo || 0)} pax</strong>
                          </div>
                          <div>
                            <span>Pedidos abiertos</span>
                            <strong>{Number(grupoPreview.pedidosActivosGrupo || 0)}</strong>
                          </div>
                        </div>

                        <div className="config-mesas-group-card__chips">
                          {(grupoPreview.grupoMesas || []).map((mesa) => (
                            <span key={`preview-chip-${mesa.id}`}>
                              Mesa {mesa.numero}{mesa.nombre ? ` · ${mesa.nombre}` : ''}
                            </span>
                          ))}
                        </div>

                        <div className="config-mesas-group-alert config-mesas-group-alert--preview">
                          Este grupo ya está armado en pantalla. Puedes activarlo ahora o desactivarlo para dividir de nuevo las mesas antes de consolidar la cuenta.
                        </div>

                        <div className="config-mesas-group-members">
                          {(grupoPreview.grupoMesas || []).map((mesa) => (
                            <div key={`preview-member-${mesa.id}`} className="config-mesas-group-member">
                              <div className="config-mesas-group-member__copy">
                                <strong>{formatMesaLabel(mesa)}</strong>
                                <span>
                                  {mesa.esPrincipal
                                    ? 'Mesa principal propuesta para recibir la cuenta unificada.'
                                    : `Mesa lista para integrarse a la cuenta de Mesa ${grupoPreview.mesaCuentaNumero}.`}
                                </span>
                              </div>

                              <div className="config-mesas-group-member__meta">
                                <span className={`config-mesas-group-member__role ${mesa.esPrincipal ? 'is-primary' : ''}`}>
                                  {mesa.esPrincipal ? 'Principal' : 'Integrada'}
                                </span>
                                <span>{mesa.capacidad || 0} pax</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="config-mesas-group-card__actions">
                          <button
                            type="button"
                            className="config-mesa-btn config-mesa-btn--ghost"
                            onClick={limpiarConstructorGrupo}
                            disabled={guardandoGrupoMesas}
                          >
                            Desactivar grupo
                          </button>
                          <button
                            type="button"
                            className="config-mesa-btn config-mesa-btn--primary"
                            onClick={confirmarGrupoMesas}
                            disabled={guardandoGrupoMesas || !mesaPrincipalGrupoId}
                          >
                            {guardandoGrupoMesas ? 'Activando...' : 'Activar grupo'}
                          </button>
                        </div>
                      </article>
                    ) : null}

                    {gruposMesas.map((grupo) => (
                      <article key={`grupo-${grupo.mesaCuentaId}`} className="config-mesas-group-card">
                        <div className="config-mesas-group-card__head">
                          <div>
                            <span className="config-panel-kicker">
                              {grupo.grupoInconsistente ? 'Referencia pendiente' : `Mesa principal ${grupo.mesaCuentaNumero}`}
                            </span>
                            <strong>{grupo.grupoLabel || `Mesa ${grupo.numero}`}</strong>
                          </div>
                          <span className={`config-mesas-group-badge ${grupo.grupoInconsistente ? 'is-warning' : ''}`}>
                            {grupo.grupoInconsistente ? 'Requiere revisión' : 'Cuenta unificada'}
                          </span>
                        </div>

                        <div className="config-mesas-group-card__meta">
                          <div>
                            <span>Mesa principal</span>
                            <strong>{grupo.mesaPrincipalLabel || `Mesa ${grupo.mesaCuentaNumero || grupo.numero}`}</strong>
                          </div>
                          <div>
                            <span>Mesas del grupo</span>
                            <strong>{grupo.totalMesasGrupo || grupo.grupoMesas?.length || 0}</strong>
                          </div>
                          <div>
                            <span>Capacidad total</span>
                            <strong>{Number(grupo.capacidadGrupo || 0)} pax</strong>
                          </div>
                          <div>
                            <span>Pedidos abiertos</span>
                            <strong>{Number(grupo.pedidosActivosGrupo || 0)}</strong>
                          </div>
                        </div>

                        <div className="config-mesas-group-card__chips">
                          {(grupo.grupoMesas || []).map((mesa) => (
                            <span key={mesa.id}>
                              Mesa {mesa.numero}{mesa.nombre ? ` · ${mesa.nombre}` : ''}
                            </span>
                          ))}
                        </div>

                        {grupo.grupoInconsistente ? (
                          <div className="config-mesas-group-alert">
                            Hay mesas apuntando a una principal que no se ve completa en la lectura actual. Puedes retirar mesas secundarias o resincronizar para normalizar la vista.
                          </div>
                        ) : null}

                        {Number(grupo.pedidosActivosGrupo || 0) > 0 ? (
                          <div className="config-mesas-group-alert">
                            La cuenta unificada sigue activa con {Number(grupo.pedidosActivosGrupo || 0)} pedido(s) abierto(s). Primero cierra la cuenta y luego podrás retirar mesas o eliminar el grupo sin romper la operación.
                          </div>
                        ) : null}

                        <div className="config-mesas-group-members">
                          {(grupo.grupoMesas || []).map((mesa) => {
                            const esPrincipal = Boolean(mesa.esPrincipal || Number(mesa.id) === Number(grupo.mesaPrincipalId));
                            return (
                              <div key={`member-${mesa.id}`} className="config-mesas-group-member">
                                <div className="config-mesas-group-member__copy">
                                  <strong>{formatMesaLabel(mesa)}</strong>
                                  <span>
                                    {esPrincipal
                                      ? 'Mesa principal. La cuenta consolidada y los pedidos del grupo viven aquí.'
                                      : `Mesa integrada al grupo. Sus nuevos pedidos se suman a Mesa ${grupo.mesaCuentaNumero}.`}
                                  </span>
                                </div>

                                <div className="config-mesas-group-member__meta">
                                  <span className={`config-mesas-group-member__role ${esPrincipal ? 'is-primary' : ''}`}>
                                    {esPrincipal ? 'Principal' : 'Integrada'}
                                  </span>
                                  <span>{mesa.capacidad || 0} pax</span>
                                  {!esPrincipal ? (
                                    <button
                                      type="button"
                                      className="config-mesa-btn config-mesa-btn--ghost config-mesa-btn--sm"
                                      onClick={() => quitarMesaSecundariaDeGrupo(mesa, grupo)}
                                      disabled={removiendoMesaGrupoId === Number(mesa.id) || Number(grupo.pedidosActivosGrupo || 0) > 0}
                                      title={
                                        Number(grupo.pedidosActivosGrupo || 0) > 0
                                          ? 'Cierra la cuenta unificada antes de retirar una mesa.'
                                          : 'Retirar esta mesa del grupo'
                                      }
                                    >
                                      {removiendoMesaGrupoId === Number(mesa.id) ? 'Retirando...' : 'Quitar del grupo'}
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="config-mesas-group-card__actions">
                          <button
                            type="button"
                            className="config-mesa-btn config-mesa-btn--ghost"
                            onClick={() => abrirCuentaGrupo(grupo)}
                          >
                            Ver cuenta unificada
                          </button>
                          <button
                            type="button"
                            className="config-mesa-btn config-mesa-btn--warning"
                            onClick={() => separarGrupoMesas(grupo)}
                            disabled={
                              separandoGrupoId === Number(grupo.mesaPrincipalId || grupo.id) ||
                              Number(grupo.pedidosActivosGrupo || 0) > 0
                            }
                            title={
                              Number(grupo.pedidosActivosGrupo || 0) > 0
                                ? 'Cierra la cuenta unificada antes de eliminar el grupo.'
                                : 'Separar mesas y disolver el grupo'
                            }
                          >
                            {separandoGrupoId === Number(grupo.mesaPrincipalId || grupo.id)
                              ? 'Separando...'
                              : Number(grupo.pedidosActivosGrupo || 0) > 0
                                ? 'Cuenta activa'
                                : 'Eliminar grupo'}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="config-mesas-grid">
            {mesas.map((mesa) => {
              const qr = mesasQR[mesa.id];
              const qrLoading = mesasQRLoading[mesa.id];
              const estadoMesa = String(mesa.estado || 'disponible');
              const estadoMesaLabel = estadoMesa.charAt(0).toUpperCase() + estadoMesa.slice(1);
              const pedidosActivosMesa = Number(mesa.pedidosActivos || 0);
              const grupoActualMesa = grupoPorMesaId.get(Number(mesa.id)) || null;
              const mesaEnGrupo = Boolean(grupoActualMesa);
              const puedeCorregirEstado = pedidosActivosMesa === 0;
              const mostrarLiberar = !mesaEnGrupo && estadoMesa === 'ocupada' && puedeCorregirEstado;
              const mostrarOcupar = !mesaEnGrupo && estadoMesa === 'disponible' && puedeCorregirEstado;
              const esMesaPrincipalGrupo = Boolean(
                grupoActualMesa && Number(grupoActualMesa.mesaPrincipalId || grupoActualMesa.mesaCuentaId) === Number(mesa.id)
              );
              const esMesaSecundariaGrupo = Boolean(grupoActualMesa && !esMesaPrincipalGrupo);
              const estadoMesaResumen =
                esMesaPrincipalGrupo
                  ? `Mesa principal del grupo ${mesa.grupoLabel || `Mesa ${mesa.numero}`}. Toda la cuenta consolidada se opera desde aquí.`
                  : esMesaSecundariaGrupo
                    ? `Mesa integrada a la cuenta de Mesa ${mesa.mesaCuentaNumero || mesa.mesaGrupoId}. Los pedidos nuevos se suman a esa cuenta principal.`
                    : estadoMesa === 'ocupada'
                  ? pedidosActivosMesa > 0
                    ? 'Mesa tomada por pedidos activos; el cambio manual se habilita cuando quede sin tickets.'
                    : 'Mesa ocupada sin tickets activos; puedes marcarla disponible si el salón ya quedó libre.'
                  : 'Mesa disponible para recibir clientes. Si deseas bloquearla manualmente, márcala como ocupada.';
              const estadoMesaResumenFinal =
                esMesaPrincipalGrupo
                  ? `Mesa principal del grupo ${grupoActualMesa?.grupoLabel || `Mesa ${mesa.numero}`}. Toda la cuenta consolidada se opera desde aquí.`
                  : esMesaSecundariaGrupo
                    ? `Mesa integrada a ${grupoActualMesa?.grupoLabel || `Mesa ${grupoActualMesa?.mesaCuentaNumero || mesa.mesaGrupoId}`}. Los pedidos nuevos se suman a la cuenta principal.`
                    : estadoMesaResumen;
              return (
                <div key={mesa.id} className="config-mesa-card">
                  <div className="config-mesa-card__header">
                    <div>
                      <span className="config-mesa-card__eyebrow">Mesa activa</span>
                      <span className="config-mesa-card__num">Mesa {mesa.numero}</span>
                      {mesa.nombre && <span className="config-mesa-card__name">{mesa.nombre}</span>}
                    </div>
                    <span className={`config-mesa-card__estado config-mesa-card__estado--${estadoMesa}`}>
                      {estadoMesaLabel}
                    </span>
                  </div>

                  <div className="config-mesa-card__meta-grid">
                    <div className="config-mesa-card__meta-item">
                      <span>Capacidad</span>
                      <strong>{mesa.capacidad} pax</strong>
                    </div>
                    <div className="config-mesa-card__meta-item">
                      <span>Pedidos abiertos</span>
                      <strong>{pedidosActivosMesa > 0 ? pedidosActivosMesa : '0'}</strong>
                    </div>
                  </div>

                  <div className="config-mesa-card__status-copy">
                    <strong>Estado actual: {estadoMesaLabel}</strong>
                    <span>{estadoMesaResumenFinal}</span>
                    {grupoActualMesa && Array.isArray(grupoActualMesa.grupoMesas) && grupoActualMesa.grupoMesas.length > 1 ? (
                      <span>
                        Grupo activo: {grupoActualMesa.grupoMesas.map((item) => `Mesa ${item.numero}`).join(' · ')}
                      </span>
                    ) : null}
                  </div>

                  {/* QR inline */}
                  <div className="config-mesa-card__qr">
                    <div className="config-mesa-card__qr-head">
                      <span>Acceso QR</span>
                      <small>{qr ? 'Listo para imprimir' : 'Disponible bajo demanda'}</small>
                    </div>
                    {qr ? (
                      <>
                        <img src={qr.qrBase64} alt={`QR Mesa ${mesa.numero}`} />
                        <span className="config-mesa-card__qr-url" title={qr.qrUrl}>{qr.qrUrl}</span>
                      </>
                    ) : (
                      <button
                        className="config-mesa-btn config-mesa-btn--qr"
                        onClick={() => cargarQRMesa(mesa.id)}
                        disabled={qrLoading}
                      >
                        {qrLoading ? 'Generando…' : '🔳 Ver QR'}
                      </button>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="config-mesa-card__actions">
                    <div className="config-mesa-card__actions-primary">
                      {mostrarLiberar && (
                        <button
                          className="config-mesa-btn config-mesa-btn--sm config-mesa-btn--success"
                          onClick={() => marcarMesaDisponible(mesa)}
                          disabled={mesaEstadoActualizandoId === mesa.id}
                        >
                          {mesaEstadoActualizandoId === mesa.id ? 'Actualizando...' : 'Marcar disponible'}
                        </button>
                      )}
                      {mostrarOcupar && (
                        <button
                          className="config-mesa-btn config-mesa-btn--sm config-mesa-btn--warning"
                          onClick={() => marcarMesaOcupada(mesa)}
                          disabled={mesaEstadoActualizandoId === mesa.id}
                        >
                          {mesaEstadoActualizandoId === mesa.id ? 'Actualizando...' : 'Marcar ocupada'}
                        </button>
                      )}
                    </div>

                    <div className="config-mesa-card__actions-secondary">
                      <button
                        className="config-mesa-btn config-mesa-btn--sm"
                        onClick={() => descargarPDF(mesa.id, mesa.numero)}
                        title="Descargar PDF con QR para imprimir"
                      >
                        PDF
                      </button>
                      <button
                        className="config-mesa-btn config-mesa-btn--sm config-mesa-btn--edit"
                        onClick={() => iniciarEdicion(mesa)}
                      >
                        Editar
                      </button>
                      <button
                        className="config-mesa-btn config-mesa-btn--sm config-mesa-btn--danger"
                        onClick={() => borrarMesa(mesa.id, mesa.numero)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </>
        )}
      </section>

      {cuentaGrupoModal && (
        <div
          className="config-mesas-modal-overlay"
          onClick={() => {
            setCuentaGrupoModal(null);
            setCuentaGrupoData(null);
          }}
        >
          <div className="config-mesas-modal" onClick={(e) => e.stopPropagation()}>
            <div className="config-mesas-modal__head">
              <div>
                <span className="config-panel-kicker">Cuenta consolidada</span>
                <h3>{cuentaGrupoModal.grupoLabel || `Mesa ${cuentaGrupoModal.numero}`}</h3>
              </div>
              <button
                type="button"
                className="config-mesa-btn config-mesa-btn--ghost"
                onClick={() => {
                  setCuentaGrupoModal(null);
                  setCuentaGrupoData(null);
                }}
              >
                Cerrar
              </button>
            </div>

            {cuentaGrupoLoading ? (
              <div className="config-mesas-modal__empty">Cargando cuenta unificada...</div>
            ) : cuentaGrupoData ? (
              <>
                <div className="config-mesas-modal__summary">
                  <div>
                    <span>Pedidos activos</span>
                    <strong>{cuentaGrupoData.resumen?.totalPedidos || 0}</strong>
                  </div>
                  <div>
                    <span>Total grupo</span>
                    <strong>{monedaCOP.format(Number(cuentaGrupoData.resumen?.total || 0))}</strong>
                  </div>
                  <div>
                    <span>Pagado</span>
                    <strong>{monedaCOP.format(Number(cuentaGrupoData.resumen?.totalPagado || 0))}</strong>
                  </div>
                  <div>
                    <span>Saldo pendiente</span>
                    <strong>{monedaCOP.format(Number(cuentaGrupoData.resumen?.pendientePago || 0))}</strong>
                  </div>
                </div>

                <div className="config-mesas-modal__chips">
                  {(cuentaGrupoData.mesas || []).map((mesa) => (
                    <span key={mesa.id}>
                      Mesa {mesa.numero}{mesa.nombre ? ` · ${mesa.nombre}` : ''}
                    </span>
                  ))}
                </div>

                <div className="config-mesas-modal__orders">
                  {(cuentaGrupoData.pedidos || []).length === 0 ? (
                    <div className="config-mesas-modal__empty">
                      No hay pedidos activos en este grupo.
                    </div>
                  ) : (
                    cuentaGrupoData.pedidos.map((pedido) => (
                      <article key={pedido.id} className="config-mesas-modal__order">
                        <div className="config-mesas-modal__order-head">
                          <span>Mesa {pedido.mesa?.numero} · Pedido #{pedido.numero || pedido.id}</span>
                          <strong>{monedaCOP.format(Number(pedido.total || 0))}</strong>
                        </div>
                        <ul>
                          {(pedido.items || []).map((item) => (
                            <li key={item.id}>
                              <span>{item.cantidad}x {item.nombreProducto}</span>
                              <span>{monedaCOP.format(Number(item.subtotal || item.totalItem || 0))}</span>
                            </li>
                          ))}
                        </ul>
                      </article>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="config-mesas-modal__empty">No se pudo leer la cuenta unificada.</div>
            )}
          </div>
        </div>
      )}

      <div className="configuracion-footer" hidden={activeSection === 'sedes'}><p>Guarda aquí los cambios de los formularios. Las acciones de mesas se aplican por separado.</p>
        <button
          type="submit"
          form="configuracion-form"
          className="configuracion-save"
          disabled={guardando}
        >
          {guardando ? 'Guardando cambios…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
