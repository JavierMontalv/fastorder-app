// ===================================================================
// ✅ ConfirmarPedido.jsx – FASTORDER (Enterprise 2026)
// -------------------------------------------------------------------
// Pantalla de confirmación al estilo Uber Eats / Rappi:
//  • Resumen de items
//  • Información del restaurante o mesa
//  • Nota opcional del cliente
//  • Total dinámico
//  • Botón de Confirmar Pedido profesional
// ===================================================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function ConfirmarPedido({
  items = [],
  mesa = null,               // mesa seleccionada si aplica
  restaurante = null,        // info del restaurante (nombre, logo, etc.)
  onConfirmar,               // callback para enviar pedido al backend
  onCancelar,                // cerrar vista
}) {
  const [total, setTotal] = useState(0);
  const [nota, setNota] = useState("");

  // ================================================================
  // 📌 Calcular total del pedido
  // ================================================================
  useEffect(() => {
    const t = items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
    setTotal(t);
  }, [items]);

  // ================================================================
  // 🚀 Confirmar pedido
  // ================================================================
  const confirmar = () => {
    const payload = {
      mesaId: mesa?.id || null,
      nota,
      items: items.map((i) => ({
        productoId: i.id,
        cantidad: i.cantidad,
      })),
    };

    onConfirmar(payload);
  };

  // ================================================================
  // 🎨 Render UI
  // ================================================================
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-white z-50 p-4 flex flex-col"
    >
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Confirmar pedido</h2>

        <button
          onClick={onCancelar}
          className="text-gray-500 hover:text-black text-lg"
        >
          ✕
        </button>
      </div>

      {/* Restaurante */}
      {restaurante && (
        <div className="flex items-center gap-3 mb-4">
          <img
            src={restaurante.logoUrl}
            alt="logo"
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-gray-900">{restaurante.nombre}</p>
            <p className="text-gray-500 text-sm">{restaurante.direccion}</p>
          </div>
        </div>
      )}

      {/* Mesa */}
      {mesa && (
        <div className="bg-gray-100 p-3 rounded-lg mb-4">
          <p className="text-gray-700">
            Mesa seleccionada: <span className="font-semibold">{mesa.nombre || mesa.numero}</span>
          </p>
        </div>
      )}

      {/* Lista de productos */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">

        {items.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center border-b pb-2"
          >
            <div>
              <p className="font-medium text-gray-900">
                {item.nombre} × {item.cantidad}
              </p>
              <p className="text-gray-500 text-sm">${item.precio.toLocaleString()}</p>
            </div>

            <p className="font-semibold text-gray-900">
              ${(item.precio * item.cantidad).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Nota */}
      <div className="mt-4 mb-4">
        <label className="text-gray-700 text-sm font-medium">Nota opcional</label>
        <textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          maxLength={300}
          placeholder="Ej: sin cebolla, muy picante, poco dulce…"
          className="w-full mt-1 border rounded-lg p-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {/* Total */}
      <div className="flex justify-between items-center text-lg font-semibold mb-4">
        <span>Total a pagar</span>
        <span>${total.toLocaleString()}</span>
      </div>

      {/* Botón confirmar */}
      <button
        onClick={confirmar}
        className="w-full py-3 bg-black text-white rounded-xl text-lg font-semibold
        hover:bg-gray-900 active:scale-95 transition-all"
      >
        Confirmar pedido
      </button>
    </motion.div>
  );
}
