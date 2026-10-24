import { useMemo, useState } from 'react';
import '../styles/Pedidos.css';
import {
  formatCurrency,
  formatEstadoPago,
  formatEstadoPedido,
  formatMetodoPago,
  obtenerEtiquetaMesa,
  pedidoPagoPendienteOperativo
} from '../utils/pedidos';

function clasificarPersonalizaciones(item = {}) {
  const resultado = {
    agregar: [],
    retirar: [],
    elegir: [],
    instrucciones: []
  };

  const grupos = Array.isArray(item.modificacionesDetalle) ? item.modificacionesDetalle : [];

  grupos.forEach((grupo) => {
    const esInstruccion = grupo?.tipoSeleccion === 'texto';
    (grupo?.opciones || []).forEach((opcion) => {
      const nombre = String(opcion?.nombre || '').trim();
      if (!nombre) return;
      const precioExtra = Number(opcion?.precioExtra || 0);
      const etiqueta = precioExtra > 0 ? `${nombre} +${formatCurrency(precioExtra)}` : nombre;

      if (esInstruccion || opcion?.tipo === 'instruccion') {
        resultado.instrucciones.push(nombre);
      } else if (opcion?.tipo === 'remover') {
        resultado.retirar.push(nombre);
      } else if (opcion?.tipo === 'extra' || precioExtra > 0) {
        resultado.agregar.push(etiqueta);
      } else {
        resultado.elegir.push(etiqueta);
      }
    });
  });

  if (grupos.length === 0 && Array.isArray(item.modificaciones)) {
    item.modificaciones
      .map((valor) => String(valor || '').trim())
      .filter(Boolean)
      .forEach((valor) => resultado.elegir.push(valor));
  }

  if (item.nota) resultado.instrucciones.push(item.nota);
  if (item.instrucciones) resultado.instrucciones.push(item.instrucciones);
  Object.keys(resultado).forEach((key) => {
    resultado[key] = [...new Set(resultado[key])];
  });
  return resultado;
}

function PersonalizacionesPedido({ item, compacta = false }) {
  const grupos = clasificarPersonalizaciones(item);
  const filas = [
    { key: 'agregar', label: 'Agregar', valores: grupos.agregar },
    { key: 'retirar', label: 'Sin', valores: grupos.retirar },
    { key: 'elegir', label: 'Eleccion', valores: grupos.elegir },
    { key: 'instrucciones', label: 'Nota para cocina', valores: grupos.instrucciones }
  ].filter((fila) => fila.valores.length > 0);

  if (filas.length === 0) return null;

  return (
    <div className={`pedido-personalizaciones ${compacta ? 'pedido-personalizaciones-compacta' : ''}`}>
      {filas.map((fila) => (
        <div key={fila.key} className={`pedido-personalizacion pedido-personalizacion-${fila.key}`}>
          <span>{fila.label}</span>
          <strong>{fila.valores.join(', ')}</strong>
        </div>
      ))}
    </div>
  );
}

