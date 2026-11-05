import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const money = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value || 0));
const number = (value) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 }).format(Number(value || 0));

function base(title, subtitle) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  doc.setFillColor(12, 44, 69);
  doc.rect(0, 0, 216, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('COMANDA', 14, 12);
  doc.setFontSize(12);
  doc.text(title, 14, 20);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(subtitle, 14, 34);
  doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, 202, 34, { align: 'right' });
  return doc;
}

function finish(doc, filename) {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 267, 202, 267);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Reporte operativo - datos del restaurante autenticado', 14, 272);
    doc.text(`Pagina ${page} de ${pages}`, 202, 272, { align: 'right' });
  }
  doc.save(filename);
}

const tableTheme = {
  startY: 40,
  theme: 'grid',
  styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2.2, textColor: [30, 41, 59] },
  headStyles: { fillColor: [225, 235, 243], textColor: [12, 44, 69], fontStyle: 'bold' },
  alternateRowStyles: { fillColor: [248, 250, 252] },
  margin: { left: 14, right: 14, bottom: 18 }
};

export function pdfInventario(items = []) {
  const doc = buildInventoryPdf(items);
  finish(doc, `comanda-inventario-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function buildInventoryPdf(items = []) {
  const doc = base('Consulta integral de articulos', 'Existencias, costo unitario, valor y estado actual');
  autoTable(doc, { ...tableTheme, head: [['Articulo', 'Seccion', 'Unidad', 'Existencia', 'Minimo', 'Costo/U', 'Valor', 'Estado']], body: items.map((item) => [item.nombre, item.seccion || item.categoria || '-', item.unidad, number(item.stockActual), number(item.stockMinimo), money(item.costoUnitario), money(Number(item.stockActual) * Number(item.costoUnitario || 0)), item.estadoStock]) });
  return doc;
}

export function pdfEntrada(entrada) {
  const doc = buildEntryPdf(entrada);
  finish(doc, `comanda-entrada-${entrada.consecutivo}.pdf`);
}

export function buildEntryPdf(entrada) {
  const doc = base('Entrada de mercancia', `${entrada.consecutivo} | Proveedor: ${entrada.proveedor || 'No informado'} | Factura: ${entrada.factura || 'No informada'}`);
  autoTable(doc, { ...tableTheme, head: [['Articulo', 'Cantidad', 'Unidad', 'Lote', 'Vence', 'Costo/U', 'Subtotal']], body: (entrada.lineas || []).map((linea) => [linea.item?.nombre || `Item ${linea.itemId}`, number(linea.cantidad), linea.item?.unidad || '-', linea.lote || '-', linea.venceEl || '-', money(linea.costoUnitario), money(linea.subtotal)]), foot: [['', '', '', '', '', 'Total entrada', money(entrada.total)]] });
  return doc;
}

export function pdfTransformaciones(rows = []) {
  const doc = buildTransformationsPdf(rows);
  finish(doc, `comanda-transformaciones-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function buildTransformationsPdf(rows = []) {
  const doc = base('Transformacion y porcionamiento', 'Rendimiento, merma, porciones y costo resultante');
  autoTable(doc, { ...tableTheme, head: [['Consecutivo', 'Origen', 'Bruto', 'Merma', 'Neto', 'Porciones', 'Peso/porcion', 'Rendimiento', 'Costo/porcion']], body: rows.map((row) => [row.consecutivo, row.origen?.nombre || row.itemOrigenId, number(row.cantidadBruta), number(row.merma), number(row.cantidadNeta), row.porciones, number(row.pesoPorPorcion), `${number(row.rendimientoPorcentaje)}%`, money(row.costoPorPorcion)]) });
  return doc;
}
