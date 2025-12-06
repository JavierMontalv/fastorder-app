// ===================================================================
// 🏷️ CategoriaTabs.jsx – FASTORDER (Enterprise 2026)
// -------------------------------------------------------------------
// Tabs de categorías premium estilo Shopify / Rappi / UberEats:
//  • Scroll horizontal suave
//  • Indicador activo animado
//  • Productos cargados dinámicamente
//  • API totalmente integrada
//  • Corrección: productos vienen en data.items
// ===================================================================

import { useEffect, useState } from "react";
import { obtenerCategorias } from "../api/categoriaApi";
import { obtenerProductos } from "../api/productoApi";

export default function CategoriaTabs({ onProductosCargados }) {
  const [categorias, setCategorias] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [cargando, setCargando] = useState(false);

  // =====================================================
  // 🔁 Cargar categorías al iniciar
  // =====================================================
  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await obtenerCategorias({ estado: "activo" });

        // El backend de categorías devuelve:
        // { success, message, data: [...] }
        const lista = res?.data || [];

        setCategorias(lista);

        if (lista.length > 0) {
          const primera = lista[0].id;
          setCategoriaActiva(primera);
          cargarProductos(primera);
        }
      } catch (err) {
        console.error("❌ Error cargando categorías", err);
      }
    };

    cargar();
  }, []);

  // =====================================================
  // 📦 Cargar productos por categoría
  // =====================================================
  const cargarProductos = async (categoriaId) => {
    try {
      setCargando(true);

      const res = await obtenerProductos({
        categoriaId,
        estado: "activo",
        limit: 200,
      });

      // 🚨 Corrección: productos vienen en res.data.items
      const productos = res?.data?.items || [];

      onProductosCargados(productos);
    } catch (err) {
      console.error("❌ Error cargando productos", err);
    } finally {
      setCargando(false);
    }
  };

  // =====================================================
  // 🎯 Manejar selección de categoría
  // =====================================================
  const handleSelect = (id) => {
    if (cargando) return; // evita spam de clics
    setCategoriaActiva(id);
    cargarProductos(id);
  };

  // =====================================================
  // 🎨 Render de Tabs – UX premium 2026
  // =====================================================
  return (
    <div className="w-full">
      {/* Scroll horizontal estilo UberEats */}
      <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 px-1">
        {categorias.map((cat) => {
          const activa = categoriaActiva === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => handleSelect(cat.id)}
              aria-pressed={activa}
              aria-label={`Ver categoría ${cat.nombre}`}
              disabled={cargando}
              className={`
                px-4 py-2 rounded-full text-sm whitespace-nowrap
                transition-all duration-200 select-none
                ${
                  activa
                    ? "bg-black text-white shadow-md scale-105"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }
                ${cargando ? "opacity-70" : ""}
              `}
            >
              {cat.icono ? (
                <span className="mr-2 text-lg">{cat.icono}</span>
              ) : null}
              {cat.nombre}
            </button>
          );
        })}
      </div>

      {/* Loader elegante */}
      {cargando && (
        <div className="w-full text-center py-4 text-gray-500 animate-pulse">
          Cargando productos…
        </div>
      )}
    </div>
  );
}