export default function PedidoCard({
  grupo,
  onEstado,
  onAnunciar,
  onMarcarPagado,
  onCancelarPedido,
  onEliminarPedido,
  onMesaDisponible,
  puedeAnunciar = true,
  puedeMarcarPagado = true,
  puedeVerTotales = true,
  resolverAccionEstado,
  pedidoAccionId = null,
  pedidoAnuncioId = null,
  pedidoPagoId = null,
  pedidoEliminandoId = null,
  mesaEstadoId = null
}) {
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const pedidoPrincipal = grupo.pedidoPrincipal;
  const tienePedidos = Array.isArray(grupo?.pedidos) && grupo.pedidos.length > 0;
  const tieneMesaAsignada = Boolean(grupo?.mesaId);
  const aliasMesa = grupo?.mesaNombre || '';
  const capacidadMesa = Number(grupo?.mesaCapacidad) || 0;
  const detalleId = `pedido-detalle-${grupo.id}`;
  const mesaEstado = String(grupo?.mesaEstado || 'disponible');
  const mesaEstadoLabel = tieneMesaAsignada
    ? mesaEstado.charAt(0).toUpperCase() + mesaEstado.slice(1)
    : 'Ticket directo';
  const cuentaCompartidaActiva = Boolean(grupo?.cuentaCompartidaActiva);
  const esMesaSecundaria = Boolean(grupo?.esMesaSecundaria);
  const mesaCuentaNumero = grupo?.mesaCuentaNumero || grupo?.mesaNumero || null;
  const etiquetaMesa = tienePedidos
    ? obtenerEtiquetaMesa(grupo)
    : mesaEstado === 'ocupada'
    ? 'Mesa ocupada'
    : 'Mesa disponible';
  const puedeLiberarMesa =
    Boolean(grupo?.mesaId) &&
    !cuentaCompartidaActiva &&
    !esMesaSecundaria &&
    mesaEstado === 'ocupada' &&
    Number(grupo?.pedidosActivos || 0) === 0;
  const mesaDisponibleDesdePedidos = typeof onMesaDisponible === 'function' && puedeLiberarMesa;
  const mesaStatusMessage =
    cuentaCompartidaActiva
      ? `Esta mesa opera con cuenta unificada${mesaCuentaNumero ? ` en Mesa ${mesaCuentaNumero}` : ''}. Gestiona la separación del grupo desde Configuración.`
      : mesaEstado === 'ocupada'
      ? mesaDisponibleDesdePedidos
        ? 'La mesa ya no tiene tickets activos; puedes marcarla disponible desde esta tarjeta.'
        : 'La mesa sigue ocupada mientras tenga pedidos abiertos o acciones pendientes.'
      : 'Si necesitas volverla ocupada, hazlo desde Configuracion para mantener el control operativo.';

  const resumenOperativo = useMemo(() => {
    if (!tienePedidos) {
      return {
        pedidoPrioritario: null,
        accionPrioritaria: null,
        requierePago: false,
        itemsClave: [],
        itemsOcultos: 0
      };
    }

    const pedidoConAccion = grupo.pedidos.find((pedido) => {
      const accion = typeof resolverAccionEstado === 'function' ? resolverAccionEstado(pedido) : null;
      return Boolean(accion);
    });

    const pedidoConPago = grupo.pedidos.find((pedido) => pedidoPagoPendienteOperativo(pedido));

    const pedidoPrioritario = pedidoConAccion || (puedeMarcarPagado ? pedidoConPago : null) || pedidoPrincipal;

    const accionPrioritaria =
      typeof resolverAccionEstado === 'function' && pedidoPrioritario
        ? resolverAccionEstado(pedidoPrioritario)
        : null;

    const requierePago = pedidoPagoPendienteOperativo(pedidoPrioritario);
    const itemsClave = grupo.resumenItems.slice(0, 3);
    const itemsOcultos = Math.max(grupo.resumenItems.length - itemsClave.length, 0);
    const itemPersonalizado = pedidoPrioritario?.items?.find((item) => {
      const personalizaciones = clasificarPersonalizaciones(item);
      return Object.values(personalizaciones).some((valores) => valores.length > 0);
    });

    return {
      pedidoPrioritario,
      accionPrioritaria,
      requierePago,
      itemsClave,
      itemsOcultos,
      itemPersonalizado
    };
  }, [grupo, pedidoPrincipal, puedeMarcarPagado, resolverAccionEstado, tienePedidos]);

  const resumenComensales = useMemo(() => {
    const comensales = new Map();
    (grupo?.pedidos || []).forEach((pedido) => {
      const nombre = String(pedido?.clienteNombre || '').trim() || `Pedido #${pedido?.numero || pedido?.id}`;
      const actual = comensales.get(nombre) || { nombre, total: 0, items: 0, pedidos: 0 };
      actual.total += Number(pedido?.total || 0);
      actual.items += Number(pedido?.totalItems || 0);
      actual.pedidos += 1;
      comensales.set(nombre, actual);
    });
    return [...comensales.values()].sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre));
  }, [grupo]);

  const badgeLabel = tienePedidos ? formatEstadoPedido(grupo.estadoDominante) : mesaEstadoLabel;
  const badgeClassName = tienePedidos
    ? `pedido-badge pedido-badge-estado estado-${grupo.estadoDominante}`
    : `pedido-badge pedido-badge-mesa pedido-badge-mesa-${mesaEstado}`;
  const descripcionCabecera = tienePedidos
    ? `Cuenta #${pedidoPrincipal?.numero || pedidoPrincipal?.id} - ${grupo.totalItems} item(s) - ${grupo.tiempoTexto} en operacion.`
    : `${aliasMesa ? `${aliasMesa} · ` : ''}${capacidadMesa > 0 ? `${capacidadMesa} puesto(s)` : 'Mesa configurada'} · ${mesaEstado === 'ocupada' ? 'Marcada como ocupada en configuracion.' : 'Disponible para nuevos pedidos.'}`;
  const totalBlockTitle = tienePedidos
    ? (puedeVerTotales ? (tieneMesaAsignada ? 'Total de mesa' : 'Total del ticket') : 'Produccion')
    : 'Lectura de mesa';
  const totalBlockValue = tienePedidos ? (puedeVerTotales ? formatCurrency(grupo.total) : `${grupo.totalItems} item(s)`) : mesaEstadoLabel;
  const totalBlockHint = tienePedidos
    ? `${grupo.cantidadPedidos} ticket(s) en operacion`
    : 'Sin tickets en el rango filtrado';
  const pedidoPrioritarioCancelable =
    tienePedidos &&
    resumenOperativo.pedidoPrioritario &&
    ['pendiente', 'aceptado', 'preparacion'].includes(resumenOperativo.pedidoPrioritario.estado) &&
    typeof onCancelarPedido === 'function';
  const pedidoPrioritarioEsPendiente = resumenOperativo.pedidoPrioritario?.estado === 'pendiente';
  const resumenTagsSinPedidos = [
    capacidadMesa > 0 ? `Capacidad ${capacidadMesa} pax` : 'Capacidad sin definir',
    aliasMesa || 'Sin alias configurado',
    cuentaCompartidaActiva
      ? `Cuenta unificada${mesaCuentaNumero ? ` · Mesa ${mesaCuentaNumero}` : ''}`
      : mesaEstado === 'ocupada'
        ? 'Bloqueo manual activo'
        : 'Lista para servicio'
  ];
  const textoIntencionSinPedidos =
    cuentaCompartidaActiva
      ? 'Mesa integrada a una cuenta operativa común'
      : mesaEstado === 'ocupada'
      ? 'Mesa bloqueada u ocupada sin tickets en el rango actual'
      : 'Mesa lista para recibir nuevos pedidos';
  const textoApoyoSinPedidos =
    aliasMesa || 'Configurada desde el modulo de mesas';

  return (
    <article className={`pedido-card pedido-card-${grupo.estadoDominante}`}>
      <div className="pedido-card-shell pedido-card-shell-compact">
        <header className="pedido-card-top">
          <div className="pedido-card-heading pedido-card-heading-compact">
            <span className="pedido-card-kicker">{etiquetaMesa}</span>
            <div className="pedido-card-title-row">
              <h3>{grupo.mesaLabel}</h3>
              {aliasMesa && <span className="pedido-card-context-chip">{aliasMesa}</span>}
              <span className={badgeClassName}>
                {grupo.estadoDominante === 'preparacion' ? (
                  <span className="pedido-cooking-pan" aria-hidden="true">
                    <span className="pedido-cooking-pan-body" />
                    <span className="pedido-cooking-pan-handle" />
                  </span>
                ) : null}
                {badgeLabel}
              </span>
            </div>
            <p>{descripcionCabecera}</p>
          </div>

          <div className="pedido-card-total-block">
            <span>{totalBlockTitle}</span>
            <strong>{totalBlockValue}</strong>
            <small>{totalBlockHint}</small>
          </div>
        </header>

        <section className="pedido-card-metrics">
          <div className="pedido-metric">
            <span>{tienePedidos ? 'Cliente del pedido' : 'Mesa creada'}</span>
            <strong>{tienePedidos ? pedidoPrincipal?.clienteNombre || `#${pedidoPrincipal?.numero || pedidoPrincipal?.id}` : grupo.mesaLabel}</strong>
          </div>

          <div className="pedido-metric">
            <span>{tienePedidos ? 'Metodo principal' : 'Zona / alias'}</span>
            <strong>{tienePedidos ? formatMetodoPago(pedidoPrincipal?.metodoPago) : aliasMesa || 'General'}</strong>
          </div>

          <div className="pedido-metric">
            <span>Pagos pendientes</span>
            <strong>{grupo.pagosPendientes}</strong>
          </div>

          <div className="pedido-metric">
            <span>Pedidos activos</span>
            <strong>{grupo.pedidosActivos}</strong>
          </div>

          <div className="pedido-metric pedido-metric-status">
            <span>{tieneMesaAsignada ? 'Estado de mesa' : 'Origen'}</span>
            <strong className={`pedido-metric-status-pill pedido-metric-status-pill-${mesaEstado}`}>
              {mesaEstadoLabel}
            </strong>
          </div>
        </section>

        <section className="pedido-card-preview">
          <div className="pedido-card-preview-copy">
            <span>Resumen clave</span>
            <div className="pedido-preview-list">
              {tienePedidos
                ? resumenOperativo.itemsClave.map((item) => (
                    <span key={item.nombre} className="pedido-tag pedido-tag-summary">
                      {item.cantidad}x {item.nombre}
                    </span>
                ))
                : resumenTagsSinPedidos.map((tag) => (
                    <span key={tag} className="pedido-tag pedido-tag-summary">
                      {tag}
                    </span>
                ))}
              {tienePedidos && resumenOperativo.itemsOcultos > 0 && (
                <span className="pedido-tag pedido-tag-summary">
                  +{resumenOperativo.itemsOcultos} adicional(es)
                </span>
              )}
            </div>
            {tienePedidos && resumenOperativo.itemPersonalizado ? (
              <PersonalizacionesPedido item={resumenOperativo.itemPersonalizado} compacta />
            ) : null}
          </div>

          <div className="pedido-card-intent">
            <span>Accion sugerida</span>
            <strong>
              {tienePedidos
                ? resumenOperativo.accionPrioritaria
                  ? resumenOperativo.accionPrioritaria.label
                  : resumenOperativo.requierePago
                    ? 'Confirmar pago en caja'
                    : 'Sin accion pendiente'
                : textoIntencionSinPedidos}
            </strong>
            <small>
              {tienePedidos
                ? resumenOperativo.pedidoPrioritario
                  ? `Pedido #${resumenOperativo.pedidoPrioritario.numero || resumenOperativo.pedidoPrioritario.id}`
                  : 'Operacion estable'
                : textoApoyoSinPedidos}
            </small>
          </div>
        </section>

        <section className="pedido-card-toolbar">
          <div className="pedido-card-toolbar-copy">
            <span>Vista operativa</span>
            <p>
              Vista compacta para cocina y caja. Abre detalle solo si necesitas lineas,
              notas o acciones. {mesaStatusMessage}
            </p>
          </div>

          <div className="pedido-card-actions pedido-card-actions-compact">
            {mesaDisponibleDesdePedidos && (
              <button
                type="button"
                className="pedido-btn pedido-btn-success"
                onClick={() => onMesaDisponible(grupo)}
                disabled={mesaEstadoId === grupo?.mesaId}
              >
                {mesaEstadoId === grupo?.mesaId ? 'Actualizando mesa...' : 'Marcar disponible'}
              </button>
            )}

            {tienePedidos && resumenOperativo.requierePago && puedeMarcarPagado && typeof onMarcarPagado === 'function' && (
              <button
                type="button"
                className="pedido-btn pedido-btn-secondary"
                onClick={() => onMarcarPagado(resumenOperativo.pedidoPrioritario)}
                disabled={pedidoPagoId === resumenOperativo.pedidoPrioritario?.id}
              >
                {pedidoPagoId === resumenOperativo.pedidoPrioritario?.id
                  ? 'Procesando pago...'
                  : 'Marcar pago'}
              </button>
            )}

            {tienePedidos && resumenOperativo.accionPrioritaria && (
              <button
                type="button"
                className="pedido-btn pedido-btn-primary"
                onClick={() =>
                  onEstado(resumenOperativo.pedidoPrioritario, (resumenOperativo.accionPrioritaria.estado || resumenOperativo.accionPrioritaria.next))
                }
                disabled={pedidoAccionId === resumenOperativo.pedidoPrioritario?.id}
              >
                {pedidoAccionId === resumenOperativo.pedidoPrioritario?.id
                  ? 'Actualizando...'
                  : resumenOperativo.accionPrioritaria.label}
              </button>
            )}

            {pedidoPrioritarioCancelable && (
              <button
                type="button"
                className={pedidoPrioritarioEsPendiente ? 'pedido-btn pedido-btn-warning' : 'pedido-btn pedido-btn-danger'}
                onClick={() => onCancelarPedido(resumenOperativo.pedidoPrioritario)}
                disabled={pedidoAccionId === resumenOperativo.pedidoPrioritario?.id}
              >
                {pedidoAccionId === resumenOperativo.pedidoPrioritario?.id
                  ? 'Cancelando...'
                  : pedidoPrioritarioEsPendiente
                    ? 'No aceptar'
                    : 'Cancelar pedido'}
              </button>
            )}

            {tienePedidos && (
              <button
                type="button"
                className="pedido-btn pedido-btn-ghost pedido-card-detail-toggle"
                onClick={() => setDetalleAbierto((prev) => !prev)}
                aria-expanded={detalleAbierto}
                aria-controls={detalleId}
              >
                {detalleAbierto ? 'Ocultar detalle' : 'Ver detalle'}
              </button>
            )}
          </div>
        </section>

        {detalleAbierto && tienePedidos && (
          <section id={detalleId} className="pedido-card-details">
            <div className="pedido-card-section-head">
              <span>Detalle por ticket</span>
              <p>
                Desglose por ticket con items, notas, estado financiero y acciones operativas.
              </p>
            </div>

            {tieneMesaAsignada && resumenComensales.length > 0 ? (
              <div className="pedido-diner-summary" aria-label={`Resumen de ${resumenComensales.length} comensales`}>
                <div className="pedido-diner-summary-head">
                  <div>
                    <span>Cuenta compartida</span>
                    <strong>{resumenComensales.length} comensal(es) identificados</strong>
                  </div>
                  <small>Una mesa · sin tarjetas duplicadas</small>
                </div>
                <div className="pedido-diner-summary-list">
                  {resumenComensales.map((comensal) => (
                    <div key={comensal.nombre} className="pedido-diner-row">
                      <span className="pedido-diner-avatar" aria-hidden="true">
                        {comensal.nombre.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <strong>{comensal.nombre}</strong>
                        <small>{comensal.pedidos} pedido(s) · {comensal.items} item(s)</small>
                      </div>
                      {puedeVerTotales ? <b>{formatCurrency(comensal.total)}</b> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="pedido-detail-grid">
              {grupo.pedidos.map((pedido) => {
                const accion = typeof resolverAccionEstado === 'function' ? resolverAccionEstado(pedido) : null;
                const pagoPendiente = pedidoPagoPendienteOperativo(pedido);
                const mostrarIdentificador = grupo.cantidadPedidos > 1;
                const pedidoCancelable = ['pendiente', 'aceptado', 'preparacion'].includes(pedido.estado);

                return (
                  <div key={pedido.id} className="pedido-detail-card">
                    <div className="pedido-detail-head">
                      <div className="pedido-detail-title">
                        <span className="pedido-order-id">
                          {mostrarIdentificador
                            ? `Pedido #${pedido.numero || pedido.id}`
                            : `Cuenta consolidada de ${grupo.mesaLabel}`}
                        </span>
                        <strong>
                          {pedido.items
                            .slice(0, 2)
                            .map((item) => `${item.cantidad}x ${item.nombre}`)
                            .join(' / ') || 'Sin items'}
                        </strong>
                      </div>

                      <div className="pedido-order-badges">
                        <span className={`pedido-badge pedido-badge-estado estado-${pedido.estado}`}>
                          {formatEstadoPedido(pedido.estado)}
                        </span>
                        <span className={`pedido-badge pedido-badge-pago pago-${pedido.estadoPago}`}>
                          {formatEstadoPago(pedido.estadoPago)}
                        </span>
                      </div>
                    </div>

                    <div className="pedido-detail-meta">
                      {pedido.clienteNombre ? <span>Cliente {pedido.clienteNombre}</span> : null}
                      <span>{pedido.tiempoTexto} desde apertura</span>
                      <span>Metodo {formatMetodoPago(pedido.metodoPago)}</span>
                      {puedeVerTotales ? <span>Total {formatCurrency(pedido.total)}</span> : null}
                    </div>

                    {pedido.nota && <div className="pedido-detail-note">Nota: {pedido.nota}</div>}

                    <div className="pedido-detail-items">
                      {pedido.items.map((item) => {
                        const detallesItem = [...(Array.isArray(item.extras) ? item.extras : [])]
                          .map((detalle) => String(detalle || '').trim())
                          .filter(Boolean);

                        return (
                          <div key={item.id} className="pedido-order-line pedido-order-line-configurable">
                            <div className="pedido-order-line-main">
                              <span>
                                {item.cantidad}x {item.nombre}
                              </span>
                              {puedeVerTotales ? <strong>{formatCurrency(item.subtotal)}</strong> : null}
                            </div>

                            {detallesItem.length > 0 ? (
                              <ul className="pedido-order-line-modifiers">
                                {detallesItem.map((detalle) => (
                                  <li key={`${item.id}-${detalle}`}>{detalle}</li>
                                ))}
                              </ul>
                            ) : null}
                            <PersonalizacionesPedido item={item} />
                          </div>
                        );
                      })}
                    </div>

                    <div className="pedido-detail-actions">
                      <div className="pedido-order-footer-copy">
                        <span className="pedido-order-footer-label">Siguiente paso</span>
                        <p>
                          {pagoPendiente && accion
                            ? 'Confirma el pago o continua el flujo operativo segun la prioridad del local.'
                            : pagoPendiente
                            ? 'Este ticket aun requiere cierre financiero en caja.'
                            : accion
                            ? 'El pedido puede avanzar al siguiente estado operativo.'
                            : 'Este ticket ya no requiere accion operativa inmediata.'}
                        </p>
                      </div>

                      <div className="pedido-card-actions">
                        {pedido.estado === 'listo' && puedeAnunciar && typeof onAnunciar === 'function' && (
                          <button
                            type="button"
                            className="pedido-btn pedido-btn-ghost"
                            onClick={() => onAnunciar(pedido)}
                            disabled={pedidoAnuncioId === pedido.id}
                          >
                            {pedidoAnuncioId === pedido.id ? 'Relanzando...' : 'Relanzar llamado'}
                          </button>
                        )}

                        {pagoPendiente && puedeMarcarPagado && typeof onMarcarPagado === 'function' && (
                          <button
                            type="button"
                            className="pedido-btn pedido-btn-secondary"
                            onClick={() => onMarcarPagado(pedido)}
                            disabled={pedidoPagoId === pedido.id}
                          >
                            {pedidoPagoId === pedido.id ? 'Procesando pago...' : 'Marcar pago'}
                          </button>
                        )}

                        {accion && (
                          <button
                            type="button"
                            className="pedido-btn pedido-btn-primary"
                            onClick={() => onEstado(pedido, accion.estado || accion.next)}
                            disabled={pedidoAccionId === pedido.id}
                          >
                            {pedidoAccionId === pedido.id ? 'Actualizando...' : accion.label}
                          </button>
                        )}

                        {pedidoCancelable && typeof onCancelarPedido === 'function' && (
                          <button
                            type="button"
                            className={pedido.estado === 'pendiente' ? 'pedido-btn pedido-btn-warning' : 'pedido-btn pedido-btn-danger'}
                            onClick={() => onCancelarPedido(pedido)}
                            disabled={pedidoAccionId === pedido.id}
                          >
                            {pedidoAccionId === pedido.id
                              ? 'Cancelando...'
                              : pedido.estado === 'pendiente'
                                ? 'No aceptar'
                                : 'Cancelar pedido'}
                          </button>
                        )}

                        {pedido.estado === 'cancelado' && typeof onEliminarPedido === 'function' && (
                          <button
                            type="button"
                            className="pedido-btn pedido-btn-danger"
                            onClick={() => onEliminarPedido(pedido)}
                            disabled={pedidoEliminandoId === pedido.id}
                          >
                            {pedidoEliminandoId === pedido.id ? 'Eliminando...' : 'Eliminar registro'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
