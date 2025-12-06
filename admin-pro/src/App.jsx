// src/App.jsx
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';

// Páginas
import Categorias from './pages/Categorias';
import Dashboard from './pages/Dashboard';
import Pedidos from './pages/Pedidos';
import Productos from './pages/Productos';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout general */}
        <Route path="/" element={<DashboardLayout />}>
          {/* Rutas internas del panel */}
          <Route index element={<Dashboard />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="productos" element={<Productos />} />
          <Route path="pedidos" element={<Pedidos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
