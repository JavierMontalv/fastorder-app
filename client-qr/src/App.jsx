// ===================================================================
// 📌 App.jsx – FASTORDER QR Client (2026)
// -------------------------------------------------------------------
// Rutas estilo UberEats / Rappi QR:
//  • Menu
//  • Plato
//  • Carrito
//  • Confirmar Pedido
//  • Estado del Pedido
//
// Incluye layout móvil y animaciones suaves.
// ===================================================================

import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Menu from "./pages/Menu";
import Plato from "./pages/Plato";
import Carrito from "./pages/Carrito";
import ConfirmarPedido from "./pages/ConfirmarPedido";
import EstadoPedido from "./pages/EstadoPedido";

export default function App() {
  const location = useLocation();

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Animación entre pantallas */}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Menu />} />

          {/* Detalle del plato */}
          <Route path="/plato/:id" element={<PlatoWrapper />} />

          {/* Carrito */}
          <Route path="/carrito" element={<Carrito />} />

          {/* Confirmación */}
          <Route path="/confirmar" element={<ConfirmarPedido />} />

          {/* Estado del pedido */}
          <Route path="/estado/:id" element={<EstadoPedido />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

/**
 * Wrapper para pasar funciones al Plato y permitir agregar al carrito
 */
import { useCarrito } from "./context/CarritoContext";

function PlatoWrapper() {
  const { agregar } = useCarrito();
  return <Plato onAgregar={agregar} />;
}
