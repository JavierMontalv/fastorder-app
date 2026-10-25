export function filterPromotions(items, { estado = 'todos', canal = 'todos', query = '' } = {}) {
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const term = normalize(query);
  return items.filter(item => (estado === 'todos' || item.estado === estado)
    && (canal === 'todos' || (item.tipo === 'full' ? 'tv' : 'menu') === canal)
    && (!term || normalize(`${item.titulo || ''} ${item.descripcion || ''}`).includes(term)));
}

export function promotionMediaKind(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return 'empty';
  if (raw.startsWith('blob:')) return 'unknown';
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(raw) ? 'video' : 'image';
}

export function promotionDateInput(value) {
  if (!value) return '';
  const raw = String(value);
  const date = /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(raw) ? raw.slice(0, 10) : '';
  if (!date) return '';
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() !== Number(date.slice(0, 4)) || parsed.getMonth() + 1 !== Number(date.slice(5, 7)) || parsed.getDate() !== Number(date.slice(8, 10))) return '';
  return date;
}

export function promotionDateLabel(value) {
  const date = promotionDateInput(value);
  return date ? new Date(`${date}T12:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha';
}

export function promotionFileError(file) {
  const image = String(file?.type || '').startsWith('image/');
  const video = ['video/mp4', 'video/webm', 'video/quicktime'].includes(file?.type);
  if (!image && !video) return 'Solo puedes subir imágenes o videos cortos MP4, WEBM o MOV.';
  if (file.size > (image ? 5 : 25) * 1024 * 1024) return image ? 'La imagen supera el límite de 5 MB.' : 'El video supera el límite de 25 MB.';
  return '';
}

export function promotionFormError(form, file = null) {
  if (!String(form.titulo || '').trim()) return 'El título de la promoción es obligatorio.';
  if (form.fechaInicio && form.fechaFin && form.fechaInicio > form.fechaFin) return 'La fecha final no puede ser anterior a la fecha inicial.';
  const priority = Number(form.prioridad);
  if (!Number.isInteger(priority) || priority < 1 || priority > 10) return 'La prioridad debe ser un número entero entre 1 y 10.';
  if (!/^#[0-9a-f]{6}$/i.test(form.colorPrincipal || '')) return 'Usa un color de seis dígitos, por ejemplo #315c43.';
  if ((file?.type?.startsWith('video/') || promotionMediaKind(form.imagenUrl) === 'video') && form.tipo !== 'full') return 'Los videos se publican en Pantalla TV. Selecciona ese canal para continuar.';
  return file ? promotionFileError(file) : '';
}
