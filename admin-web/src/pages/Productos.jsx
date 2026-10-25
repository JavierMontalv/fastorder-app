import ProductIntake from '../components/ProductIntake';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  obtenerProductos
} from '../api/productosApi';
import { getDecisionHub } from '../api/dashboardApi';
import {
  generarPropuestaCatalogo,
  obtenerUltimaPropuestaCatalogo
} from '../api/iaApi';
import {
  actualizarCategoriaAdmin,
  crearCategoriaAdmin,
  obtenerCategoriasAdmin
} from '../services/categoriasService';
import { obtenerItemsInventario } from '../services/inventarioService';
import {
  cambiarEstadoPromocion,
  crearPromocion,
  obtenerPromociones
} from '../services/promocionesService';
import { useIAContext } from '../context/IAContext';
import { usePlanContext } from '../context/PlanContext';

import CategoriaQuickCreate from '../components/CategoriaQuickCreate';
import ModalProducto from '../components/ModalProducto';
import TarjetaProducto from '../components/TarjetaProducto';
import { MENU_STARTER_PACK } from '../constants/menuStarterPack';

import '../styles/Dashboard.css';
import '../styles/Productos.css';
import '../styles/ProductosWorkspace.css';

function normalizeText(value = '') {
  return String(value).trim().toLowerCase();
}

const PRODUCTOS_QUERY_BASE = {
  page: 1,
  limit: 100,
  orderBy: 'nombre',
  orderDirection: 'ASC'
};
const MAX_PRODUCTOS_PAGES = 100;

async function obtenerCatalogoCompletoProductos() {
  const limit = PRODUCTOS_QUERY_BASE.limit;
  let page = 1;
  let pages = 1;
  const items = [];
  const ids = new Set();

  while (page <= pages && page <= MAX_PRODUCTOS_PAGES) {
    const res = await obtenerProductos({
      ...PRODUCTOS_QUERY_BASE,
      page
    });

    const data = res?.data?.data || {};
    const chunk = Array.isArray(data.items) ? data.items : [];
    chunk.forEach((producto) => {
      const key = String(producto?.id ?? `page-${page}-${items.length}`);
      if (!ids.has(key)) {
        ids.add(key);
        items.push(producto);
      }
    });

    const totalPages = Number(data.pages);
    pages = Number.isInteger(totalPages) && totalPages > 0
      ? totalPages
      : chunk.length === limit
        ? page + 1
        : page;

    if (chunk.length === 0) break;
    page += 1;
  }

  return items;
}

const STOCK_RISK_STATES = new Set(['bajo', 'critico', 'agotado']);
const IA_PROPOSAL_OBJECTIVES = [
  {
    id: 'mixto',
    label: 'Carta + promocion',
    description: 'Arma apartados y deja una promo lista para empujar ventas.'
  },
  {
    id: 'menu',
    label: 'Solo carta',
    description: 'Organiza categorias y productos base para publicar rapido.'
  },
  {
    id: 'promocion',
    label: 'Solo promocion',
    description: 'Propone promos con gancho sin rehacer toda la carta.'
  }
];

const IA_STUDIO_STYLES = [
  'rentable y claro',
  'casual y antojable',
  'premium pero cercano',
  'rapido para delivery',
  'familiar y abundante'
];

const IA_GUIDE_TEMPLATES = [
  {
    id: 'burger-ticket',
    title: 'Subir ticket en hamburguesas',
    summary: 'Carta base con combos y una promo lista para delivery.',
    brief: 'Quiero vender hamburguesas premium, sumar combos de almuerzo y dejar una promo fuerte para delivery.',
    proposalKind: 'mixto',
    style: 'rentable y claro',
    constraints: 'Ticket medio entre 22k y 35k. Prioridad en delivery y productos faciles de producir.'
  },
  {
    id: 'bebidas-margen',
    title: 'Empujar bebidas rentables',
    summary: 'Prioriza bebidas, acompaniamientos y ticket promedio.',
    brief: 'Quiero vender mas bebidas frias y acompanamientos para aumentar el ticket de cada pedido.',
    proposalKind: 'menu',
    style: 'casual y antojable',
    constraints: 'Mantener preparacion rapida y margen alto.'
  },
  {
    id: 'postres-promo',
    title: 'Promo de postres',
    summary: 'Crea una promocion concreta sin rehacer toda la carta.',
    brief: 'Necesito una promo clara para postres que funcione despues del almuerzo y en pedidos nocturnos.',
    proposalKind: 'promocion',
    style: 'premium pero cercano',
    constraints: 'Sin descuentos agresivos. Priorizar valor percibido y recompra.'
  }
];

const IA_GUIDE_PROCESS = [
  {
    step: '1',
    title: 'Tu defines el objetivo',
    description: 'Escribes que producto, categoria o venta quieres mover.'
  },
  {
    step: '2',
    title: 'La IA arma la propuesta',
    description: 'Interpreta el brief y devuelve una carta o promo lista para revisar.'
  },
  {
    step: '3',
    title: 'Tu apruebas lo util',
    description: 'Nada se publica solo. Seleccionas y aplicas unicamente lo que te sirve.'
  }
];

const IA_GUIDE_DELIVERABLES = [
  {
    title: 'Lectura comercial',
    description: 'Explica como interpreto el negocio y por que sugiere ese enfoque.'
  },
  {
    title: 'Apartados y productos',
    description: 'Propone estructura de carta, nombres, descripciones y precios base.'
  },
  {
    title: 'Promociones en borrador',
    description: 'Sugiere promos listas para revisar sin publicarlas automaticamente.'
  }
];

function normalizeGuidePrefill(prefill = {}) {
  const nextStyle = IA_STUDIO_STYLES.includes(prefill.style)
    ? prefill.style
    : IA_STUDIO_STYLES[0];

  return {
    brief: String(prefill.brief || '').trim(),
    proposalKind: prefill.proposalKind || 'mixto',
    style: nextStyle,
    constraints: String(prefill.constraints || '').trim()
  };
}

function formatDateTime(value) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function toggleSelection(list, id) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function obtenerEstadoStock(producto) {
  if (!producto) return 'sin_control';
  if (producto.disponible === false) return 'agotado';
  return producto.estadoStock || 'sin_control';
}

function obtenerEtiquetaStock(producto) {
  const estado = obtenerEstadoStock(producto);

  if (estado === 'sin_control') return 'Libre';
  if (estado === 'ok') return 'Saludable';
  if (estado === 'bajo') return 'Bajo';
  if (estado === 'critico') return 'Critico';
  if (estado === 'agotado') return 'Agotado';

  return estado;
}

