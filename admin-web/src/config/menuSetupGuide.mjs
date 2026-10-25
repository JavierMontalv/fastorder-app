export const menuSetupSteps = [
  {
    id: 'restaurant', label: 'Tu restaurante', title: 'Dale identidad a tu menú.',
    description: 'Empieza por los datos que reconocerán tus clientes.',
    route: '/configuracion', action: 'Abrir configuración', section: 'Identidad del negocio',
    tasks: ['Completa el nombre del restaurante y sus datos de contacto.', 'En «Logo, portada y acceso QR», añade tu logo y una foto de portada si los tienes.', 'Pulsa «Guardar cambios» y espera la confirmación.'],
    tip: 'Puedes comenzar con el nombre y completar las imágenes después.',
    example: ['La mesa de casa', 'Cocina fresca, hecha para compartir.']
  },
  {
    id: 'category', label: 'Una categoría', title: 'Ordena tu carta con una categoría.',
    description: 'Una categoría reúne productos del mismo tipo.',
    route: '/productos', action: 'Crear mi primera categoría', section: 'Productos → Nueva categoría',
    tasks: ['En Productos, pulsa «Nueva categoría».', 'Escribe un nombre sencillo, como «Platos principales» o «Bebidas». El icono es opcional.', 'Pulsa «Crear categoría». Si ya tienes categorías, puedes usar una existente.'],
    tip: 'Empieza con una sola categoría. Después podrás ampliar tu carta.',
    example: ['Platos principales', 'Bebidas', 'Postres']
  },
  {
    id: 'product', label: 'Tu primer producto', title: 'Añade algo que provoque pedir.',
    description: 'Crea un producto real con su precio y categoría.',
    route: '/productos', action: 'Abrir productos', section: 'Productos → Nuevo',
    tasks: ['Pulsa «Nuevo» o «Crear producto».', 'Completa el nombre, el precio en pesos colombianos y la categoría. Añade una foto y una descripción si las tienes.', 'Revisa el estado «Activo», las opciones de stock y pulsa «Crear producto». Espera la confirmación.'],
    tip: 'Usa el precio real de venta y una descripción corta. La cantidad de productos depende de tu plan.',
    example: ['Bowl de la casa', 'Ingredientes frescos y salsa de la casa.', '$ 24.900']
  },
  {
    id: 'share', label: 'Revisar y compartir', title: 'Prueba tu menú antes de compartirlo.',
    description: 'Mira la experiencia que tendrán tus clientes.',
    route: '/configuracion', action: 'Revisar mi menú y QR', section: 'Logo, portada y acceso QR',
    tasks: ['En «QR del restaurante», pulsa «Abrir app» y comprueba que aparezcan tus productos, fotos y precios.', 'Vuelve al panel: «Descargar PNG» guarda tu QR y «Copiar enlace» permite compartir tu menú.', 'Escanea el QR con otro celular y revisa el menú. Solo entonces compártelo o imprímelo.'],
    tip: 'Si el QR aún no aparece, espera a que termine la carga y revisa que la configuración esté guardada. Los pedidos por mesa dependen del plan.',
    example: ['Tu carta, lista para revisar', 'Abrir · comprobar · compartir']
  }
];

export function guideStorageKey(user) {
  return `comanda.menu-guide.v1.${encodeURIComponent(user?.id || user?.email || 'session')}.${encodeURIComponent(user?.restauranteId || 'restaurant')}.${encodeURIComponent(user?.sedeActivaId || 'main')}`;
}

export function parseGuideProgress(raw) {
  try {
    const value = JSON.parse(raw);
    const saved = Array.isArray(value?.completed) ? value.completed : [];
    return { dismissed: value?.dismissed === true, completed: menuSetupSteps.filter(step => saved.includes(step.id)).map(step => step.id) };
  } catch { return { dismissed: false, completed: [] }; }
}

export function readGuideProgress(storage, key) {
  try { return parseGuideProgress(storage.getItem(key)); }
  catch { return parseGuideProgress(null); }
}

export function saveGuideProgress(storage, key, progress) {
  try { storage.setItem(key, JSON.stringify(progress)); return true; }
  catch { return false; }
}
