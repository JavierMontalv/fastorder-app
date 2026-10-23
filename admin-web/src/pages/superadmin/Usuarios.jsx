import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import {
  actualizarEstadoUsuarioSuperadmin,
  actualizarVinculoUsuarioSuperadmin,
  eliminarUsuarioSuperadmin,
  listarUsuariosSuperadmin,
  obtenerRestaurantes,
  resetPasswordUsuarioSuperadmin
} from '../../services/superadminService';
import '../../styles/SuperadminUsuarios.css';

function formatDate(value) {
  if (!value) return 'Sin actividad';
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function getEstadoLabel(estado) {
  if (estado === 'activo') return 'Activo';
  if (estado === 'suspendido') return 'Suspendido';
  if (estado === 'bloqueado') return 'Bloqueado';
  return 'Inactivo';
}

const ESTADO_OPTIONS = [
  { value: 'activo', label: 'Activo' },
  { value: 'suspendido', label: 'Suspendido' },
  { value: 'bloqueado', label: 'Bloqueado' },
  { value: 'inactivo', label: 'Inactivo' }
];

const ROL_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'Staff' }
];

export default function UsuariosSuperadmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [restaurantes, setRestaurantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [form, setForm] = useState({
    restauranteId: '',
    rol: 'admin',
    estado: 'activo'
  });
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    try {
      setLoading(true);
      const [usuariosRes, restaurantesRes] = await Promise.all([
        listarUsuariosSuperadmin(),
        obtenerRestaurantes()
      ]);

      setUsuarios(usuariosRes.items || []);
      setResumen(usuariosRes.resumen || null);
      setRestaurantes(restaurantesRes || []);
    } catch (error) {
      toast.error(error.message || 'No se pudo cargar el módulo global de usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      const matchesEstado = filtroEstado === 'todos' ? true : usuario.estado === filtroEstado;
      if (!matchesEstado) return false;

      if (!normalizedQuery) return true;

      const searchable = [
        usuario.nombre,
        usuario.email,
        usuario.rol,
        usuario.restaurante?.nombre,
        usuario.restaurante?.slug
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [filtroEstado, query, usuarios]);

  const abrirEditor = (usuario) => {
    setUsuarioEditando(usuario);
    setForm({
      restauranteId: usuario.restauranteId ? String(usuario.restauranteId) : '',
      rol: usuario.rol,
      estado: usuario.estado
    });
  };

  const cerrarEditor = () => {
    setUsuarioEditando(null);
    setSaving(false);
  };

  const guardarCambios = async () => {
    if (!usuarioEditando) return;

    try {
      setSaving(true);

      const restauranteIdNormalizado = form.restauranteId ? Number(form.restauranteId) : null;

      const [vinculoRes, estadoRes] = await Promise.all([
        actualizarVinculoUsuarioSuperadmin(usuarioEditando.id, {
          restauranteId: restauranteIdNormalizado,
          rol: form.rol
        }),
        actualizarEstadoUsuarioSuperadmin(usuarioEditando.id, {
          estado: form.estado,
          motivo: form.estado === 'activo' ? 'Reactivado desde superadmin' : 'Gestionado desde superadmin'
        })
      ]);

      const usuarioActualizado = estadoRes?.usuario || vinculoRes?.usuario;
      setUsuarios((prev) =>
        prev.map((item) => (item.id === usuarioEditando.id ? usuarioActualizado || item : item))
      );

      toast.success('Usuario actualizado correctamente');
      cerrarEditor();
      await cargar();
    } catch (error) {
      toast.error(error.message || 'No se pudo actualizar el usuario');
      setSaving(false);
    }
  };

  const resetPassword = async (usuario) => {
    try {
      const response = await resetPasswordUsuarioSuperadmin(usuario.id);
      const passwordTemporal = response?.passwordTemporal;

      toast.success(
        passwordTemporal
          ? `Password temporal generada: ${passwordTemporal}`
          : 'Password temporal generada correctamente'
      );
    } catch (error) {
      toast.error(error.message || 'No se pudo generar la password temporal');
    }
  };

  const eliminarUsuario = async (usuario) => {
    const confirmar = window.confirm(`¿Eliminar definitivamente a ${usuario.nombre}?`);
    if (!confirmar) return;

    try {
      await eliminarUsuarioSuperadmin(usuario.id);
      setUsuarios((prev) => prev.filter((item) => item.id !== usuario.id));
      toast.success('Usuario eliminado definitivamente');
      await cargar();
    } catch (error) {
      toast.error(error.message || 'No se pudo eliminar el usuario');
    }
  };

  const cards = [
    {
      label: 'Cuentas gestionables',
      value: resumen?.total || 0,
      helper: 'Usuarios operativos activos en plataforma'
    },
    {
      label: 'Activos',
      value: resumen?.activos || 0,
      helper: `${resumen?.suspendidos || 0} restringidos o inactivos`
    },
    {
      label: 'Owners + Admins',
      value: (resumen?.owners || 0) + (resumen?.admins || 0),
      helper: `${resumen?.staff || 0} staff`
    },
    {
      label: 'Con restaurante',
      value: resumen?.conRestaurante || 0,
      helper: 'Asociados a un local'
    }
  ];

  return (
    <div className="sa-users-page">
      <section className="sa-users-hero">
        <div>
          <span className="sa-users-kicker">Control center</span>
          <h1>Usuarios del Sistema</h1>
          <p>
            Gestiona acceso, asociación por restaurante y estado operativo desde un solo módulo
            global.
          </p>
        </div>

        <div className="sa-users-stats">
          {cards.map((card) => (
            <article key={card.label} className="sa-users-stat-card">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.helper}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="sa-users-panel">
        <div className="sa-users-toolbar">
          <input
            type="search"
            className="sa-users-search"
            placeholder="Buscar por nombre, correo, rol o local"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <div className="sa-users-filters">
            {['todos', 'activo', 'suspendido', 'inactivo'].map((estado) => (
              <button
                key={estado}
                type="button"
                className={`sa-users-filter ${filtroEstado === estado ? 'active' : ''}`}
                onClick={() => setFiltroEstado(estado)}
              >
                {estado === 'todos' ? 'Todos' : getEstadoLabel(estado)}
              </button>
            ))}

            <button type="button" className="sa-users-filter ghost" onClick={cargar}>
              Recargar
            </button>
          </div>
        </div>

        <div className="sa-users-table-wrap">
          {loading ? (
            <div className="sa-users-empty">Cargando usuarios…</div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="sa-users-empty">No hay usuarios para los filtros actuales.</div>
          ) : (
            <table className="sa-users-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Local asociado</th>
                  <th>Último login</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>
                      <div className="sa-users-user">
                        <strong>{usuario.nombre}</strong>
                        <span>{usuario.email}</span>
                        {usuario.debeCambiarPassword ? (
                          <small>Cambio de password pendiente</small>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <span className="sa-users-pill">{usuario.rol}</span>
                    </td>
                    <td>
                      <span className={`sa-users-status ${usuario.estado}`}>
                        {getEstadoLabel(usuario.estado)}
                      </span>
                    </td>
                    <td>
                      {usuario.restaurante ? (
                        <div className="sa-users-restaurant">
                          <strong>{usuario.restaurante.nombre}</strong>
                          <span>/{usuario.restaurante.slug}</span>
                        </div>
                      ) : (
                        <span className="sa-users-muted">Sin local asociado</span>
                      )}
                    </td>
                    <td>{formatDate(usuario.ultimoLogin)}</td>
                    <td>
                      <div className="sa-users-actions">
                        <button type="button" onClick={() => abrirEditor(usuario)}>
                          Gestionar
                        </button>
                        <button type="button" onClick={() => resetPassword(usuario)}>
                          Temporal
                        </button>
                        <button type="button" className="danger" onClick={() => eliminarUsuario(usuario)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {usuarioEditando ? (
        <div className="sa-users-modal-backdrop" onClick={cerrarEditor}>
          <div className="sa-users-modal" onClick={(event) => event.stopPropagation()}>
            <div className="sa-users-modal-header">
              <div>
                <span className="sa-users-kicker">Gestión de acceso</span>
                <h2>{usuarioEditando.nombre}</h2>
                <p>{usuarioEditando.email}</p>
              </div>
              <button type="button" className="sa-users-close" onClick={cerrarEditor}>
                ×
              </button>
            </div>

            <div className="sa-users-form-grid">
              <label>
                <span>Restaurante</span>
                <select
                  value={form.restauranteId}
                  onChange={(event) => setForm((prev) => ({ ...prev, restauranteId: event.target.value }))}
                >
                  <option value="">Sin local asociado</option>
                  {restaurantes.map((restaurante) => (
                    <option key={restaurante.id} value={restaurante.id}>
                      {restaurante.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Rol</span>
                <select
                  value={form.rol}
                  onChange={(event) => setForm((prev) => ({ ...prev, rol: event.target.value }))}
                >
                  {ROL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="full">
                <span>Estado del usuario</span>
                <select
                  value={form.estado}
                  onChange={(event) => setForm((prev) => ({ ...prev, estado: event.target.value }))}
                >
                  {ESTADO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="sa-users-modal-actions">
              <button type="button" className="ghost" onClick={cerrarEditor} disabled={saving}>
                Cancelar
              </button>
              <button type="button" onClick={guardarCambios} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
