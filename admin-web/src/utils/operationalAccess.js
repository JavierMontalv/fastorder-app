export const STAFF_PROFILE_OPTIONS = [
  {
    value: 'mesero',
    label: 'Mesero',
    description: 'Consulta pedidos listos y coordina entrega en sala.'
  },
  {
    value: 'cocina',
    label: 'Cocina',
    description: 'Lee pedidos y puede marcar preparaciones como listas.'
  },
  {
    value: 'caja',
    label: 'Caja',
    description: 'Confirma pagos y revisa el flujo financiero del servicio.'
  },
  {
    value: 'lectura',
    label: 'Solo lectura',
    description: 'Monitorea operacion sin ejecutar cambios.'
  }
];

const STAFF_PROFILE_MAP = STAFF_PROFILE_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item;
  return acc;
}, {});

function parsePermisos(permisos = null) {
  if (typeof permisos !== 'string') return permisos;

  const raw = permisos.trim();
  if (!raw) return permisos;

  try {
    return JSON.parse(raw);
  } catch {
    return permisos;
  }
}

export function normalizarPerfilOperativo(permisos = null) {
  const permisosNormalizados = parsePermisos(permisos);
  const rawValue =
    typeof permisosNormalizados === 'string'
      ? permisosNormalizados
      : permisosNormalizados?.perfilOperativo?.code ||
        permisosNormalizados?.perfilOperativo ||
        permisosNormalizados?.code ||
        '';
  const raw = String(rawValue).trim().toLowerCase();
  return STAFF_PROFILE_MAP[raw] ? raw : null;
}

export function construirCapacidadesFallback(user = null) {
  const rol = user?.rol;
  const perfilOperativo = normalizarPerfilOperativo(user?.permisos || user?.perfilOperativo);
  const esFullAccess = ['owner', 'admin', 'superadmin'].includes(rol);

  return {
    esFullAccess,
    perfilOperativo,
    puedeGestionarEquipo: esFullAccess,
    puedeVerPedidos: esFullAccess || rol === 'staff',
    puedeEditarEstadoPedido: esFullAccess || perfilOperativo === 'cocina',
    puedeMarcarPedidoListo: esFullAccess || perfilOperativo === 'cocina',
    puedeEntregarPedidos: esFullAccess || perfilOperativo === 'mesero',
    puedeCancelarPedidos: esFullAccess,
    puedeEliminarPedidos: esFullAccess,
    puedeLiberarMesa: esFullAccess,
    puedeGestionarCatalogo: esFullAccess,
    puedeVerAnaliticas: esFullAccess,
    puedeConfigurarLocal: esFullAccess,
    puedeUsarSoporteIA: esFullAccess,
    puedeVerDashboard: esFullAccess,
    puedeVerPagos: esFullAccess || perfilOperativo === 'caja',
    puedeConfirmarPagoCaja: esFullAccess || perfilOperativo === 'caja',
    puedeConfirmarPagos: esFullAccess || perfilOperativo === 'caja'
  };
}

export function obtenerCapacidadesUsuario(user = null) {
  const fallback = construirCapacidadesFallback(user);
  const capacidades = user?.capacidades && typeof user.capacidades === 'object' ? user.capacidades : {};
  const perfilOperativo =
    normalizarPerfilOperativo(capacidades) ||
    normalizarPerfilOperativo(user?.perfilOperativo) ||
    fallback.perfilOperativo;

  return {
    ...fallback,
    ...capacidades,
    perfilOperativo,
    puedeEditarEstadoPedido:
      Boolean(capacidades.puedeEditarEstadoPedido) || fallback.puedeEditarEstadoPedido || perfilOperativo === 'cocina',
    puedeMarcarPedidoListo:
      Boolean(capacidades.puedeMarcarPedidoListo) || fallback.puedeMarcarPedidoListo || perfilOperativo === 'cocina',
    puedeEntregarPedidos:
      Boolean(capacidades.puedeEntregarPedidos) || fallback.puedeEntregarPedidos || perfilOperativo === 'mesero',
    puedeConfirmarPagoCaja:
      Boolean(capacidades.puedeConfirmarPagoCaja) || fallback.puedeConfirmarPagoCaja || perfilOperativo === 'caja',
    puedeConfirmarPagos:
      Boolean(capacidades.puedeConfirmarPagos) || fallback.puedeConfirmarPagos || perfilOperativo === 'caja'
  };
}

export function obtenerPerfilOperativoUsuario(user = null) {
  const perfil =
    normalizarPerfilOperativo(user?.perfilOperativo) ||
    normalizarPerfilOperativo(user?.capacidades) ||
    normalizarPerfilOperativo(user?.permisos);
  return perfil ? STAFF_PROFILE_MAP[perfil] || null : null;
}

export function esUsuarioManager(user = null) {
  return Boolean(obtenerCapacidadesUsuario(user)?.esFullAccess);
}
