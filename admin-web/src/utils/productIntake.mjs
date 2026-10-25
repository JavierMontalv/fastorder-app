export const INTAKE_MAX = 4;
export function intakeError(row) {
  if (!row.nombre.trim()) return 'Completa el nombre.';
  if (!Number.isInteger(Number(row.precio)) || Number(row.precio) <= 0) return 'Escribe un precio mayor que cero, sin puntos ni comas.';
  if (!row.categoriaId) return 'Selecciona una categoría.';
  return '';
}
export function applyIntakeSuggestions(rows, suggestions) {
  return rows.map(row => {
    if (row.status === 'saved' || row.status === 'unknown') return row;
    const next = suggestions.find(item => item.id === row.id);
    if (!next) return row;
    return { ...row, nombre: String(next.nombre || row.nombre).slice(0, 120), descripcion: String(next.descripcion || row.descripcion).slice(0, 400), categoriaId: next.categoriaId || row.categoriaId, error: '' };
  });
}
const canvasBlob = (canvas, quality) => new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(Error('No pudimos preparar la foto.')), 'image/jpeg', quality));
const dataUrl = blob => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(Error('No pudimos leer la foto.')); reader.readAsDataURL(blob); });
export async function prepareIntakePhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) throw Error('Usa fotos JPG, PNG o WEBP de hasta 8 MB.');
  const image = await createImageBitmap(file);
  try {
    const render = async (size, quality) => {
      const scale = Math.min(1, size / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d'); context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvasBlob(canvas, quality);
    };
    const upload = await render(1600, .86);
    const thumb = await render(512, .65);
    const photo = await dataUrl(thumb);
    if (photo.length > 150000) throw Error('Esta foto tiene demasiado detalle. Elige una imagen más sencilla.');
    const nombre = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/^\s*(IMG|DSC|image|foto)\s*\d+\s*$/i, '').trim().slice(0, 120);
    return { id: crypto.randomUUID(), nombre, descripcion: '', precio: '', categoriaId: '', file: new File([upload], 'producto.jpg', { type: 'image/jpeg' }), photo, preview: URL.createObjectURL(upload), status: 'draft', error: '' };
  } finally { image.close(); }
}
