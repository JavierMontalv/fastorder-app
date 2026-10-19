// src/components/TablaTransacciones.jsx
// ======================================================================
// 💰 TablaTransacciones – COMANDA Enterprise 2026
// Tabla profesional para visualizar el historial de ventas / transacciones
// Compatible con analítica, dashboard y módulo financiero.
// ======================================================================

import "../styles/TablaTransacciones.css";

export default function TablaTransacciones({ transacciones = [] }) {

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    const d = new Date(fecha);
    return d.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatearValor = (valor) =>
    valor?.toLocaleString("es-CO") || "0";

  return (
    <div className="tabla-transacciones-card">
      <h3 className="tabla-transacciones-titulo">Historial de transacciones</h3>

      <div className="tabla-transacciones-wrapper">
        <table className="tabla-transacciones">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Cliente / Mesa</th>
              <th>Método de pago</th>
              <th>Total</th>
              <th>Estado pago</th>
            </tr>
          </thead>

          <tbody>
            {transacciones.length === 0 ? (
              <tr>
                <td colSpan="6" className="tabla-vacia">
                  No hay transacciones registradas.
                </td>
              </tr>
            ) : (
              transacciones.map((t) => (
                <tr key={t.id}>
                  <td className="tx-id">#{t.id}</td>
                  <td>{formatearFecha(t.createdAt)}</td>

                  <td className="tx-cliente">
                    {t.mesaId ? `Mesa ${t.mesaId}` : "Pedido externo"}
                  </td>

                  <td className="tx-metodo">
                    {t.metodoPago === "efectivo" && "💵 Efectivo"}
                    {t.metodoPago === "nequi" && "📱 Nequi"}
                    {t.metodoPago === "daviplata" && "📱 Daviplata"}
                    {t.metodoPago === "tarjeta" && "💳 Tarjeta"}
                    {t.metodoPago === "transferencia" && "🏦 Transferencia"}
                    {t.metodoPago === "sin_pago" && "⚠️ Sin pago"}
                  </td>

                  <td className="tx-total">
                    ${formatearValor(t.total)}
                  </td>

                  <td>
                    {t.pagado ? (
                      <span className="estado-pagado">✔ Pagado</span>
                    ) : (
                      <span className="estado-pendiente">Pendiente</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
