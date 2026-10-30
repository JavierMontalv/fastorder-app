import { useContext, useEffect, useRef } from 'react';
import {
  FiBarChart2,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiCpu,
  FiGrid,
  FiHome,
  FiLayers,
  FiMessageSquare,
  FiPackage,
  FiCreditCard,
  FiPlusCircle,
  FiSettings,
  FiShield,
  FiShoppingBag,
  FiTarget,
  FiUsers,
  FiX
} from 'react-icons/fi';
import { NavLink } from 'react-router-dom';

import { AuthContext } from '../context/AuthContext';
import { useIAContext } from '../context/IAContext';
import { usePlanContext } from '../context/PlanContext';
import { esUsuarioManager, obtenerCapacidadesUsuario } from '../utils/operationalAccess';
import '../styles/Sidebar.css';

export default function Sidebar({
  abierto,
  onToggle,
  esMovil = false,
  mobileOpen = false,
  onCloseMobile
}) {
  const sidebarRef = useRef(null);
  const { user } = useContext(AuthContext);
  const { planAllowsAI, cargandoEstadoIA } = useIAContext();
  const { featureEnabled } = usePlanContext();

  const capacidades = obtenerCapacidadesUsuario(user);
  const esSuperadmin = user?.rol === 'superadmin';
  const esManager = esUsuarioManager(user);
  const puedeGestionarEquipo = Boolean(esManager && !esSuperadmin && user?.restauranteId);
  const toggleSidebar = () => onToggle?.();
  const handleNavigation = () => {
    if (esMovil) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      onCloseMobile?.();
    }
  };

  useEffect(() => {
    if (!esMovil || mobileOpen) return;

    const sidebar = sidebarRef.current;
    const activeElement = document.activeElement;

    if (sidebar instanceof HTMLElement && activeElement instanceof HTMLElement && sidebar.contains(activeElement)) {
      activeElement.blur();
    }
  }, [esMovil, mobileOpen]);

  const linkClass = ({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link');

  const tooltipProps = (label) =>
    !abierto && !esMovil
      ? {
          title: label,
          'aria-label': label
        }
      : {};

  return (
    <aside
      ref={sidebarRef}
      className={`sidebar ${abierto ? 'abierto' : 'cerrado'} ${esMovil ? 'sidebar-mobile-shell' : ''} ${
        esMovil ? (mobileOpen ? 'movil-abierto' : 'movil-cerrado') : ''
      }`}
      aria-hidden={esMovil ? !mobileOpen : false}
      inert={esMovil && !mobileOpen ? '' : undefined}
    >
      <button
        type="button"
        className="sidebar-toggle"
        onClick={toggleSidebar}
        title={esMovil ? 'Cerrar menu' : abierto ? 'Cerrar menu' : 'Abrir menu'}
        aria-label={esMovil ? 'Cerrar menu' : abierto ? 'Cerrar menu' : 'Abrir menu'}
      >
        {esMovil ? <FiX size={15} /> : abierto ? <FiChevronLeft size={15} /> : <FiChevronRight size={15} />}
      </button>

      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img className="sidebar-logo-icon" src="/brand/comanda-icon.png" alt="Comanda" />

          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">Comanda</span>
            <span className="sidebar-logo-subtitle">Panel empresarial</span>
          </div>
        </div>

        <div className="sidebar-badge">
          <span className="sidebar-badge-dot" />
          <span className="sidebar-badge-text">En linea</span>
        </div>
      </div>

      {abierto && <div className="sidebar-section-label">Inicio</div>}

      <nav className="sidebar-menu">
        {['admin','owner'].includes(user?.rol) && <NavLink to="/pagos?modo=mensualidad" className={linkClass} onClick={handleNavigation} {...tooltipProps('Pagar mensualidad')}><FiCreditCard /><span>Pagar mensualidad</span></NavLink>}

        {capacidadadesToBool(capacidades?.puedeVerDashboard) && (
          <SidebarLink
            to="/"
            end
            className={linkClass}
            tooltipProps={tooltipProps('Panel')}
            onClick={handleNavigation}
            icon={<FiHome size={17} />}
            abierto={abierto}
            label="Panel"
            helper="Vista general del negocio"
          />
        )}

      </nav>

      {abierto && <div className="sidebar-section-label">Operacion</div>}

      <nav className="sidebar-menu">
        {capacidadadesToBool(capacidades?.puedeVerPedidos) && featureEnabled('pedidos_qr') && (
          <SidebarLink
            to="/pedidos"
            className={linkClass}
            tooltipProps={tooltipProps('Pedidos')}
            onClick={handleNavigation}
            icon={<FiPackage size={17} />}
            abierto={abierto}
            label="Pedidos"
            helper={
              capacidadadesToBool(capacidades?.puedeEditarEstadoPedido)
                ? 'Ordena, controla y entrega'
                : 'Lectura operativa del servicio'
            }
          />
        )}

        {capacidadadesToBool(capacidades?.puedeConfigurarLocal) && featureEnabled('pedidos_qr') && (
          <SidebarLink
            to="/reservas"
            className={linkClass}
            tooltipProps={tooltipProps('Reservas')}
            onClick={handleNavigation}
            icon={<FiCalendar size={17} />}
            abierto={abierto}
            label="Reservas"
            helper="Agenda y ocupacion"
          />
        )}

      </nav>

      {capacidadadesToBool(capacidades?.puedeGestionarCatalogo) && abierto && (
        <div className="sidebar-section-label">Carta y ventas</div>
      )}

      <nav className="sidebar-menu">
        {capacidadadesToBool(capacidades?.puedeGestionarCatalogo) && (
          <>
            <SidebarLink
              to="/productos"
              className={linkClass}
              tooltipProps={tooltipProps('Productos')}
              onClick={handleNavigation}
              icon={<FiShoppingBag size={17} />}
              abierto={abierto}
              label="Productos"
              helper="Carta y disponibilidad"
            />
            <SidebarLink
              to="/categorias"
              className={linkClass}
              tooltipProps={tooltipProps('Categorias')}
              onClick={handleNavigation}
              icon={<FiLayers size={17} />}
              abierto={abierto}
              label="Categorias"
              helper="Orden de la carta"
            />
            {featureEnabled('promociones') && (
              <SidebarLink
                to="/promociones"
                className={linkClass}
                tooltipProps={tooltipProps('Promociones')}
                onClick={handleNavigation}
                icon={<FiTarget size={17} />}
                abierto={abierto}
                label="Promociones"
                helper="Campanas y banners"
              />
            )}
          </>
        )}
      </nav>

      {capacidadadesToBool(capacidades?.puedeVerAnaliticas) && abierto && (
        <div className="sidebar-section-label">Inteligencia</div>
      )}

      <nav className="sidebar-menu">
        {capacidadadesToBool(capacidades?.puedeVerAnaliticas) && featureEnabled('analytics_avanzado') && (
          <SidebarLink
            to="/analiticas"
            className={linkClass}
            tooltipProps={tooltipProps('Analitica')}
            onClick={handleNavigation}
            icon={<FiBarChart2 size={17} />}
            abierto={abierto}
            label="Analitica"
            helper="Ventas y metricas"
          />
        )}
        {capacidadadesToBool(capacidades?.puedeVerAnaliticas) && (
          <SidebarLink
            to="/auditoria"
            className={linkClass}
            tooltipProps={tooltipProps('Auditoria')}
            onClick={handleNavigation}
            icon={<FiShield size={17} />}
            abierto={abierto}
            label="Auditoria"
            helper="Cambios y responsables"
          />
        )}
      </nav>

      {(capacidadadesToBool(capacidades?.puedeConfigurarLocal)
        || puedeGestionarEquipo
        || esSuperadmin) && abierto && <div className="sidebar-section-label">Administracion</div>}

      <nav className="sidebar-menu">
        {capacidadadesToBool(capacidades?.puedeConfigurarLocal) && (
          <SidebarLink
            to="/configuracion"
            className={linkClass}
            tooltipProps={tooltipProps('Configuracion')}
            onClick={handleNavigation}
            icon={<FiSettings size={17} />}
            abierto={abierto}
            label="Configuracion"
            helper="Datos y ajustes"
          />
        )}

        {puedeGestionarEquipo && (
          <SidebarLink
            to="/usuarios"
            className={linkClass}
            tooltipProps={tooltipProps('Usuarios')}
            onClick={handleNavigation}
            icon={<FiUsers size={17} />}
            abierto={abierto}
            label="Usuarios"
            helper="Equipo, roles y cupos"
          />
        )}

        {capacidadadesToBool(capacidades?.puedeUsarSoporteIA) && (
          <NavLink
            to="/soporte-ia"
            className={({ isActive }) =>
              planAllowsAI || cargandoEstadoIA
                ? linkClass({ isActive })
                : 'sidebar-link sidebar-link-disabled'
            }
            {...tooltipProps(planAllowsAI || cargandoEstadoIA ? 'Soporte IA' : 'Soporte IA bloqueado por plan')}
            onClick={(event) => {
              if (!planAllowsAI && !cargandoEstadoIA) {
                event.preventDefault();
                return;
              }
              handleNavigation();
            }}
          >
            <span className="sidebar-link-icon"><FiCpu size={17} /></span>
            {abierto && (
              <span className="sidebar-link-content">
                <span className="sidebar-link-label">Soporte IA</span>
                <span className="sidebar-link-helper">
                  {planAllowsAI || cargandoEstadoIA ? 'Asistente Comanda' : 'Disponible en plan IA'}
                </span>
              </span>
            )}
          </NavLink>
        )}
      </nav>

      {esSuperadmin && (
        <>
          {abierto && <div className="sidebar-section-label">SuperAdmin</div>}

          <nav className="sidebar-menu">
            <SidebarLink
              to="/superadmin/restaurantes"
              className={linkClass}
              tooltipProps={tooltipProps('Restaurantes')}
              onClick={handleNavigation}
              icon={<FiGrid size={17} />}
              abierto={abierto}
              label="Restaurantes"
              helper="Gestion SaaS"
            />

            <SidebarLink
              to="/superadmin/restaurantes/nuevo"
              className={linkClass}
              tooltipProps={tooltipProps('Crear restaurante')}
              onClick={handleNavigation}
              icon={<FiPlusCircle size={17} />}
              abierto={abierto}
              label="Crear restaurante"
              helper="Alta de cliente"
            />

            <SidebarLink
              to="/superadmin/solicitudes-comerciales"
              className={linkClass}
              tooltipProps={tooltipProps('Solicitudes comerciales')}
              onClick={handleNavigation}
              icon={<FiCreditCard size={17} />}
              abierto={abierto}
              label="Solicitudes"
              helper="Planes y pagos"
            />

            <SidebarLink
              to="/superadmin/usuarios"
              className={linkClass}
              tooltipProps={tooltipProps('Usuarios')}
              onClick={handleNavigation}
              icon={<FiUsers size={17} />}
              abierto={abierto}
              label="Usuarios"
              helper="Acceso y asociaciones"
            />
          </nav>
        </>
      )}

      {abierto && (
        <div className="sidebar-footer">
          <div className="sidebar-footer-card">
            <div className="sidebar-footer-icon"><FiMessageSquare size={18} /></div>
            <p className="sidebar-footer-title">Necesitas ayuda?</p>
            <p className="sidebar-footer-text">Soporte Comanda Premium</p>

            <button
              type="button"
              className="sidebar-footer-button"
              onClick={() => window.open('https://comanda.soporte', '_blank', 'noopener,noreferrer')}
            >
              Hablar con soporte
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

function SidebarLink({ to, end, className, tooltipProps, onClick, icon, abierto, label, helper }) {
  return (
    <NavLink to={to} end={end} className={className} {...tooltipProps} onClick={onClick}>
      <span className="sidebar-link-icon">{icon}</span>
      {abierto && (
        <span className="sidebar-link-content">
          <span className="sidebar-link-label">{label}</span>
          <span className="sidebar-link-helper">{helper}</span>
        </span>
      )}
    </NavLink>
  );
}

function capacidadadesToBool(value) {
  return Boolean(value);
}
