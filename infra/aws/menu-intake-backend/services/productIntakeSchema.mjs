export const MAX_INTAKE_ITEMS = 4;
const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
export function validateIntake(body) {
  if (!Array.isArray(body?.items) || !body.items.length || body.items.length > MAX_INTAKE_ITEMS) throw Error('Selecciona entre una y cuatro fotos.');
  const ids = new Set();
  return body.items.map(item => {
    const id = text(item.id, 80);
    if (!id || ids.has(id)) throw Error('La selección contiene identificadores repetidos.');
    ids.add(id);
    const photo = item.photo || '';
    if (photo && (!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(photo) || photo.length > 150000)) throw Error('Una foto no tiene el formato o tamaño permitido.');
    if (photo && Buffer.from(photo.split(',')[1], 'base64').subarray(0, 3).toString('hex') !== 'ffd8ff') throw Error('La foto no es una imagen JPEG válida.');
    const nombre = text(item.nombre, 120), descripcion = text(item.descripcion, 400);
    if (!photo && !nombre) throw Error('Añade una foto o el nombre del producto.');
    return { id, nombre, descripcion, photo };
  });
}
export function normalizeIntakeOutput(raw, inputs, categories) {
  const value = JSON.parse(String(raw).trim().replace(/^```(?:json)?\s*|\s*```$/g, ''));
  if (!Array.isArray(value.items)) throw Error('El asistente no devolvió una lista de productos válida.');
  return inputs.map(input => {
    const item = value.items.find(row => row.id === input.id);
    if (!item) throw Error('La respuesta está incompleta. No se aplicaron cambios.');
    const categoriaId = categories.find(category => String(category.id) === String(item.categoriaId))?.id || null;
    return { id: input.id, nombre: text(item.nombre, 120) || input.nombre, descripcion: text(item.descripcion, 400), categoriaId };
  });
}
