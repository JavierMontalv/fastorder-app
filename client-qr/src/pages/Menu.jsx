// ===================================================================
// 🍽️ Menu.jsx – FASTORDER (Enterprise 2026)
// -------------------------------------------------------------------
// Pantalla principal del menú estilo UberEats / Rappi:
//  • Tabs de categorías
//  • Productos dinámicos
//  • Carrito flotante
//  • Animaciones premium
// ===================================================================

import { useState, useEffect } from "react";
import CategoriaTabs from "../components/CategoriaTabs";
import TarjetaPlato from "../components/TarjetaPlato";
import FloatingCart from "../components/FloatingCart";
import { motion } from "framer-motion";

export default function Menu() {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);

  // ================================================================
  // 🛒 Agregar al carrito
  // ================================================================
  const agregarAlCarrito = (plato) => {
    setCarrito((prev) => {
      const existe = prev.find((p) => p.id === plato.id);
      if (existe) {
        return prev.map((p) =>
          p.id === plato.id ? { ...p, cantidad: p.cantidad + 1 } : p
        );
      }
      return [...prev, { ...plato, cantidad: 1 }];
    });
  };

  // ================================================================
  // 🧽 Quitar del carrito
  // ================================================================
  const quitarDelCarrito = (platoId) => {
    setCarrito((prev) =>
      prev
        .map((p) =>
          p.id === platoId ? { ...p, cantidad: p.cantidad - 1 } : p
        )
        .filter((p) => p.cantidad > 0)
    );
  };

  // ================================================================
  // 📦 Se ejecuta cuando CategoriaTabs carga productos
  // ================================================================
  const handleProductosCargados = (lista) => {
    setProductos(lista);
  };

  // ================================================================
  // 🎨 Render UI principal
  // ================================================================
  return (
    <div className="pb-24 max-w-lg mx-auto">
      {/* Header simple */}
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold">Menú</h1>
        <p className="text-gray-500 text-sm">Selecciona un plato para ordenar</p>
      </div>

      {/* Tabs de categorías */}
      <CategoriaTabs onProductosCargados={handleProductosCargados} />

      {/* Lista de productos */}
      <motion.div
        className="mt-4 grid grid-cols-1 gap-4 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {productos.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            No hay productos disponibles en esta categoría.
          </p>
        ) : (
          productos.map((plato) => (
            <TarjetaPlato
              key={plato.id}
              plato={plato}
              onAgregar={() => agregarAlCarrito(plato)}
            />
          ))
        )}
      </motion.div>

      {/* Carrito flotante */}
      {carrito.length > 0 && (
        <FloatingCart carrito={carrito} onQuitar={quitarDelCarrito} />
      )}
    </div>
  );
}
