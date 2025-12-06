// ===================================================================
// 🛒 Carrito.jsx – FASTORDER (Enterprise 2026)
// -------------------------------------------------------------------
// Carrito estilo Uber Eats / Rappi:
//  • Lista editable de ítems
//  • Control de cantidades
//  • Total dinámico
//  • Botón de pago fijo
//  • Animaciones suaves (Framer Motion-ready)
// ===================================================================

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Carrito({ items, onUpdateQty, onRemoveItem, onCheckout }) {
  const [total, setTotal] = useState(0);

  // ================================================================
  // 💰 Recalcular total
  // ================================================================
  useEffect(() => {
    const t = items.reduce(
      (acc, it) => acc + it.precio * it.cantidad,
      0
    );
    setTotal(t);
  }, [items]);

  // ================================================================
  // 🧮 Manejar cantidades
  // ================================================================
  const incrementar = (id) => {
    const item = items.find((it) => it.id === id);
    onUpdateQty(id, item.cantidad + 1);
  };

  const disminuir = (id) => {
    const item = items.find((it) => it.id === id);
    if (item.cantidad > 1) {
      onUpdateQty(id, item.cantidad - 1);
    } else {
      onRemoveItem(id);
    }
  };

  // ================================================================
  // 🎨 Render
  // ================================================================
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/50 z-50 flex justify-end">
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="w-full max-w-md h-full bg-white p-4 flex flex-col shadow-2xl rounded-l-2xl"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Tu pedido</h2>
          <button
            className="text-gray-500 hover:text-black text-lg"
            onClick={() => onCheckout("close")}
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          <AnimatePresence>
            {items.length === 0 && (
              <p className="text-gray-500 text-center mt-10 animate-pulse">
                Tu carrito está vacío
              </p>
            )}

            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="border rounded-lg p-3 flex gap-3 bg-gray-50"
              >
                {/* Imagen */}
                <img
                  src={item.imagenUrl}
                  alt={item.nombre}
                  className="w-20 h-20 object-cover rounded-md"
                />

                {/* Info */}
                <div className="flex flex-col flex-1">
                  <p className="font-semibold text-sm">{item.nombre}</p>
                  <p className="text-gray-600 text-sm">${item.precio}</p>

                  {/* Controles */}
                  <div className="flex items-center mt-auto gap-3">
                    <button
                      onClick={() => disminuir(item.id)}
                      className="w-7 h-7 flex justify-center items-center bg-gray-200 rounded-full"
                    >
                      −
                    </button>

                    <span className="text-sm font-medium">{item.cantidad}</span>

                    <button
                      onClick={() => incrementar(item.id)}
                      className="w-7 h-7 flex justify-center items-center bg-black text-white rounded-full"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Eliminar */}
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Quitar
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer / Total */}
        <div className="mt-4 border-t pt-4">
          <div className="flex justify-between text-lg font-semibold mb-3">
            <span>Total</span>
            <span>${total.toLocaleString()}</span>
          </div>

          <button
            onClick={() => onCheckout("pay")}
            disabled={items.length === 0}
            className={`w-full py-3 rounded-xl text-white text-lg font-semibold transition-all
            ${
              items.length === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-black hover:bg-gray-900 active:scale-95"
            }`}
          >
            Proceder al pago
          </button>
        </div>
      </motion.div>
    </div>
  );
}
