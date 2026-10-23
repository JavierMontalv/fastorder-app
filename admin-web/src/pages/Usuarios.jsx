import { useContext, useEffect, useMemo, useState } from 'react';
import {
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiKey,
  FiPower,
  FiRefreshCw,
  FiShield,
  FiUserCheck,
  FiUserX
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import {
  actualizarEstadoMiembroEquipo,
  actualizarMiembroEquipo,
  cambiarPasswordMiembroEquipo,
  crearMiembroEquipo,
  generarPasswordTemporalEquipo,
  listarEquipo
} from '../api/equipoApi';
import {
  STAFF_PROFILE_OPTIONS,
  esUsuarioManager,
  obtenerCapacidadesUsuario
} from '../utils/operationalAccess';
import { AuthContext } from '../context/AuthContext';
import '../styles/UsuariosEquipo.css';

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Propietario del local' },
  { value: 'admin', label: 'Administrador' },
  { value: 'staff', label: 'Operativo del local' }
];

const ESTADO_FILTERS = [
  { value: 'activo', label: 'Activos' },
  { value: 'inactivo', label: 'Desactivados' }
];

const EMPTY_FORM = {
  nombre: '',
  email: '',
  rol: 'staff',
  perfilOperativo: 'mesero',
  generarTemporal: true,
  password: '',
  forzarCambioPassword: true
};

function estadoLabel(estado) {
  if (estado === 'activo') return 'Activo';
  if (estado === 'suspendido') return 'Suspendido';
  if (estado === 'inactivo') return 'Desactivado';
  return 'Bloqueado';
}

function estadoIcon(estado) {
  if (estado === 'activo') return <FiCheckCircle aria-hidden="true" />;
  if (estado === 'inactivo') return <FiPower aria-hidden="true" />;
  if (estado === 'suspendido') return <FiClock aria-hidden="true" />;
  return <FiShield aria-hidden="true" />;
}

function TeamActionButton({ label, icon, variant = 'neutral', ...props }) {
  return (
    <button
      type="button"
      className={`team-action-btn team-action-${variant}`}
      aria-label={props['aria-label'] || label}
      title={label}
      {...props}
    >
      <span className="team-action-icon">{icon}</span>
    </button>
  );
}

function perfilLabel(usuario) {
  if (usuario.rol !== 'staff') {
    return usuario.rol === 'owner' ? 'Control total del local' : 'Gestion administrativa';
  }

  const match = STAFF_PROFILE_OPTIONS.find((item) => item.value === usuario.perfilOperativo?.code);
  return match?.label || 'Staff';
}

