// ===================================================================
// 📡 EstadoPedido.jsx – FASTORDER (Enterprise 2026)
// -------------------------------------------------------------------
// Tracking de pedido en tiempo real estilo UberEats / Rappi:
//  • Barra de progreso animada
//  • Sockets para actualización en vivo
//  • Timeline visual de estados
//  • Resumen del pedido
// ===================================================================

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import io from "socket.io-client";

const socket = io(import.meta.env.VITE_API_URL, {
  transports: ["websocket"],
});

const ESTADOS = ["pendiente", "preparacion", "listo", "entregado"];

export default function EstadoPedido({ pedidoId, onVolver }) {
  const [pedido, setPedido] = useState(null);
  const [estadoActual, setEstadoActual] = useState("pendiente");

  // ================================================================
  // 🔌 Conectar socket y escuchar cambios
  // ================================================================
  useEffect(() => {
    socket.emit("pedido:join", pedidoId);

    socket.on("pedido:actualizado", (data) => {
      if (data.id === pedidoId) {
        setPedido(data);
        setEstadoActual(data.estado);
      }
    });

    return () => {
      socket.emit("pedido:leave", pedidoId);
      socket.off("pedido:actualizado");
    };
  }, [pedidoId]);

  // ================================================================
  // 📦 Cargar pedido inicial desde API
  // ================================================================
  useEffect(() => {
    const fetchPedido = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/pedidos/${pedidoId}`
        );
        const data = await res.json();

        setPedido(data?.data);
        setEstadoActual(data?.data?.estado || "pendiente");
      } catch (err) {
        console.error("Error cargando pedido", err);
      }
    };

    fetchPedido();
  }, [pedidoId]);

  if (!pedido) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Cargando pedido…
      </div>
    );
  }

  // ================================================================
  // 🎨 Render UI
  // ================================================================
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 max-w-md mx-auto"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Estado del Pedido</h2>

        <button
          onClick={onVolver}
          className="text-gray-500 hover:text-black text-lg"
        >
          ←
        </button>
      </div>

      {/* Estado principal */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-semibold capitalize">
          {estadoActual === "preparacion"
            ? "Preparando tu pedido…"
            : estadoActual === "listo"
            ? "Tu pedido está listo"
            : estadoActual === "entregado"
            ? "Pedido entregado"
            : "Pedido recibido"}
        </h3>

        <p className="text-gray-500 mt-1">
          {estadoActual === "pendiente" && "El restaurante recibió tu pedido."}
          {estadoActual === "preparacion" &&
            "El chef está preparando tu comida 🍳."}
          {estadoActual === "listo" && "Puedes recogerlo o está listo para entregar."}
          {estadoActual === "entregado" && "¡Gracias por tu compra! ❤️"}
        </p>
      </div>

      {/* Barra de progreso estilo Uber Eats */}
      <div className="relative mb-8">
        <div className="w-full h-2 bg-gray-200 rounded-full" />

        <motion.div
          className="h-2 bg-black rounded-full absolute top-0 left-0"
          initial={{ width: 0 }}
          animate={{
            width: `${
              (ESTADOS.indexOf(estadoActual) / (ESTADOS.length - 1)) * 100
            }%`,
          }}
          transition={{ duration: 0.6 }}
        />
      </div>

      {/* Timeline vertical */}
      <div className="space-y-6">
        {ESTADOS.map((estado, idx) => {
          const activo = ESTADOS.indexOf(estadoActual) >= idx;

          return (
            <div key={estado} className="flex items-start gap-3">
              <div
                className={`w-4 h-4 rounded-full mt-1 ${
                  activo ? "bg-black" : "bg-gray-300"
                }`}
              />
              <div>
                <p
                  className={`font-semibold capitalize ${
                    activo ? "text-black" : "text-gray-500"
                  }`}
                >
                  {estado}
                </p>
                <p className="text-sm text-gray-500">
                  {estado === "pendiente" && "Pedido recibido por el restaurante"}
                  {estado === "preparacion" && "Preparando tu orden"}
                  {estado === "listo" && "Listo para entregar o recoger"}
                  {estado === "entregado" && "Disfruta tu comida"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Items */}
      <div className="mt-8 border-t pt-4">
        <h4 className="font-semibold mb-3">Tu pedido</h4>

        {pedido.items?.map((item) => (
          <div
            key={item.id}
            className="flex justify-between mb-2 text-gray-700"
          >
            <span>
              {item.cantidad} × {item.producto?.nombre}
            </span>
            <span className="font-medium">
              ${(item.cantidad * item.producto.precio).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-4 text-right text-lg font-semibold">
        Total: ${pedido.total?.toLocaleString()}
      </div>

      {/* Botón */}
      {estadoActual === "entregado" && (
        <button
          onClick={onVolver}
          className="w-full mt-8 bg-black text-white py-3 rounded-xl text-lg font-semibold"
        >
          Volver al inicio
        </button>
      )}
    </motion.div>
  );
}
