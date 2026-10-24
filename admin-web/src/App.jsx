import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import './App.css';
import './styles/DarkTheme.css';

import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import { AuthProvider } from './context/AuthContext';
import { IAProvider } from './context/IAContext';
import { PedidosNotificationsProvider } from './context/PedidosNotificationsContext';
import { PlanProvider } from './context/PlanContext';
import { ThemeProvider } from './context/ThemeContext';

import Analiticas from './pages/Analiticas';
import Auditoria from './pages/Auditoria';
import CambiarPassword from './pages/CambiarPassword';
import Categorias from './pages/Categorias';
import Inicio from './pages/Inicio';
import Configuracion from './pages/Configuracion';
import Dashboard from './pages/Dashboard';
import DisplayScreen from './pages/DisplayScreen';
import AdminLogin from './pages/AdminLogin';
import Onboarding from './pages/Onboarding';
import Pedidos from './pages/Pedidos';
import PlanCheckoutSuccess from './pages/PlanCheckoutSuccess';
import Productos from './pages/Productos';
import Promociones from './pages/Promociones';
import Reservas from './pages/Reservas';
import SoporteIA from './pages/SoporteIA';
import UsuariosEquipo from './pages/Usuarios';

import CrearRestaurante from './pages/superadmin/CrearRestaurante';
import Restaurantes from './pages/superadmin/Restaurantes';
import SolicitudesComerciales from './pages/superadmin/SolicitudesComerciales';
import UsuariosSuperadmin from './pages/superadmin/Usuarios';

function LegacyLogin() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const activation = params.has('plan') || params.get('modo') === 'activar';
  if (activation) params.set('modo', 'activar');
  return <Navigate to={`${activation ? '/inicio' : '/admin'}${params.size ? `?${params}` : ''}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <IAProvider>
            <PlanProvider>
              <PedidosNotificationsProvider>
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
                draggable
              />

              <Routes>
                <Route path="/inicio" element={<Inicio />} />
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/login" element={<LegacyLogin />} />
                <Route path="/cambiar-password" element={<CambiarPassword />} />
                <Route path="/descubre" element={<Navigate to="/inicio" replace />} />
                <Route path="/planes/gracias" element={<PlanCheckoutSuccess />} />
                <Route path="/display/:slug" element={<DisplayScreen />} />

                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute roles={['admin', 'owner', 'superadmin']}>
                      <Onboarding />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route
                    index
                    element={
                      <ProtectedRoute roles={['admin', 'owner', 'superadmin']}>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="pedidos"
                    element={
                      <ProtectedRoute roles={['admin', 'owner', 'staff', 'superadmin']}>
                        <Pedidos />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="productos"
                    element={
                      <ProtectedRoute roles={['admin', 'owner', 'superadmin']}>
                        <Productos />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="reservas"
                    element={
                      <ProtectedRoute roles={['admin', 'owner', 'superadmin']}>
                        <Reservas />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="promociones"
                    element={
                      <ProtectedRoute roles={['admin', 'owner', 'superadmin']}>
                        <Promociones />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="categorias"
                    element={
                      <ProtectedRoute roles={['admin', 'owner', 'superadmin']}>
                        <Categorias />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="configuracion"
                    element={
                      <ProtectedRoute roles={['admin', 'owner', 'superadmin']}>
                        <Configuracion />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="analiticas"
                    element={
                      <ProtectedRoute roles={['admin', 'owner', 'superadmin']}>
                        <Analiticas />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="auditoria"
                    element={
                      <ProtectedRoute roles={['admin', 'owner', 'superadmin']}>
                        <Auditoria />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="usuarios"
                    element={
                      <ProtectedRoute roles={['admin', 'owner']}>
                        <UsuariosEquipo />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="soporte-ia"
                    element={
                      <ProtectedRoute roles={['admin', 'owner', 'superadmin']}>
                        <SoporteIA />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="superadmin/restaurantes"
                    element={
                      <ProtectedRoute roles={['superadmin']}>
                        <Restaurantes />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="superadmin/restaurantes/nuevo"
                    element={
                      <ProtectedRoute roles={['superadmin']}>
                        <CrearRestaurante />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="superadmin/solicitudes-comerciales"
                    element={
                      <ProtectedRoute roles={['superadmin']}>
                        <SolicitudesComerciales />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="superadmin/usuarios"
                    element={
                      <ProtectedRoute roles={['superadmin']}>
                        <UsuariosSuperadmin />
                      </ProtectedRoute>
                    }
                  />
                </Route>
              </Routes>
              </PedidosNotificationsProvider>
            </PlanProvider>
          </IAProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