function obtenerResumenStock(producto) {
  if (!producto) return 'Sin lectura operativa de stock.';

  if (producto.stockFuente === 'inventario') {
    return `${producto.inventarioItemNombre || 'Inventario'} · ${producto.stockActual ?? 0} disponibles`;
  }

  if (producto.stockFuente === 'producto') {
    return `${producto.stockActual ?? 0} disponibles · minimo ${producto.stockMinimo ?? 0}`;
  }

  return producto.estado === 'activo'
    ? 'Disponible sin bloqueo por stock.'
    : 'Producto fuera de carta.';
}

function obtenerSiguientePasoCategoria(categoria) {
  if (!categoria) return 'Revisa tu carta y define el siguiente ajuste operativo.';
  if (categoria.stockAgotado > 0) return 'Repone o pausa los agotados para no vender productos no disponibles.';
  if (categoria.stockEnRiesgo > 0) return 'Ajusta stock hoy para evitar quiebres durante la operacion.';
  if (categoria.total === 0) return 'Agrega el primer producto para que este apartado empiece a operar.';
  if (categoria.stockControlado === 0) return 'Conecta el stock de este apartado para controlarlo mejor.';
  return 'Apartado estable. Puedes seguir optimizando precio, visibilidad o destacados.';
}

function obtenerTonoCategoria(categoria) {
  if (!categoria) return 'neutral';
  if (categoria.stockAgotado > 0) return 'danger';
  if (categoria.stockEnRiesgo > 0) return 'warning';
  return 'healthy';
}

