export const RESERVA_ESTADOS = { pendiente: 'Pendiente', confirmada: 'Confirmada', sentada: 'En mesa', completada: 'Completada', cancelada: 'Cancelada', no_asistio: 'No asistió' };
export const RESERVA_ORIGENES = { telefono: 'Teléfono', whatsapp: 'WhatsApp', instagram: 'Instagram', presencial: 'En el local', otro: 'Otro' };
export function toLocalInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function validarReserva(form, mesas = []) {
  const inicio = new Date(form.fechaHoraInicio), fin = new Date(form.fechaHoraFin), personas = Number(form.numeroPersonas), errors = {};
  if (String(form.clienteNombre || '').trim().length < 2) errors.clienteNombre = 'Escribe al menos dos caracteres.';
  if (!form.fechaHoraInicio || Number.isNaN(inicio.getTime())) errors.fechaHoraInicio = 'Selecciona la fecha y hora de llegada.';
  if (!form.fechaHoraFin || Number.isNaN(fin.getTime()) || fin <= inicio) errors.fechaHoraFin = 'La salida debe ser posterior a la llegada.';
  if (!Number.isInteger(personas) || personas < 1 || personas > 50) errors.numeroPersonas = 'Indica entre 1 y 50 personas, sin decimales.';
  const mesa = mesas.find((item) => String(item.id) === String(form.mesaId));
  if (mesa && personas > Number(mesa.capacidad)) errors.mesaId = `La mesa ${mesa.numero} admite ${mesa.capacidad} personas. Elige otra mesa o deja la asignación pendiente.`;
  return errors;
}
export function prepararReserva(form) {
  return { ...form, clienteNombre: form.clienteNombre.trim(), clienteEmail: form.clienteEmail.trim(), mesaId: form.mesaId ? Number(form.mesaId) : null, numeroPersonas: Number(form.numeroPersonas), fechaHoraInicio: new Date(form.fechaHoraInicio).toISOString(), fechaHoraFin: new Date(form.fechaHoraFin).toISOString() };
}