function TeamMemberModal({
  abierto,
  mode,
  form,
  setForm,
  onClose,
  onSubmit,
  saving,
  cuposDisponibles,
  roleOptions = ROLE_OPTIONS
}) {
  if (!abierto) return null;

  const esCrear = mode === 'create';
  const necesitaPerfil = form.rol === 'staff';

  return (
    <div className="team-modal-backdrop" onClick={onClose}>
      <div className="team-modal" onClick={(event) => event.stopPropagation()}>
        <div className="team-modal-header">
          <div>
            <span className="team-kicker">{esCrear ? 'Nuevo integrante' : 'Editar acceso'}</span>
            <h2>{esCrear ? 'Crear usuario del local' : 'Actualizar usuario del equipo'}</h2>
            <p>
              {esCrear
                ? `Se creará dentro del restaurante actual. Cupos disponibles: ${cuposDisponibles}.`
                : 'Ajusta rol, acceso y perfil operativo sin mover la cuenta fuera del local.'}
            </p>
          </div>

          <button type="button" className="team-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="team-modal-body" onSubmit={onSubmit}>
          <div className="team-form-grid">
            <label>
              <span>Nombre</span>
              <input
                type="text"
                value={form.nombre}
                onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
                placeholder="Nombre del usuario"
              />
            </label>

            <label>
              <span>Correo de acceso</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="correo@dominio.com"
              />
            </label>

            <label>
              <span>Rol base</span>
              <select
                value={form.rol}
                onChange={(event) => {
                  const nextRole = event.target.value;
                  setForm((prev) => ({
                    ...prev,
                    rol: nextRole,
                    perfilOperativo: nextRole === 'staff' ? prev.perfilOperativo || 'mesero' : ''
                  }));
                }}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Perfil operativo</span>
              <select
                value={necesitaPerfil ? form.perfilOperativo : ''}
                onChange={(event) => setForm((prev) => ({ ...prev, perfilOperativo: event.target.value }))}
                disabled={!necesitaPerfil}
              >
                {!necesitaPerfil && <option value="">No aplica a propietarios o administradores</option>}
                {STAFF_PROFILE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="team-profile-grid">
            {STAFF_PROFILE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`team-profile-card ${
                  necesitaPerfil && form.perfilOperativo === option.value ? 'active' : ''
                } ${!necesitaPerfil ? 'disabled' : ''}`}
                onClick={() => necesitaPerfil && setForm((prev) => ({ ...prev, perfilOperativo: option.value }))}
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>

          {esCrear && (
            <div className="team-password-panel">
              <div className="team-password-copy">
                <strong>Acceso inicial</strong>
                <p>
                  Puedes entregar una password temporal segura o definir una contraseña manual desde este momento.
                </p>
              </div>

              <label className="team-switch">
                <input
                  type="checkbox"
                  checked={form.generarTemporal}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      generarTemporal: event.target.checked,
                      password: event.target.checked ? '' : prev.password
                    }))
                  }
                />
                <span>Generar password temporal</span>
              </label>

              {!form.generarTemporal && (
                <label className="team-password-input">
                  <span>Password inicial</span>
                  <input
                    type="text"
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder="Minimo 8 caracteres"
                  />
                </label>
              )}
            </div>
          )}

          <div className="team-modal-actions">
            <button type="button" className="secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Guardando...' : esCrear ? 'Crear usuario' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordModal({ usuario, form, setForm, onClose, onSubmit, saving }) {
  if (!usuario) return null;

  return (
    <div className="team-modal-backdrop" onClick={onClose}>
      <div className="team-modal team-password-modal" onClick={(event) => event.stopPropagation()}>
        <div className="team-modal-header">
          <div>
            <span className="team-kicker">Seguridad de acceso</span>
            <h2>Cambiar contraseña</h2>
            <p>
              Actualiza el acceso de {usuario.nombre}. Esta accion queda registrada y solo aplica dentro
              de este restaurante.
            </p>
          </div>

          <button type="button" className="team-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="team-modal-body" onSubmit={onSubmit}>
          <div className="team-password-panel">
            <div className="team-password-copy">
              <strong>{usuario.email}</strong>
              <p>Define una contraseña segura para entregar al integrante del equipo.</p>
            </div>

            <label className="team-password-input">
              <span>Nueva contraseña</span>
              <input
                type="text"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Minimo 8 caracteres"
                autoFocus
              />
            </label>

            <label className="team-switch">
              <input
                type="checkbox"
                checked={form.forzarCambioPassword}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, forzarCambioPassword: event.target.checked }))
                }
              />
              <span>Pedir cambio al iniciar sesion</span>
            </label>
          </div>

          <div className="team-modal-actions">
            <button type="button" className="secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Actualizando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsuariosEquipo() {
  const { user } = useContext(AuthContext);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accionandoId, setAccionandoId] = useState(null);
  const [query, setQuery] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('activo');
  const [modalMode, setModalMode] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    forzarCambioPassword: true
  });
  const [passwordTemporal, setPasswordTemporal] = useState(null);

  const cargar = async () => {
    try {
      setLoading(true);
      const response = await listarEquipo();
      setPayload(response?.data || null);
    } catch (error) {
      toast.error(error.message || 'No se pudo cargar el equipo del restaurante');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const items = payload?.items || [];
  const resumen = payload?.resumen || {};
  const plan = payload?.plan || {};
  const restaurante = payload?.restaurante || null;

  const itemsFiltrados = useMemo(() => {
    const q = String(query || '').trim().toLowerCase();

    return items.filter((usuario) => {
      const matchesEstado = usuario.estado === filtroEstado;
      if (!matchesEstado) return false;
      if (!q) return true;

      return [usuario.nombre, usuario.email, usuario.rol, usuario.perfilOperativo?.label]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [filtroEstado, items, query]);

  const modalAbierto = modalMode === 'create' || modalMode === 'edit';
  const cuposDisponibles = Number(plan?.cuposDisponibles || 0);
  const cuposLlenos = Number(plan?.cuposDisponibles || 0) <= 0;
  const roleOptionsDisponibles = useMemo(
    () => ROLE_OPTIONS.filter((option) => option.value !== 'owner' || ['owner', 'superadmin'].includes(user?.rol)),
    [user?.rol]
  );
  const puedeGestionarPasswords = ['admin', 'owner', 'superadmin'].includes(user?.rol);

  const abrirCrear = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setModalMode('create');
  };

  const abrirEditar = (usuario) => {
    setEditingUser(usuario);
    setForm({
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      rol: usuario.rol || 'staff',
      perfilOperativo: usuario.perfilOperativo?.code || 'mesero',
      generarTemporal: true,
      password: '',
      forzarCambioPassword: true
    });
    setModalMode('edit');
  };

  const cerrarModal = () => {
    setModalMode(null);
    setEditingUser(null);
    setForm(EMPTY_FORM);
  };

  const abrirPassword = (usuario) => {
    setPasswordUser(usuario);
    setPasswordForm({
      password: '',
      forzarCambioPassword: true
    });
  };

  const cerrarPassword = () => {
    setPasswordUser(null);
    setPasswordForm({
      password: '',
      forzarCambioPassword: true
    });
  };

  const guardar = async (event) => {
    event.preventDefault();

    const nombre = String(form.nombre || '').trim();
    const email = String(form.email || '').trim().toLowerCase();

    if (!nombre) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (!email) {
      toast.error('El correo es obligatorio');
      return;
    }

    if (form.rol === 'staff' && !form.perfilOperativo) {
      toast.error('Selecciona un perfil operativo para el staff');
      return;
    }

    if (modalMode === 'create' && !form.generarTemporal && String(form.password || '').trim().length < 8) {
      toast.error('La password manual debe tener al menos 8 caracteres');
      return;
    }

    try {
      setSaving(true);
      setPasswordTemporal(null);

      if (modalMode === 'create') {
        const response = await crearMiembroEquipo({
          nombre,
          email,
          rol: form.rol,
          perfilOperativo: form.rol === 'staff' ? form.perfilOperativo : null,
          generarTemporal: form.generarTemporal,
          password: form.generarTemporal ? '' : form.password,
          forzarCambioPassword: form.forzarCambioPassword
        });

        const temporal = response?.data?.passwordTemporal;
        if (temporal) {
          setPasswordTemporal({
            usuario: email,
            valor: temporal
          });
        }

        toast.success('Usuario del equipo creado correctamente');
      } else if (editingUser) {
        await actualizarMiembroEquipo(editingUser.id, {
          nombre,
          email,
          rol: form.rol,
          perfilOperativo: form.rol === 'staff' ? form.perfilOperativo : null
        });

        toast.success('Usuario actualizado correctamente');
      }

      await cargar();
      cerrarModal();
    } catch (error) {
      toast.error(error.message || 'No fue posible guardar el usuario');
    } finally {
      setSaving(false);
    }
  };

  const cambiarEstado = async (usuario, estado) => {
    try {
      setAccionandoId(usuario.id);
      await actualizarEstadoMiembroEquipo(usuario.id, {
        estado,
        motivo: `Gestionado desde admin-web`
      });
      await cargar();
      toast.success(`${usuario.nombre} ahora esta ${estadoLabel(estado).toLowerCase()}`);
    } catch (error) {
      toast.error(error.message || 'No fue posible actualizar el estado del usuario');
    } finally {
      setAccionandoId(null);
    }
  };

  const liberarCupo = async (usuario) => {
    const confirmar = window.confirm(
      `Vas a liberar el cupo de ${usuario.nombre}. La cuenta quedará inactiva para este local.`
    );
    if (!confirmar) return;
    await cambiarEstado(usuario, 'inactivo');
  };

  const generarTemporal = async (usuario) => {
    try {
      setAccionandoId(usuario.id);
      const response = await generarPasswordTemporalEquipo(usuario.id);
      const temporal = response?.data?.passwordTemporal || null;

      if (temporal) {
        setPasswordTemporal({
          usuario: usuario.email,
          valor: temporal
        });
      }

      toast.success(`Password temporal generada para ${usuario.nombre}`);
      await cargar();
    } catch (error) {
      toast.error(error.message || 'No fue posible generar la password temporal');
    } finally {
      setAccionandoId(null);
    }
  };

  const cambiarPassword = async (event) => {
    event.preventDefault();
    if (!passwordUser?.id) return;

    const password = String(passwordForm.password || '').trim();
    if (password.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      setSaving(true);
      await cambiarPasswordMiembroEquipo(passwordUser.id, {
        password,
        forzarCambioPassword: passwordForm.forzarCambioPassword
      });
      await cargar();
      toast.success(`Contraseña actualizada para ${passwordUser.nombre}`);
      cerrarPassword();
    } catch (error) {
      toast.error(error.message || 'No fue posible cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="team-shell-loading">Cargando modulo de usuarios...</div>;
  }

  return (
    <div className="team-shell">
      <section className="team-hero">
        <div className="team-hero-copy">
          <span className="team-kicker">Usuarios</span>
          <h1>Equipo operativo del restaurante</h1>
          <p>
            Crea cuentas por rol, controla acceso desde el plan activo y organiza la operacion entre cocina,
            meseros, caja y administracion sin mezclar credenciales entre locales.
          </p>
        </div>

        <div className="team-hero-actions">
          {passwordTemporal && (
            <div className="team-password-toast">
              <span>Password temporal</span>
              <strong>{passwordTemporal.valor}</strong>
              <small>{passwordTemporal.usuario}</small>
            </div>
          )}

          <button type="button" className="team-refresh-btn" onClick={cargar}>
            Recargar
          </button>
          <button
            type="button"
            className="team-primary-btn"
            onClick={abrirCrear}
            disabled={cuposLlenos}
          >
            {cuposLlenos ? 'Plan sin cupos' : 'Crear usuario'}
          </button>
        </div>
      </section>

      <section className="team-summary-grid">
        <article className="team-summary-card team-summary-card-accent">
          <span>Plan activo</span>
          <strong>{plan?.nombre || 'Sin plan'}</strong>
          <p>
            {restaurante?.nombre || 'Restaurante actual'} · {plan?.limiteUsuarios || 0} cupos de equipo.
          </p>
        </article>

        <article className="team-summary-card">
          <span>Cupos usados</span>
          <strong>{plan?.cuposUsados || 0}</strong>
          <p>{plan?.cuposDisponibles || 0} disponibles antes de tocar el tope del plan.</p>
        </article>

        <article className="team-summary-card">
          <span>Activos</span>
          <strong>{resumen?.activos || 0}</strong>
          <p>{resumen?.inactivos || 0} desactivados. Los usuarios activos conservan acceso al panel.</p>
        </article>

        <article className="team-summary-card">
          <span>Operacion</span>
          <strong>{resumen?.staff || 0}</strong>
          <p>
            {resumen?.meseros || 0} meseros · {resumen?.cocina || 0} cocina · {resumen?.caja || 0} caja ·{' '}
            {resumen?.lectura || 0} lectura.
          </p>
        </article>
      </section>

      <section className="team-strategy-grid">
        <article className="team-strategy-card">
          <span className="team-kicker">Gobierno premium</span>
          <h2>Roles pensados para operacion real</h2>
          <ul>
            <li>Owner/Admin: controlan catalogo, ajustes, equipo y estados completos del pedido.</li>
            <li>Staff Cocina: ve el tablero y puede marcar un pedido como listo.</li>
            <li>Staff Caja: confirma pagos en caja sin editar carta ni configuracion.</li>
            <li>Staff Mesero o lectura: monitorean el servicio sin tocar configuracion ni catalogo.</li>
          </ul>
        </article>

        <article className="team-strategy-card">
          <span className="team-kicker">Alineacion del local</span>
          <h2>Un usuario, un restaurante, una operacion</h2>
          <ul>
            <li>Las cuentas creadas aqui solo nacen dentro de este restaurante o sede activa.</li>
            <li>Cuando cocina deja un pedido listo, el tablero de mesero lo ve en tiempo real.</li>
            <li>Caja confirma pagos sin tener permisos para modificar productos, promociones o usuarios.</li>
          </ul>
        </article>
      </section>

      <section className="team-panel">
        <div className="team-toolbar">
          <input
            type="search"
            placeholder="Buscar por nombre, correo, rol o perfil"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <div className="team-filters">
            {ESTADO_FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={filtroEstado === item.value ? 'active' : ''}
                onClick={() => setFiltroEstado(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="team-table-wrap">
          {itemsFiltrados.length === 0 ? (
            <div className="team-empty-state">
              <strong>No hay usuarios para este filtro.</strong>
              <span>
                {cuposLlenos
                  ? 'El plan llegó a su límite. Libera o reactiva cupos antes de crear nuevos usuarios.'
                  : 'Crea el primer usuario operativo y deja el local listo para trabajar por roles.'}
              </span>
            </div>
          ) : (
            <table className="team-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Acceso</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {itemsFiltrados.map((usuario) => {
                  const capacidades = obtenerCapacidadesUsuario(usuario);
                  const esManager = esUsuarioManager(usuario);
                  const esUsuarioActual = String(usuario.id) === String(user?.id);

                  return (
                    <tr key={usuario.id}>
                      <td>
                        <div className="team-user-cell">
                          <strong>{usuario.nombre}</strong>
                          <span>{usuario.email}</span>
                          {usuario.debeCambiarPassword ? <small>Cambio de password pendiente</small> : null}
                        </div>
                      </td>
                      <td>
                        <span className="team-pill">{perfilLabel(usuario)}</span>
                        <small>{usuario.rol}</small>
                      </td>
                      <td>
                        <div className="team-access-copy">
                          <strong>
                            {esManager
                              ? 'Gestion completa'
                              : capacidades?.puedeMarcarPedidoListo
                                ? 'Cocina operativa'
                                : capacidades?.puedeConfirmarPagoCaja || capacidades?.puedeConfirmarPagos
                                  ? 'Caja operativa'
                                  : 'Solo lectura'}
                          </strong>
                          <span>
                            {esManager
                              ? 'Administra negocio y estados'
                              : capacidades?.puedeMarcarPedidoListo
                                ? 'Puede marcar pedidos listos'
                                : capacidades?.puedeConfirmarPagoCaja || capacidades?.puedeConfirmarPagos
                                  ? 'Puede confirmar pagos'
                                  : 'Sin cambios sobre pedidos'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`team-status team-status-${usuario.estado}`}>
                          {estadoIcon(usuario.estado)}
                          {estadoLabel(usuario.estado)}
                        </span>
                      </td>
                      <td>
                        <div className="team-actions">
                          <TeamActionButton
                            label="Editar"
                            icon={<FiEdit3 aria-hidden="true" />}
                            onClick={() => abrirEditar(usuario)}
                            aria-label={`Editar usuario ${usuario.nombre}`}
                          />
                          {puedeGestionarPasswords && !esUsuarioActual ? (
                            <TeamActionButton
                              label="Cambiar contraseña"
                              icon={<FiKey aria-hidden="true" />}
                              variant="secure"
                              onClick={() => abrirPassword(usuario)}
                              disabled={accionandoId === usuario.id || usuario.estado === 'inactivo'}
                              aria-label={`Cambiar contrasena de ${usuario.nombre}`}
                            />
                          ) : null}
                          {usuario.estado !== 'activo' ? (
                            <TeamActionButton
                              label="Reactivar"
                              icon={<FiUserCheck aria-hidden="true" />}
                              variant="success"
                              onClick={() => cambiarEstado(usuario, 'activo')}
                              disabled={accionandoId === usuario.id}
                              aria-label={`Reactivar usuario ${usuario.nombre}`}
                            />
                          ) : null}
                          <TeamActionButton
                            label="Desactivar"
                            icon={<FiUserX aria-hidden="true" />}
                            variant="danger"
                            onClick={() => liberarCupo(usuario)}
                            disabled={accionandoId === usuario.id || usuario.estado === 'inactivo' || esUsuarioActual}
                            aria-label={`Desactivar usuario ${usuario.nombre}`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <TeamMemberModal
        abierto={modalAbierto}
        mode={modalMode}
        form={form}
        setForm={setForm}
        onClose={cerrarModal}
        onSubmit={guardar}
        saving={saving}
        cuposDisponibles={cuposDisponibles}
        roleOptions={roleOptionsDisponibles}
      />

      <PasswordModal
        usuario={passwordUser}
        form={passwordForm}
        setForm={setPasswordForm}
        onClose={cerrarPassword}
        onSubmit={cambiarPassword}
        saving={saving}
      />
    </div>
  );
}
