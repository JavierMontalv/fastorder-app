// ===================================================================
// 🍽️ Plato.jsx – FASTORDER (Enterprise 2026)
// -------------------------------------------------------------------
// Vista individual estilo Uber Eats / Rappi Food:
//  • Foto hero
//  • Precio grande
//  • Descripción elegante
//  • Control de cantidad
//  • Botón fijo “Agregar al carrito”
// ===================================================================

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { obtenerProductoPorId } from "../api/productoApi";
import { motion } from "framer-motion";

export default function Plato({ onAgregar }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [plato, setPlato] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [cargando, setCargando] = useState(true);

  // ================================================================
  // 🔁 Cargar plato desde API
  // ================================================================
  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await obtenerProductoPorId(id);
        setPlato(res?.data);
      } catch (err) {
        console.error("Error cargando plato", err);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id]);

  // ================================================================
  // 🎨 Render cargando
  // ================================================================
  if (cargando) {
    return (
      <div className="text-center py-24 text-gray-500 animate-pulse">
        Cargando plato…
      </div>
    );
  }

  if (!plato) {
    return (
      <div className="text-center py-24 text-gray-400">
        Plato no encontrado
      </div>
    );
  }

  // ================================================================
  // 🎨 Render principal
  // ================================================================
  return (
    <div className="pb-28 max-w-lg mx-auto">

      {/* Imagen HERO */}
      <motion.div
        className="relative w-full h-64 overflow-hidden rounded-b-3xl shadow-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <img
          src={plato.imagenUrl}
          alt={plato.nombre}
          className="w-full h-full object-cover"
        />

        {/* Botón atrás */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm"
        >
          ← Atrás
        </button>
      </motion.div>

      {/* Info */}
      <motion.div
        className="p-5 space-y-3"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-2xl font-bold">{plato.nombre}</h1>

        <div className="text-xl font-semibold text-black">
          ${plato.precio.toLocaleString()}
        </div>

        {plato.descripcion && (
          <p className="text-gray-600 leading-relaxed">
            {plato.descripcion}
          </p>
        )}
      </motion.div>

      {/* Cantidad */}
      <motion.div
        className="px-5 pb-5 flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="font-medium text-gray-700">Cantidad</span>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCantidad((c) => Math.max(1, c - 1))}
            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"
          >
            -
          </button>

          <span className="text-lg font-medium">{cantidad}</span>

          <button
            onClick={() => setCantidad((c) => c + 1)}
            className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center"
          >
            +
          </button>
        </div>
      </motion.div>

      {/* Botón agregar */}
      <motion.button
        onClick={() => onAgregar({ ...plato, cantidad })}
        className="fixed bottom-0 left-0 w-full bg-black text-white py-4 text-lg font-semibold shadow-lg rounded-t-2xl"
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
      >
        Agregar • ${(plato.precio * cantidad).toLocaleString()}
      </motion.button>
    </div>
  );
}