export default function Productos() {
  const location = useLocation();
  const [showIntake, setShowIntake] = useState(() => new URLSearchParams(window.location.search).get('carga') === 'rapida');
  const navigate = useNavigate();
  const {
    canUseAI,
    estadoIA,
    hasFeature,
    cargandoEstadoIA,
    planAllowsAI,
    refreshIAState
  } = useIAContext();
  const { planActual, cargandoPlan, refreshPlan } = usePlanContext();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [inventarioItems, setInventarioItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [loadingInventario, setLoadingInventario] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [openCategoriaQuick, setOpenCategoriaQuick] = useState(false);
  const [creatingStarterPack, setCreatingStarterPack] = useState(false);
  const [creatingModuleId, setCreatingModuleId] = useState(null);

  const [productoActual, setProductoActual] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [iaBrief, setIaBrief] = useState('');
  const [iaProposalKind, setIaProposalKind] = useState('mixto');
  const [iaStyle, setIaStyle] = useState(IA_STUDIO_STYLES[0]);
  const [iaConstraints, setIaConstraints] = useState('');
  const [iaProposalData, setIaProposalData] = useState(null);
  const [decisionHub, setDecisionHub] = useState(null);
  const [workspaceConnection, setWorkspaceConnection] = useState(null);
  const [iaSelectedSections, setIaSelectedSections] = useState([]);
  const [iaSelectedPromotions, setIaSelectedPromotions] = useState([]);
  const [loadingLatestProposal, setLoadingLatestProposal] = useState(false);
  const [loadingDecisionHub, setLoadingDecisionHub] = useState(false);
  const [catalogAIForbidden, setCatalogAIForbidden] = useState(
    () => sessionStorage.getItem('comanda:catalog-ai-forbidden') === 'true'
  );
  const [generatingIAProposal, setGeneratingIAProposal] = useState(false);
  const [creatingIADraft, setCreatingIADraft] = useState(false);
  const [publishingIADraft, setPublishingIADraft] = useState(false);
  const [iaDraftResult, setIaDraftResult] = useState(null);
  const starterBuilderRef = useRef(null);
  const catalogoRef = useRef(null);
  const iaBriefInputRef = useRef(null);
  const iaProposalDataRef = useRef(null);
  const lastLocalProposalAtRef = useRef(0);

  useEffect(() => {
    iaProposalDataRef.current = iaProposalData;
  }, [iaProposalData]);

  const limiteProductosPlan = Number(planActual?.limites?.productos || planActual?.limite_productos || 0);
  const productosUsadosPlan = productos.length;
  const productosDisponiblesPlan = limiteProductosPlan > 0
    ? Math.max(limiteProductosPlan - productosUsadosPlan, 0)
    : null;
  const limiteProductosAlcanzado = limiteProductosPlan > 0 && productosUsadosPlan >= limiteProductosPlan;
  const textoUsoProductosPlan = limiteProductosPlan > 0
    ? `${productosUsadosPlan.toLocaleString('es-CO')} / ${limiteProductosPlan.toLocaleString('es-CO')} productos`
    : `${productosUsadosPlan.toLocaleString('es-CO')} productos`;

  useEffect(() => {
    if (!iaProposalData?.proposalId) {
      setIaDraftResult(null);
      return;
    }

    setIaDraftResult((prev) =>
      prev?.proposalId === iaProposalData.proposalId ? prev : null
    );
  }, [iaProposalData?.proposalId]);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const lista = await obtenerCatalogoCompletoProductos();
      setProductos(lista);
    } catch (err) {
      console.error('❌ Error cargando productos:', err);
      toast.error(err?.response?.data?.message || 'Error cargando productos');
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarCategorias = async () => {
    try {
      setLoadingCategorias(true);
      const res = await obtenerCategoriasAdmin();
      const items = res?.data?.items || [];
      setCategorias(items);
    } catch (err) {
      console.error('❌ Error cargando categorías:', err);
      toast.error(err?.response?.data?.message || 'Error cargando categorías');
      setCategorias([]);
    } finally {
      setLoadingCategorias(false);
    }
  };

  const cargarInventario = async () => {
    try {
      setLoadingInventario(true);
      const items = await obtenerItemsInventario();
      setInventarioItems(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Error cargando inventario para productos:', err);
      setInventarioItems([]);
    } finally {
      setLoadingInventario(false);
    }
  };

  const cargarDecisionHub = async () => {
    try {
      setLoadingDecisionHub(true);
      const response = await getDecisionHub();
      setDecisionHub(response?.data?.data || null);
    } catch (err) {
      console.error('Error cargando centro de decisiones:', err);
      setDecisionHub(null);
    } finally {
      setLoadingDecisionHub(false);
    }
  };

  const cargarWorkspaceCatalogoIA = async (proposalKind = iaProposalKind) => {
    if (catalogAIForbidden) {
      return null;
    }

    const preserveRecentLocalProposal = () => {
      const currentProposal = iaProposalDataRef.current;
      const wasRecentlyGenerated = Date.now() - lastLocalProposalAtRef.current < 20000;

      return Boolean(currentProposal?.proposalId) && wasRecentlyGenerated;
    };

    try {
      setLoadingLatestProposal(true);
      setLoadingDecisionHub(true);
      const [decisionHubResult, latestProposalResult] = await Promise.allSettled([
        getDecisionHub(),
        obtenerUltimaPropuestaCatalogo(proposalKind)
      ]);

      if (decisionHubResult.status === 'fulfilled') {
        setDecisionHub(decisionHubResult.value?.data?.data || null);
      } else {
        setDecisionHub(null);
      }

      let latestProposalLinked = false;
      if (latestProposalResult.status === 'fulfilled') {
        const latestProposal = latestProposalResult.value?.data || null;
        if (!latestProposal && preserveRecentLocalProposal()) {
          setWorkspaceConnection({
            source: 'catalogo-workspace-frontend',
            iaStateLinked: Boolean(estadoIA),
            decisionHubLinked: decisionHubResult.status === 'fulfilled',
            latestProposalLinked: false,
            syncedAt: new Date().toISOString()
          });
          return null;
        }

        setIaProposalData(latestProposal);
        latestProposalLinked = Boolean(latestProposal);
      } else {
        if (latestProposalResult.reason?.status === 403) {
          sessionStorage.setItem('comanda:catalog-ai-forbidden', 'true');
          setCatalogAIForbidden(true);
        }

        if (!preserveRecentLocalProposal()) {
          setIaProposalData(null);
        }
      }

      if (latestProposalResult.status !== 'fulfilled' && !preserveRecentLocalProposal()) {
        setIaProposalData(null);
      }

      setWorkspaceConnection({
        source: 'catalogo-workspace-frontend',
        iaStateLinked: Boolean(estadoIA),
        decisionHubLinked: decisionHubResult.status === 'fulfilled',
        latestProposalLinked,
        syncedAt: new Date().toISOString()
      });

      return null;
    } catch (error) {
      console.error('Error cargando workspace IA del catalogo:', error);
      if (!preserveRecentLocalProposal()) {
        setIaProposalData(null);
      }
      setDecisionHub(null);
      setWorkspaceConnection({
        source: 'catalogo-workspace-error',
        iaStateLinked: Boolean(estadoIA),
        decisionHubLinked: false,
        latestProposalLinked: false,
        syncedAt: new Date().toISOString()
      });
      return null;
    } finally {
      setLoadingLatestProposal(false);
      setLoadingDecisionHub(false);
    }
  };

  const handleCategoriaCreada = async (nueva) => {
    await cargarCategorias();
    const id = nueva?.data?.id ?? nueva?.id;
    if (id) {
      setProductoActual((prev) => (prev ? { ...prev, categoriaId: id } : prev));
    }
  };

  useEffect(() => {
    cargarProductos();
    cargarCategorias();
    cargarInventario();
  }, []);

  const productosFiltrados = useMemo(() => {
    let lista = productos;

    if (filtroCategoria !== 'todos') {
      lista = lista.filter(
        (p) => String(p.categoriaId) === String(filtroCategoria) || String(p?.categoria?.id) === String(filtroCategoria)
      );
    }

    if (busqueda.trim() !== '') {
      const term = normalizeText(busqueda);
      lista = lista.filter(
        (p) =>
          normalizeText(p.nombre).includes(term) ||
          normalizeText(p.descripcion).includes(term) ||
          normalizeText(p?.categoria?.nombre).includes(term)
      );
    }

    return [...lista].sort((a, b) => {
      const categoriaA = normalizeText(a?.categoria?.nombre || '');
      const categoriaB = normalizeText(b?.categoria?.nombre || '');
      const byCategoria = categoriaA.localeCompare(categoriaB, 'es');
      if (byCategoria !== 0) return byCategoria;
      return normalizeText(a.nombre).localeCompare(normalizeText(b.nombre), 'es');
    });
  }, [productos, filtroCategoria, busqueda]);

  const catalogoOrganizado = useMemo(() => {
    const categoriasOrdenadas = [...categorias].sort((a, b) =>
      normalizeText(a.nombre).localeCompare(normalizeText(b.nombre), 'es')
    );

    const productosPorCategoria = new Map();
    for (const producto of productos) {
      const categoriaId = String(producto.categoriaId || producto?.categoria?.id || 'sin-categoria');
      if (!productosPorCategoria.has(categoriaId)) {
        productosPorCategoria.set(categoriaId, []);
      }
      productosPorCategoria.get(categoriaId).push(producto);
    }

    const secciones = categoriasOrdenadas.map((categoria) => {
      const items = [...(productosPorCategoria.get(String(categoria.id)) || [])].sort((a, b) =>
        normalizeText(a.nombre).localeCompare(normalizeText(b.nombre), 'es')
      );

      return {
        id: String(categoria.id),
        nombre: categoria.nombre,
        descripcion: categoria.descripcion || 'Apartado activo dentro de tu carta digital.',
        icono: categoria.icono || '📦',
        total: items.length,
        activos: items.filter((producto) => producto.estado === 'activo').length,
        destacados: items.filter((producto) => Boolean(producto.destacado)).length,
        stockControlado: items.filter((producto) => producto.stockFuente && producto.stockFuente !== 'sin_control').length,
        stockEnRiesgo: items.filter((producto) => STOCK_RISK_STATES.has(obtenerEstadoStock(producto))).length,
        stockAgotado: items.filter((producto) => obtenerEstadoStock(producto) === 'agotado').length,
        productos: items
      };
    });

    const productosSinCategoria = [...productos.filter((producto) => !producto.categoriaId && !producto?.categoria?.id)].sort(
      (a, b) => normalizeText(a.nombre).localeCompare(normalizeText(b.nombre), 'es')
    );

    if (productosSinCategoria.length > 0) {
      secciones.push({
        id: 'sin-categoria',
        nombre: 'Sin categoría',
        descripcion: 'Productos que todavía no están organizados dentro de un apartado del menú.',
        icono: '🧩',
        total: productosSinCategoria.length,
        activos: productosSinCategoria.filter((producto) => producto.estado === 'activo').length,
        destacados: productosSinCategoria.filter((producto) => Boolean(producto.destacado)).length,
        stockControlado: productosSinCategoria.filter(
          (producto) => producto.stockFuente && producto.stockFuente !== 'sin_control'
        ).length,
        stockEnRiesgo: productosSinCategoria.filter((producto) => STOCK_RISK_STATES.has(obtenerEstadoStock(producto))).length,
        stockAgotado: productosSinCategoria.filter((producto) => obtenerEstadoStock(producto) === 'agotado').length,
        productos: productosSinCategoria
      });
    }

    return secciones;
  }, [categorias, productos]);

  const productosPorApartadoVista = useMemo(() => {
    const productoIdsVisibles = new Set(productosFiltrados.map((producto) => String(producto.id)));
    const secciones = catalogoOrganizado
      .map((categoria) => ({
        ...categoria,
        productos: categoria.productos.filter((producto) => productoIdsVisibles.has(String(producto.id)))
      }))
      .filter((categoria) => categoria.productos.length > 0);

    if (filtroCategoria !== 'todos') {
      return secciones.filter((categoria) => String(categoria.id) === String(filtroCategoria));
    }

    return secciones;
  }, [catalogoOrganizado, filtroCategoria, productosFiltrados]);

  const resumenCatalogo = useMemo(() => {
    return {
      categorias: catalogoOrganizado.length,
      productos: productos.length,
      destacados: productos.filter((producto) => Boolean(producto.destacado)).length,
      visibles: productos.filter((producto) => producto.estado === 'activo').length,
      controlados: productos.filter((producto) => producto.stockFuente && producto.stockFuente !== 'sin_control').length,
      agotados: productos.filter((producto) => obtenerEstadoStock(producto) === 'agotado').length,
      riesgo: productos.filter((producto) => STOCK_RISK_STATES.has(obtenerEstadoStock(producto))).length
    };
  }, [catalogoOrganizado, productos]);

  const resumenVista = useMemo(() => {
    return {
      agotados: productosFiltrados.filter((producto) => obtenerEstadoStock(producto) === 'agotado').length,
      riesgo: productosFiltrados.filter((producto) => STOCK_RISK_STATES.has(obtenerEstadoStock(producto))).length,
      controlados: productosFiltrados.filter((producto) => producto.stockFuente && producto.stockFuente !== 'sin_control').length
    };
  }, [productosFiltrados]);

  const guiaOperativa = useMemo(() => {
    return [
      {
        id: 'apartados',
        titulo: 'Ordena la carta',
        descripcion: 'Crea o completa apartados para que el menu no quede improvisado.',
        valor: `${resumenCatalogo.categorias} apartados`,
        tono: 'neutral'
      },
      {
        id: 'stock',
        titulo: 'Controla disponibilidad',
        descripcion: 'Conecta stock propio o inventario para evitar vender agotados.',
        valor: `${resumenCatalogo.controlados} con control`,
        tono: resumenCatalogo.riesgo > 0 ? 'warning' : 'healthy'
      },
      {
        id: 'riesgo',
        titulo: 'Prioriza lo urgente',
        descripcion: 'Identifica lo que pide accion inmediata antes del siguiente servicio.',
        valor: `${resumenCatalogo.agotados} agotados / ${resumenCatalogo.riesgo} en riesgo`,
        tono: resumenCatalogo.agotados > 0 ? 'danger' : resumenCatalogo.riesgo > 0 ? 'warning' : 'healthy'
      }
    ];
  }, [resumenCatalogo]);

  const starterPackStatus = useMemo(() => {
    const categoriasByName = new Map(
      categorias.map((categoria) => [normalizeText(categoria.nombre), categoria])
    );
    const catalogoByName = new Map(
      catalogoOrganizado.map((categoria) => [normalizeText(categoria.nombre), categoria])
    );
    const productosByCategory = new Map();

    for (const producto of productos) {
      const categoriaNombre = normalizeText(producto?.categoria?.nombre);
      if (!categoriaNombre) continue;
      if (!productosByCategory.has(categoriaNombre)) {
        productosByCategory.set(categoriaNombre, new Set());
      }
      productosByCategory.get(categoriaNombre).add(normalizeText(producto.nombre));
    }

    return MENU_STARTER_PACK.map((module) => {
      const categoryKey = normalizeText(module.nombre);
      const categoriaExistente = categoriasByName.get(categoryKey) || null;
      const productSet = productosByCategory.get(categoryKey) || new Set();
      const existingProducts = module.productos.filter((producto) =>
        productSet.has(normalizeText(producto.nombre))
      );

      return {
        ...module,
        categoriaExistente,
        categoriaReal: catalogoByName.get(categoryKey) || null,
        productosExistentes: existingProducts.length,
        productosPendientes: module.productos.length - existingProducts.length,
        completado: Boolean(categoriaExistente) && existingProducts.length === module.productos.length,
        creado: Boolean(categoriaExistente)
      };
    });
  }, [categorias, catalogoOrganizado, productos]);

  const starterPackSummary = useMemo(() => {
    const totalModules = MENU_STARTER_PACK.length;
    const totalSuggestedProducts = MENU_STARTER_PACK.reduce(
      (acc, module) => acc + module.productos.length,
      0
    );
    const readyModules = starterPackStatus.filter((module) => module.completado).length;
    const pendingModules = totalModules - readyModules;
    const createdSuggestedProducts = starterPackStatus.reduce(
      (acc, module) => acc + module.productosExistentes,
      0
    );

    return {
      totalModules,
      totalSuggestedProducts,
      readyModules,
      pendingModules,
      createdSuggestedProducts,
      allReady: readyModules === totalModules
    };
  }, [starterPackStatus]);

  const hasCatalogAIFeature = hasFeature('propuestaCatalogoIA');
  const canUseCatalogAI = canUseAI && hasCatalogAIFeature && !catalogAIForbidden;
  const catalogAIToolBlocked =
    Boolean(estadoIA) && !cargandoEstadoIA && (!canUseCatalogAI || !planAllowsAI);

  const iaProposal = iaProposalData?.proposal || null;

  const iaSelectionSummary = useMemo(() => {
    const selectedSections = (iaProposal?.secciones || []).filter((section) =>
      iaSelectedSections.includes(section.id)
    );
    const selectedPromotions = (iaProposal?.promociones || []).filter((promotion) =>
      iaSelectedPromotions.includes(promotion.id)
    );

    return {
      selectedSections,
      selectedPromotions,
      selectedProducts: selectedSections.reduce(
        (acc, section) => acc + (section.productos?.length || 0),
        0
      )
    };
  }, [iaProposal, iaSelectedPromotions, iaSelectedSections]);

  const hasIADraftSelection =
    iaSelectionSummary.selectedSections.length > 0 ||
    iaSelectionSummary.selectedPromotions.length > 0;

  useEffect(() => {
    if (!iaProposal) {
      setIaSelectedSections([]);
      setIaSelectedPromotions([]);
      return;
    }

    const nextSections = (iaProposal.secciones || []).map((section) => section.id);
    const nextPromotions = (iaProposal.promociones || []).map((promotion) => promotion.id);

    setIaSelectedSections(nextSections);
    setIaSelectedPromotions(nextPromotions);

    if (iaProposalData?.request) {
      setIaBrief(iaProposalData.request?.briefPrincipal || '');
      setIaProposalKind(iaProposalData.request?.proposalKind || iaProposalData.proposalKind || 'mixto');
      setIaStyle(iaProposalData.request?.estilo || IA_STUDIO_STYLES[0]);
      setIaConstraints(iaProposalData.request?.restricciones || '');
    }
  }, [iaProposal, iaProposalData]);

  useEffect(() => {
    if (!canUseCatalogAI && !cargandoEstadoIA) {
      setIaProposalData(null);
      setWorkspaceConnection(null);
      return;
    }

    void cargarWorkspaceCatalogoIA(iaProposalKind);
  }, [canUseCatalogAI, cargandoEstadoIA, iaProposalKind]);

  const ensureCatalogIAReady = async () => {
    let nextState = estadoIA;

    try {
      const refreshedState = await refreshIAState();
      if (refreshedState) {
        nextState = refreshedState;
      }
    } catch {
      // Si la verificacion del estado falla, continuamos de forma optimista
      // y dejamos que el endpoint real de propuesta responda.
    }

    if (!nextState) {
      return { allowed: true, state: null };
    }

    const planEnabled = Boolean(nextState.iaPermitidaPorPlan);
    const canConsume = Boolean(nextState.puedeConsumir);

    if (!planEnabled) {
      return {
        allowed: false,
        state: nextState,
        message: 'Tu plan actual no incluye esta guia IA.'
      };
    }

    if (!canConsume) {
      return {
        allowed: false,
        state: nextState,
        message: nextState.motivo || 'La IA no esta disponible en este momento.'
      };
    }

    return {
      allowed: true,
      state: nextState,
      missingFeature: !((nextState.funcionesDisponibles || []).includes('propuestaCatalogoIA'))
    };
  };

  const buildProductoFormData = (producto, categoriaId, { publish = true } = {}) => {
    const formData = new FormData();
    formData.append('nombre', producto.nombre);
    formData.append('descripcion', producto.descripcion);
    formData.append('precio', String(producto.precio));
    formData.append('categoriaId', String(categoriaId));
    formData.append('estado', publish ? 'activo' : 'inactivo');
    formData.append('activo', publish ? 'true' : 'false');
    formData.append('visibleEnMenu', publish ? 'true' : 'false');
    formData.append('visibleEnPOS', publish ? 'true' : 'false');
    formData.append('destacado', producto.destacado ? 'true' : 'false');
    formData.append('controlarStock', 'false');
    formData.append('stock', '0');
    formData.append('stockMinimo', '0');
    return formData;
  };

  const buildProductoPublishFormData = () => {
    const formData = new FormData();
    formData.append('estado', 'activo');
    formData.append('activo', 'true');
    formData.append('visibleEnMenu', 'true');
    formData.append('visibleEnPOS', 'true');
    return formData;
  };

  const focusIAGuideComposer = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const input = iaBriefInputRef.current;
        if (!input) return;

        input.focus();
        const cursor = input.value.length;
        input.setSelectionRange(cursor, cursor);
      });
    });
  };

  const applyGuidePrefill = (prefill, { announce = false, scroll = false } = {}) => {
    const nextPrefill = normalizeGuidePrefill(prefill);
    if (!nextPrefill.brief) return;

    setIaBrief(nextPrefill.brief);
    setIaProposalKind(nextPrefill.proposalKind);
    setIaStyle(nextPrefill.style);
    setIaConstraints(nextPrefill.constraints);

    if (scroll) {
      scrollToSection(starterBuilderRef);
    }

    focusIAGuideComposer();

    if (announce) {
      toast.success('Cargue esta jugada en la guia. Ahora revisa y genera la propuesta.');
    }
  };

  useEffect(() => {
    const nextPrefill = normalizeGuidePrefill(location.state?.iaGuidePrefill);
    if (!nextPrefill.brief) return;

    setIaBrief(nextPrefill.brief);
    setIaProposalKind(nextPrefill.proposalKind);
    setIaStyle(nextPrefill.style);
    setIaConstraints(nextPrefill.constraints);
    scrollToSection(starterBuilderRef);
    focusIAGuideComposer();
    toast.success('La jugada del panel ya quedo cargada en la guia IA.');
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const applyIAGuideTemplate = (template) => {
    if (!template) return;
    applyGuidePrefill(
      {
        brief: template.brief,
        proposalKind: template.proposalKind,
        style: template.style,
        constraints: template.constraints
      },
      { announce: false, scroll: false }
    );
  };

  const handleUseDecisionGuide = (item) => {
    if (!item?.guide) return;
    applyGuidePrefill(item.guide, { announce: true, scroll: true });
  };

  const syncModuleToMenu = async (module) => {
    const categoriasActuales =
      categorias.length > 0 ? categorias : ((await obtenerCategoriasAdmin())?.data?.items || []);
    const productosActuales =
      productos.length > 0 ? productos : (await obtenerCatalogoCompletoProductos());

    const categoriasByName = new Map(
      categoriasActuales.map((categoria) => [normalizeText(categoria.nombre), categoria])
    );

    const categoryKey = normalizeText(module.nombre);
    let categoria = categoriasByName.get(categoryKey);

    if (!categoria) {
      const creada = await crearCategoriaAdmin({
        nombre: module.nombre,
        descripcion: module.descripcion,
        icono: module.icono,
        estado: 'activo'
      });
      categoria = creada?.data || creada;
    }

    const productosExistentes = new Set(
      productosActuales
        .filter((producto) => normalizeText(producto?.categoria?.nombre) === categoryKey)
        .map((producto) => normalizeText(producto.nombre))
    );

    let productosCreados = 0;
    for (const producto of module.productos) {
      const keyProducto = normalizeText(producto.nombre);
      if (productosExistentes.has(keyProducto)) continue;
      await crearProducto(buildProductoFormData(producto, categoria.id));
      productosExistentes.add(keyProducto);
      productosCreados += 1;
    }

    return {
      categoriaCreada: !categoriasByName.get(categoryKey),
      productosCreados,
      categoriaId: categoria.id
    };
  };

  const handleCrearModulo = async (module) => {
    try {
      setCreatingModuleId(module.id);
      const result = await syncModuleToMenu(module);
      await Promise.all([cargarCategorias(), cargarProductos(), cargarDecisionHub()]);
      setFiltroCategoria(String(result.categoriaId));

      if (!result.categoriaCreada && result.productosCreados === 0) {
        toast.info(`El apartado "${module.nombre}" ya estaba listo en tu carta.`);
        return;
      }

      toast.success(
        `"${module.nombre}" listo en el menú: ${result.categoriaCreada ? 'apartado creado' : 'apartado existente'} y ${result.productosCreados} productos nuevos.`
      );
    } catch (err) {
      console.error(`❌ Error creando módulo ${module.nombre}:`, err);
      toast.error(err?.response?.data?.message || `No se pudo crear el apartado ${module.nombre}`);
    } finally {
      setCreatingModuleId(null);
    }
  };

  const handleCrearCartaBase = async () => {
    try {
      setCreatingStarterPack(true);
      let categoriasCreadas = 0;
      let productosCreados = 0;

      for (const module of MENU_STARTER_PACK) {
        const result = await syncModuleToMenu(module);
        if (result.categoriaCreada) categoriasCreadas += 1;
        productosCreados += result.productosCreados;
      }

      await Promise.all([cargarCategorias(), cargarProductos(), cargarDecisionHub()]);

      if (categoriasCreadas === 0 && productosCreados === 0) {
        toast.info('La carta estructurada ya estaba cargada en este restaurante.');
        return;
      }

      toast.success(
        `Carta estructurada lista: ${categoriasCreadas} apartados nuevos y ${productosCreados} productos agregados.`
      );
    } catch (err) {
      console.error('❌ Error creando carta estructurada:', err);
      toast.error(err?.response?.data?.message || 'No se pudo cargar la carta estructurada');
    } finally {
      setCreatingStarterPack(false);
    }
  };

  const handleGenerateIAProposal = async (forceRegenerate = false) => {
    const brief = iaBrief.trim();

    if (!brief) {
      toast.info('Cuentale a la IA que quieres vender antes de generar la propuesta.');
      return;
    }

    try {
      setGeneratingIAProposal(true);
      const access = await ensureCatalogIAReady();

      if (!access.allowed) {
        toast.info(access.message || 'Tu plan o estado actual no permite usar esta herramienta IA.');
        return;
      }

      const response = await generarPropuestaCatalogo({
        briefPrincipal: brief,
        objetivo: IA_PROPOSAL_OBJECTIVES.find((item) => item.id === iaProposalKind)?.label || iaProposalKind,
        estilo: iaStyle,
        restricciones: iaConstraints,
        tipoPropuesta: iaProposalKind,
        forceRegenerate
      });

      const nextProposal = response?.data || null;
      lastLocalProposalAtRef.current = Date.now();
      setIaProposalData(nextProposal);
      setWorkspaceConnection({
        source: 'catalogo-workspace-live',
        iaStateLinked: true,
        decisionHubLinked: Boolean(decisionHub),
        latestProposalLinked: Boolean(nextProposal),
        syncedAt: new Date().toISOString()
      });
      void refreshIAState();

      if (nextProposal?.cached) {
        toast.success('Recupere la ultima propuesta equivalente sin volver a cobrar IA.');
      } else {
        toast.success('La propuesta IA quedo lista para revisar antes de guardar.');
      }
    } catch (err) {
      console.error('Error generando propuesta IA:', err);
      if (err?.response?.status === 404) {
        toast.error('La guia IA todavia no esta habilitada en la API productiva. Ya estoy dejando este flujo preparado para cuando responda.');
      } else if (err?.response?.status === 403) {
        toast.error(err?.response?.data?.message || 'La IA no esta disponible para este restaurante ahora mismo.');
      } else {
        toast.error(err?.response?.data?.message || 'No se pudo generar la propuesta IA');
      }
    } finally {
      setGeneratingIAProposal(false);
    }
  };

  const handleCreateIADraft = async () => {
    if (!iaProposalData?.proposalId) {
      toast.info('Primero genera o recupera una propuesta IA.');
      return;
    }

    if (iaSelectionSummary.selectedSections.length === 0 && iaSelectionSummary.selectedPromotions.length === 0) {
      toast.info('Selecciona al menos un apartado o una promocion para convertir en borrador.');
      return;
    }

    if (iaDraftResult?.proposalId === iaProposalData.proposalId && iaDraftResult?.status === 'draft') {
      toast.info('Este borrador IA ya fue creado. Puedes publicarlo o generar otra version.');
      return;
    }

    try {
      setCreatingIADraft(true);
      const access = await ensureCatalogIAReady();

      if (!access.allowed) {
        toast.info(access.message || 'La IA no esta disponible para crear este borrador.');
        return;
      }

      const categoriasActuales =
        categorias.length > 0 ? categorias : ((await obtenerCategoriasAdmin())?.data?.items || []);
      const productosActuales =
        productos.length > 0 ? productos : (await obtenerCatalogoCompletoProductos());
      const promocionesActuales = await obtenerPromociones().catch(() => []);

      const categoriasByName = new Map(
        categoriasActuales.map((categoria) => [normalizeText(categoria.nombre), categoria])
      );
      const productsByCategoryAndName = new Set(
        productosActuales.map(
          (producto) =>
            `${normalizeText(producto?.categoria?.nombre)}::${normalizeText(producto.nombre)}`
        )
      );
      const productsByName = new Map(
        productosActuales.map((producto) => [normalizeText(producto.nombre), producto])
      );
      const promotionsByTitle = new Map(
        promocionesActuales.map((promotion) => [normalizeText(promotion.titulo), promotion])
      );

      const createdCategoryIds = [];
      const createdProductIds = [];
      const createdPromotionIds = [];
      let categoriasCreadas = 0;
      let productosCreados = 0;
      let promocionesCreadas = 0;
      let elementosExistentes = 0;
      let firstCategoryId = null;

      for (const section of iaSelectionSummary.selectedSections) {
        const categoryKey = normalizeText(section.nombre);
        let categoria = categoriasByName.get(categoryKey) || null;

        if (!categoria) {
          const creada = await crearCategoriaAdmin({
            nombre: section.nombre,
            descripcion: section.descripcion,
            icono: section.icono,
            estado: 'inactivo'
          });

          categoria = creada?.data || creada;
          categoriasByName.set(categoryKey, categoria);
          createdCategoryIds.push(categoria.id);
          categoriasCreadas += 1;
        }

        if (!firstCategoryId && categoria?.id) {
          firstCategoryId = categoria.id;
        }

        for (const product of section.productos || []) {
          const productKey = `${categoryKey}::${normalizeText(product.nombre)}`;
          if (productsByCategoryAndName.has(productKey)) {
            elementosExistentes += 1;
            continue;
          }

          const created = await crearProducto(
            buildProductoFormData(product, categoria.id, { publish: false })
          );

          const createdProduct = created?.data || created;
          if (createdProduct?.id) {
            createdProductIds.push(createdProduct.id);
            productsByName.set(normalizeText(createdProduct.nombre || product.nombre), createdProduct);
          }
          productsByCategoryAndName.add(productKey);
          productosCreados += 1;
        }
      }

      for (const promotion of iaSelectionSummary.selectedPromotions) {
        const promotionKey = normalizeText(promotion.titulo);
        if (promotionsByTitle.has(promotionKey)) {
          elementosExistentes += 1;
          continue;
        }

        const categoriaObjetivo = promotion.categoriaObjetivo
          ? categoriasByName.get(normalizeText(promotion.categoriaObjetivo))
          : null;
        const productoObjetivo = promotion.productoObjetivo
          ? productsByName.get(normalizeText(promotion.productoObjetivo))
          : null;

        const createdPromotion = await crearPromocion({
          tipo: promotion.tipo || 'card',
          titulo: promotion.titulo,
          descripcion: promotion.descripcion,
          botonTexto: promotion.botonTexto || 'Ver promo',
          colorPrincipal: promotion.colorPrincipal || '#FF6B6B',
          categoriaId: categoriaObjetivo?.id || null,
          productoId: productoObjetivo?.id || null,
          publicarAutomaticamente: false,
          estado: 'borrador',
          prioridad: Number(promotion.prioridad || 5)
        });

        const promotionData = createdPromotion?.data || createdPromotion;
        if (promotionData?.id) {
          createdPromotionIds.push(promotionData.id);
          promotionsByTitle.set(promotionKey, promotionData);
        }
        promocionesCreadas += 1;
      }

      const nextDraftResult = {
        proposalId: iaProposalData.proposalId,
        status: 'draft',
        createdAt: new Date().toISOString(),
        firstCategoryId,
        createdCategoryIds,
        createdProductIds,
        createdPromotionIds,
        summary: {
          categoriasCreadas,
          productosCreados,
          promocionesCreadas,
          elementosExistentes
        }
      };

      setIaDraftResult(nextDraftResult);
      await Promise.all([cargarCategorias(), cargarProductos(), cargarWorkspaceCatalogoIA(iaProposalKind)]);
      void refreshIAState();
      if (firstCategoryId) {
        setFiltroCategoria(String(firstCategoryId));
      }
      scrollToSection(catalogoRef);

      const summary = nextDraftResult.summary;
      toast.success(
        `Borrador IA listo: ${summary.categoriasCreadas || 0} apartados, ${summary.productosCreados || 0} productos y ${summary.promocionesCreadas || 0} promociones privadas para revisar.`
      );
    } catch (err) {
      console.error('Error creando borrador IA:', err);
      toast.error(err?.response?.data?.message || 'No se pudo crear el borrador IA');
    } finally {
      setCreatingIADraft(false);
    }
  };

  const handlePublishIADraft = async () => {
    if (!iaDraftResult || iaDraftResult.status !== 'draft') {
      toast.info('Primero crea un borrador IA antes de publicarlo.');
      return;
    }

    try {
      setPublishingIADraft(true);

      await Promise.all(
        (iaDraftResult.createdCategoryIds || []).map((categoryId) =>
          actualizarCategoriaAdmin(categoryId, { estado: 'activo' })
        )
      );

      await Promise.all(
        (iaDraftResult.createdProductIds || []).map((productId) =>
          actualizarProducto(productId, buildProductoPublishFormData())
        )
      );

      await Promise.all(
        (iaDraftResult.createdPromotionIds || []).map((promotionId) =>
          cambiarEstadoPromocion(promotionId, { estado: 'activa' })
        )
      );

      setIaDraftResult((prev) =>
        prev
          ? {
              ...prev,
              status: 'published',
              publishedAt: new Date().toISOString()
            }
          : prev
      );

      await Promise.all([cargarCategorias(), cargarProductos(), cargarWorkspaceCatalogoIA(iaProposalKind)]);
      void refreshIAState();
      scrollToSection(catalogoRef);
      toast.success('Borrador IA publicado. La propuesta ya quedo visible en tu carta y promociones.');
    } catch (err) {
      console.error('Error publicando borrador IA:', err);
      toast.error(err?.response?.data?.message || 'No se pudo publicar el borrador IA');
    } finally {
      setPublishingIADraft(false);
    }
  };

  const handleToggleIASection = (sectionId) => {
    setIaSelectedSections((prev) => toggleSelection(prev, sectionId));
  };

  const handleToggleIAPromotion = (promotionId) => {
    setIaSelectedPromotions((prev) => toggleSelection(prev, promotionId));
  };

  const handleNuevo = (categoriaId = '') => {
    if (limiteProductosAlcanzado) {
      toast.info(
        `Tu plan ${planActual?.nombre || 'actual'} permite hasta ${limiteProductosPlan.toLocaleString('es-CO')} productos. Libera productos o solicita un upgrade antes de crear mas.`
      );
      return;
    }

    setProductoActual(categoriaId ? { categoriaId } : {});
    setOpenModal(true);
  };

  function scrollToSection(ref) {
    requestAnimationFrame(() => {
      ref.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  }

  const handleEditarProducto = (producto) => {
    setProductoActual(producto);
    setOpenModal(true);
  };

  const handleIrAApartado = (categoriaId) => {
    setFiltroCategoria(String(categoriaId));
    scrollToSection(catalogoRef);
  };

  const handleSave = async (formData, ediciones = []) => {
    try {
      formData.set('ediciones', JSON.stringify(ediciones));

      if (productoActual?.id && !productos.some((p) => p.id === productoActual.id)) {
        toast.error('Este producto ya no existe.');
        setProductoActual(null);
        setOpenModal(false);
        return false;
      }

      if (productoActual?.id) {
        await actualizarProducto(productoActual.id, formData);
        toast.success('Producto actualizado correctamente');
      } else {
        const response = await crearProducto(formData);
        const productoCreado = response?.data?.data;
        if (!productoCreado?.id) {
          throw new Error('El producto fue creado, pero no se recibio su identificador');
        }
        toast.success('Producto creado correctamente');
      }

      await Promise.all([
        cargarProductos(),
        canUseCatalogAI ? cargarWorkspaceCatalogoIA(iaProposalKind) : Promise.resolve(null),
        refreshPlan()
      ]);
      setOpenModal(false);
      return true;
    } catch (err) {
      console.error('❌ Error guardando producto:', err);
      toast.error(err?.response?.data?.message || 'No se pudo guardar el producto');
      return false;
    }
  };

  const handleDelete = async (id) => {
    const confirmar = confirm('El producto será desactivado si tiene ventas');
    if (!confirmar) return;

    try {
      await eliminarProducto(id);
      setProductos((prev) => prev.filter((p) => p.id !== id));
      setProductoActual(null);
      setOpenModal(false);
      await Promise.all([
        canUseCatalogAI ? cargarWorkspaceCatalogoIA(iaProposalKind) : Promise.resolve(null),
        refreshPlan()
      ]);
      toast.success('Producto eliminado correctamente');
    } catch (err) {
      if (err?.status === 404) {
        setProductos((prev) => prev.filter((p) => p.id !== id));
        setProductoActual(null);
        setOpenModal(false);
        await Promise.all([
          canUseCatalogAI ? cargarWorkspaceCatalogoIA(iaProposalKind) : Promise.resolve(null),
          refreshPlan()
        ]);
        toast.success('Producto eliminado correctamente');
        return;
      }

      console.error('❌ Error eliminando producto:', err);
      toast.error(err?.response?.data?.message || 'No se pudo eliminar el producto');
    }
  };

  const abrirDesdeModulo = async (module) => {
    if (module.completado && module.categoriaExistente?.id) {
      handleIrAApartado(module.categoriaExistente.id);
      return;
    }

    await handleCrearModulo(module);
  };

  const handleAbrirConstructor = () => {
    scrollToSection(starterBuilderRef);
  };

  const handleStarterPackPrimaryAction = async () => {
    if (starterPackSummary.allReady) {
      scrollToSection(catalogoRef);
      return;
    }

    await handleCrearCartaBase();
  };

  const starterPackPrimaryLabel = starterPackSummary.allReady
    ? 'Revisar apartados creados'
    : starterPackSummary.readyModules > 0
      ? 'Completar carta base'
      : 'Aplicar plantilla base';

  return (
    <div className="productos-container productos-workspace fadeIn">
      <div className="module-header">
        <div className="module-header-left">
          <h2>Productos</h2>
          <p>Tu carta, organizada. Actualiza productos, precios y disponibilidad en un solo lugar.</p>
        </div>

        <div className="module-header-right">
          <button type="button" className="btn-secondary" onClick={() => setShowIntake(value => !value)} aria-expanded={showIntake}>
            {showIntake ? 'Ocultar carga rápida' : 'Cargar con fotos'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setOpenCategoriaQuick(true)}>
            Nueva categoría
          </button>
          <button className="btn-primary" onClick={() => handleNuevo()} disabled={limiteProductosAlcanzado}>
            + Nuevo producto
          </button>
        </div>
      </div>

      <div hidden={!showIntake}><ProductIntake categories={categorias} canAssist={canUseAI && hasCatalogAIFeature && !cargandoEstadoIA} remaining={cargandoPlan ? 0 : limiteProductosPlan > 0 ? productosDisponiblesPlan : 4} onNewCategory={() => setOpenCategoriaQuick(true)} onSaved={async () => { await Promise.all([cargarProductos(), cargarCategorias(), refreshPlan(), refreshIAState()]); }} /></div>
      <div className={`productos-plan-usage ${limiteProductosAlcanzado ? 'is-full' : ''}`}>
        <div>
          <span>Uso del plan</span>
          <strong>{textoUsoProductosPlan}</strong>
          <p>
            {limiteProductosPlan > 0
              ? `${productosDisponiblesPlan} cupo${productosDisponiblesPlan === 1 ? '' : 's'} disponible${productosDisponiblesPlan === 1 ? '' : 's'} en ${planActual?.nombre || 'el plan actual'}.`
              : cargandoPlan
                ? 'Consultando los límites de tu plan…'
                : 'Tu plan no reporta un límite de productos.'}
          </p>
        </div>
        {limiteProductosAlcanzado ? (
          <span className="productos-plan-usage__status">Límite alcanzado</span>
        ) : (
          <span className="productos-plan-usage__status">Disponible</span>
        )}
      </div>

      <div className="pw-filters" role="search" aria-label="Filtrar productos">
        <label className="pw-search">Buscar en tu carta
          <input type="search" placeholder="Nombre, descripción o categoría…" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </label>
        <label>Categoría
          <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
            <option value="todos">Todas las categorías</option>
            {categorias.map(c => <option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
          </select>
        </label>
        {(busqueda || filtroCategoria !== 'todos') && <button type="button" className="catalogo-soft-btn" onClick={() => { setBusqueda(''); setFiltroCategoria('todos'); }}>Limpiar filtros</button>}
        <span className="pw-result" role="status">{loading ? 'Cargando…' : `${productosFiltrados.length} producto${productosFiltrados.length === 1 ? '' : 's'}`}</span>
      </div>

      {loading ? (
        <div className="productos-skeleton-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="producto-skeleton"></div>
          ))}
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3 className="empty-state-title">{productos.length ? 'No encontramos coincidencias' : 'Empieza a construir tu carta'}</h3>
          <p className="empty-state-text">
            {productos.length ? 'Prueba otro nombre o cambia la categoría seleccionada.' : 'Crea tu primer producto o carga varias fotografías para comenzar.'}
          </p>
          <div className="empty-state-actions">
            <button className="btn-primary" onClick={() => handleNuevo()} disabled={limiteProductosAlcanzado}>
              + Crear producto
            </button>
          </div>
        </div>
      ) : (
        <section ref={catalogoRef} className="productos-real-panel">
          <div className="productos-real-head">
            <div>
              <span className="productos-real-kicker">Detalle de productos</span>
              <h3>Tu carta de productos</h3>
              <p>
                {productosFiltrados.length} resultado{productosFiltrados.length === 1 ? '' : 's'} en esta vista.
              </p>
            </div>

            <div className="productos-real-metrics">
              <span className="productos-real-metric neutral">{resumenVista.controlados} con control</span>
              <span className="productos-real-metric warning">{resumenVista.riesgo} en riesgo</span>
              <span className="productos-real-metric danger">{resumenVista.agotados} agotados</span>
            </div>
          </div>

          <div className="productos-apartados-list">
            {productosPorApartadoVista.map((apartado) => (
              <section key={apartado.id} className="productos-apartado-section">
                <div className="productos-apartado-head">
                  <div>
                    <span>{apartado.icono}</span>
                    <h4>{apartado.nombre}</h4>
                  </div>
                  <div className="pw-category-actions">
                    <p>{apartado.productos.length} producto{apartado.productos.length === 1 ? '' : 's'}</p>
                    <button type="button" className="catalogo-soft-btn" onClick={() => handleNuevo(apartado.id === 'sin-categoria' ? '' : apartado.id)} disabled={limiteProductosAlcanzado} aria-label={`Añadir producto a ${apartado.nombre}`}>+ Añadir</button>
                  </div>
                </div>

                <div className="productos-grid productos-grid--apartado">
                  {apartado.productos.map((prod) => (
                    <TarjetaProducto
                      key={prod.id}
                      producto={prod}
                      onEdit={() => handleEditarProducto(prod)}
                      onDelete={() => handleDelete(prod.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      )}

      <ModalProducto
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSubmit={handleSave}
        categorias={categorias}
        inventarioItems={inventarioItems}
        loadingInventario={loadingInventario}
        productoActual={productoActual}
        onOpenCategoriaQuickCreate={() => setOpenCategoriaQuick(true)}
      />

      <CategoriaQuickCreate
        open={openCategoriaQuick}
        onClose={() => setOpenCategoriaQuick(false)}
        onCreate={crearCategoriaAdmin}
        onCreated={handleCategoriaCreada}
      />
    </div>
  );
}
