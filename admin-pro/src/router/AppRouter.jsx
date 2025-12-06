// src/router/AppRouter.jsx
import { createBrowserRouter } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';

import Categorias from '../pages/Categorias';
import Dashboard from '../pages/Dashboard';
import Pedidos from '../pages/Pedidos';
import Productos from '../pages/Productos';
import Restaurante from '../pages/Restaurante';
import Usuarios from '../pages/Usuarios';

import ProtectedRoute from '../components/auth/ProtectedRoute';
import Login from '../pages/Login';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },

  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'categorias', element: <Categorias /> },
      { path: 'productos', element: <Productos /> },
      { path: 'pedidos', element: <Pedidos /> },
      { path: 'usuarios', element: <Usuarios /> },
      { path: 'restaurante', element: <Restaurante /> }
    ]
  }
]);
