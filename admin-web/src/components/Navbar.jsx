import { useContext, useEffect, useRef, useState } from 'react';
import { FiMenu, FiMoon, FiSun } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';

import { AuthContext } from '../context/AuthContext';
import { usePedidosNotifications } from '../context/PedidosNotificationsContext';
import { useTheme } from '../context/ThemeContext';
import { obtenerSedesRestaurante, seleccionarSedeRestaurante } from '../api/restauranteApi';
import PedidosNotificationsPanel from './PedidosNotificationsPanel';
import '../styles/Navbar.css';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout, refreshProfile } = useContext(AuthContext);
  const { unreadCount, marcarTodasLeidas } = usePedidosNotifications();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [panelOpen, setPanelOpen] = useState(false);
  const [sedesState, setSedesState] = useState({ loading: false, sedes: [], enabled: false });
  const [switchingSede, setSwitchingSede] = useState(false);
  const alertsRef = useRef(null);

  useEffect(() => {
    if (location.pathname === '/pedidos') {
      marcarTodasLeidas();
    }
  }, [location.pathname, marcarTodasLeidas]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!alertsRef.current?.contains(event.target)) {
        setPanelOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!panelOpen) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'default') return;

    Notification.requestPermission().catch(() => {});
  }, [panelOpen]);

  useEffect(() => {
    let active = true;

    const loadSedes = async () => {
      if (!user?.restauranteId || !['admin', 'owner'].includes(user?.rol)) return;

      try {
        setSedesState((prev) => ({ ...prev, loading: true }));
        const response = await obtenerSedesRestaurante();
        const data = response?.data?.data || response?.data || {};
        if (!active) return;

        setSedesState({
          loading: false,
          enabled: Boolean(data.multisede_habilitado),
          sedes: Array.isArray(data.sedes) ? data.sedes : []
        });
      } catch {
        if (!active) return;
        setSedesState({ loading: false, enabled: false, sedes: [] });
      }
    };

    loadSedes();

    return () => {
      active = false;
    };
  }, [user?.restauranteId, user?.rol]);

  const cambiarSede = async (event) => {
    const nextSedeId = Number(event.target.value);
    if (!nextSedeId || nextSedeId === Number(user?.restauranteId)) return;

    try {
      setSwitchingSede(true);
      await seleccionarSedeRestaurante(nextSedeId);
      localStorage.setItem('comanda_sede_activa_id', String(nextSedeId));
      window.dispatchEvent(new CustomEvent('comanda:sede-changed', { detail: { sedeId: nextSedeId } }));
      await refreshProfile?.();
      window.location.assign(location.pathname === '/login' ? '/' : location.pathname);
    } catch (error) {
      console.error('No fue posible cambiar de sede', error);
      alert('No fue posible cambiar de sede.');
    } finally {
      setSwitchingSede(false);
    }
  };

  const abrirPedidos = () => {
    marcarTodasLeidas();
    setPanelOpen(false);
    navigate('/pedidos');
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="navbar-hamburger"
          onClick={onToggleSidebar}
          aria-label="Abrir menu lateral"
        >
          <FiMenu size={20} />
        </button>

        <div className="navbar-title-wrap">
          <h2 className="navbar-title">Panel de control</h2>
          <span className="navbar-subtitle">Operacion, configuracion e inteligencia comercial</span>
        </div>
      </div>

      <div className="navbar-right">
        <div className="navbar-status">
          <span className="navbar-status-dot" />
          <span className="navbar-status-text">Local abierto</span>
        </div>

        {sedesState.enabled && sedesState.sedes.length > 0 ? (
          <label className="navbar-branch-switcher">
            <span>Sede</span>
            <select
              value={user?.restauranteId || ''}
              onChange={cambiarSede}
              disabled={switchingSede || sedesState.loading}
            >
              {sedesState.sedes.map((sede) => (
                <option key={sede.id} value={sede.id}>
                  {sede.sede_nombre || sede.nombre}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <button
          type="button"
          className="navbar-theme-toggle"
          onClick={toggleTheme}
          aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          <span className="navbar-theme-toggle__icon">
            {isDark ? <FiSun size={15} /> : <FiMoon size={15} />}
          </span>
          <span className="navbar-theme-toggle__text">
            {isDark ? 'Modo claro' : 'Modo oscuro'}
          </span>
        </button>

        {unreadCount > 0 && (
          <button type="button" className="navbar-live-orders" onClick={abrirPedidos}>
            <span className="navbar-live-orders__pulse" />
            <span className="navbar-live-orders__text">
              {unreadCount === 1 ? '1 pedido nuevo' : `${unreadCount} pedidos nuevos`}
            </span>
          </button>
        )}

        <div className="navbar-alerts" ref={alertsRef}>
          <button
            type="button"
            className={`navbar-alerts-button ${panelOpen ? 'is-open' : ''}`}
            onClick={() => setPanelOpen((prev) => !prev)}
            aria-label="Abrir centro de avisos"
            aria-expanded={panelOpen}
          >
            <span className="navbar-alerts-button__icon">Avisos</span>
            {unreadCount > 0 ? (
              <span className="navbar-alerts-button__badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </button>

          <PedidosNotificationsPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
        </div>

        <div className="navbar-user-box">
          <span className="navbar-user-name">{user?.nombre || 'Usuario'}</span>
          <div className="navbar-avatar">{(user?.nombre || 'U').charAt(0)}</div>
        </div>

        <button type="button" className="navbar-logout" onClick={logout}>
          <span className="navbar-logout-text">Cerrar sesion</span>
          <span className="navbar-logout-icon">Salir</span>
        </button>
      </div>
    </header>
  );
}
