import { useEffect, useMemo, useState } from 'react';
import { FiBox, FiDownload, FiRepeat, FiTruck } from 'react-icons/fi';
import {
  obtenerEntradasMercancia,
  obtenerItemsInventario,
  obtenerMovimientosInventario,
  obtenerTransformaciones
} from '../services/inventarioService';
import { pdfEntrada, pdfInventario, pdfTransformaciones } from '../utils/inventoryPdf';
import '../styles/InventarioOperaciones.css';

export default function Reportes() {
  const [data, setData] = useState({ items: [], movimientos: [], entradas: [], transformaciones: [] });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([obtenerItemsInventario(), obtenerMovimientosInventario(100), obtenerEntradasMercancia(), obtenerTransformaciones()])
      .then(([items, movimientos, entradas, transformaciones]) => setData({ items, movimientos, entradas, transformaciones }))
      .finally(() => setLoading(false));
  }, []);
  const valor = useMemo(() => data.items.reduce((sum, item) => sum + Number(item.stockActual || 0) * Number(item.costoUnitario || 0), 0), [data.items]);
  const cards = [
    { id: 'inventario', icon: <FiBox />, title: 'Consulta integral de articulos', desc: 'Existencias, unidades, minimos, costo y valorizacion actual.', meta: `${data.items.length} articulos`, action: () => pdfInventario(data.items) },
    { id: 'entradas', icon: <FiTruck />, title: 'Entradas de mercancia', desc: 'Proveedor, factura, lotes, cantidades, costos y total recibido.', meta: `${data.entradas.length} entradas`, action: () => data.entradas[0] && pdfEntrada(data.entradas[0]), disabled: !data.entradas.length },
    { id: 'transformaciones', icon: <FiRepeat />, title: 'Transformacion y porcionamiento', desc: 'Peso bruto, merma, rendimiento, porciones y costo unitario resultante.', meta: `${data.transformaciones.length} procesos`, action: () => pdfTransformaciones(data.transformaciones), disabled: !data.transformaciones.length },
    { id: 'movimientos', icon: <FiDownload />, title: 'Bitacora valorizada', desc: 'Entradas, salidas y ajustes con responsable, motivo y referencia.', meta: `${data.movimientos.length} movimientos`, action: () => pdfInventario(data.items) }
  ];
  return <div className="page-container fadeIn reports-page"><div className="reports-hero"><div><span className="inv-kicker">Informacion para decidir</span><h1>Reportes</h1><p>Documentos claros construidos con la informacion que COMANDA ya controla.</p></div><div className="reports-value"><span>Valor estimado en bodega</span><strong>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor)}</strong></div></div>
    <div className="reports-notice"><strong>Reportes operativos, no contables.</strong><span>Sirven para control interno y conciliacion. La futura seccion Finanzas consolidara ventas, gastos, nomina e inventario.</span></div>
    <div className="reports-grid">{cards.map((card) => <article key={card.id} className="report-card"><div className="report-card__icon">{card.icon}</div><div className="report-card__copy"><span>{card.meta}</span><h2>{card.title}</h2><p>{card.desc}</p></div><button className="fo-btn fo-btn-outline" disabled={loading || card.disabled} onClick={card.action}><FiDownload /> Descargar PDF</button></article>)}</div>
  </div>;
}
