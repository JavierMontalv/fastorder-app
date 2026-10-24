export const SITE_ORIGIN = (import.meta.env?.VITE_PUBLIC_SITE_URL || 'https://admin.somoscomanda.com').replace(/\/$/, '');
export const ADMIN_ORIGIN = 'https://admin.somoscomanda.com';
export const HOME_PATH = SITE_ORIGIN.includes('admin.somoscomanda.com') ? '/inicio' : '/';
export const HOME_TITLE = 'Comanda | Menú QR y pedidos para restaurantes en Colombia';
export const HOME_DESCRIPTION = 'Comanda conecta tu menú digital QR, los pedidos por mesa y la gestión de tu restaurante. Compara planes en pesos colombianos y solicita una demo.';
export const publicPages = [
  {
    path: '/menu-qr-restaurantes', label: 'Menú QR para restaurantes',
    title: 'Menú QR para restaurantes en Colombia | Comanda',
    description: 'Publica una carta digital con fotos, categorías y precios actualizados. Conoce el menú QR de Comanda para restaurantes, cafeterías y bares.',
    eyebrow: 'TU CARTA, SIEMPRE A MANO', heading: 'Un menú QR que hace más fácil elegir.',
    intro: 'Comanda te permite presentar los productos de tu restaurante en una carta digital que tus clientes consultan desde el navegador. Organiza las categorías, muestra fotografías y actualiza tus precios desde el panel.',
    sections: [
      ['Qué es un menú QR digital', 'Es una carta web a la que se accede mediante un código QR o un enlace. El código lleva al menú del restaurante; tus clientes no necesitan descargar una aplicación para consultarlo. Se requiere conexión a internet.'],
      ['Una carta que puedes mantener al día', 'Actualiza productos, categorías, fotografías, descripciones, precios y disponibilidad. En lugar de reenviar un archivo cada vez que cambia tu carta, comparte el enlace de tu menú.'],
      ['Para restaurantes, cafeterías y bares', 'Organiza tu oferta por categorías para que cada cliente encuentre lo que busca. Puedes compartir el enlace en tus canales habituales y ubicar el QR en las mesas o en un lugar visible del establecimiento.'],
      ['Menú digital y pedidos son alcances diferentes', 'Comanda Básico permite publicar y administrar la carta QR. Si quieres recibir pedidos desde la mesa, revisa Pro o Premium. Las funciones y límites vigentes se muestran antes de solicitar activación.'],
      ['Cómo empezar con tu restaurante', 'Elige un plan o solicita una demostración. Una vez se confirme la activación, configura tu marca y tus productos, revisa el menú en un celular y comparte el QR. Conserva una alternativa de consulta para clientes sin conexión.']
    ],
    related: ['/pedidos-qr-por-mesa', '/planes-comanda', '/guias/menu-qr-o-pdf']
  },
  {
    path: '/pedidos-qr-por-mesa', label: 'Pedidos QR por mesa',
    title: 'Pedidos por mesa con código QR para restaurantes | Comanda',
    description: 'Conecta los pedidos de tus mesas con el equipo de tu restaurante. Conoce los planes Pro y Premium de Comanda y solicita una demostración.',
    eyebrow: 'DE LA MESA A TU EQUIPO', heading: 'Cada pedido, conectado con su mesa.',
    intro: 'Un menú digital ayuda a mostrar tu oferta. Los pedidos QR por mesa dan el siguiente paso: permiten que el cliente envíe su selección y que tu equipo siga el pedido desde el panel de Comanda.',
    sections: [
      ['Qué cambia frente a una carta QR', 'Una carta digital muestra productos y precios. Con pedidos por mesa, el cliente puede avanzar desde la consulta del menú hasta el envío de su pedido. Esta función está incluida en Pro y Premium, no en Básico.'],
      ['Organización para el servicio', 'Consulta los pedidos y sus estados desde el panel. La referencia de mesa ayuda al equipo a relacionar lo que debe preparar y entregar con el lugar correspondiente del restaurante.'],
      ['Un recorrido que debes probar antes de operar', 'Revisa el QR de cada mesa, la disponibilidad de productos y la recepción del pedido en el panel. Antes del primer servicio, recorre el flujo completo con tu equipo y confirma cómo manejarán cambios y cancelaciones.'],
      ['Internet y atención siguen siendo importantes', 'El cliente y el equipo necesitan conexión. El QR acompaña la atención del restaurante: ofrece ayuda para quien la necesite y conserva un procedimiento de contingencia si falla la conexión.'],
      ['Elige el alcance de tu operación', 'Compara los límites de usuarios, productos y pedidos mensuales de Pro y Premium. Si operas varias sedes, solicita una propuesta específica antes de contratar.']
    ],
    related: ['/menu-qr-restaurantes', '/planes-comanda', '/guias/menu-qr-o-pdf']
  },
  {
    path: '/planes-comanda', label: 'Planes y precios de Comanda',
    title: 'Planes y precios de Comanda para restaurantes | Colombia',
    description: 'Compara Comanda Básico, Pro y Premium: menú QR, pedidos por mesa y capacidad para tu restaurante. Consulta los precios vigentes en pesos colombianos.',
    eyebrow: 'CONTRATA CON EL ALCANCE CLARO', heading: 'El plan que necesita tu restaurante.',
    intro: 'Comanda ofrece tres planes para distintas etapas del negocio. La comparación de precios y límites vigentes está en la página de Inicio y se consulta desde el sistema comercial antes de solicitar activación.',
    sections: [
      ['Básico: publica tu carta QR', 'Para negocios que necesitan una carta digital editable con productos, categorías, fotografías y precios. Incluye acceso al panel para administrar el menú. No incluye recepción de pedidos QR por mesa.'],
      ['Pro: conecta los pedidos de tus mesas', 'Incluye el alcance de Básico y suma pedidos QR, organización de estados, promociones y analítica comercial. Revisa la capacidad mensual de pedidos y la cantidad de usuarios disponibles.'],
      ['Premium: más capacidad para tu operación', 'Amplía los límites de productos, usuarios y pedidos. Incluye el alcance de Pro y herramientas comerciales adicionales. Evalúa la capacidad que realmente necesitas antes de elegir el plan.'],
      ['Lo que debes confirmar antes de contratar', 'Consulta el precio mensual en COP, los límites del plan, las condiciones de activación, los documentos del servicio y el alcance del soporte. Una solicitud no equivale a un pago ni habilita una cuenta de forma inmediata.'],
      ['Demo, activación y acceso administrativo', 'Puedes solicitar una demo por correo para revisar tu caso. El equipo confirma sus condiciones. Para ingresar al administrador debes contar con una demo o plan activado y credenciales autorizadas.']
    ],
    related: ['/menu-qr-restaurantes', '/pedidos-qr-por-mesa', '/guias/menu-qr-o-pdf']
  },
  {
    path: '/guias/menu-qr-o-pdf', label: 'Guía: menú digital o PDF',
    title: 'Menú QR digital o PDF: qué elegir para tu restaurante | Comanda',
    description: 'Compara una carta PDF con un menú QR digital: actualización, lectura en celular, fotos y pedidos. Una guía práctica para decidir con tu restaurante.',
    eyebrow: 'GUÍA PARA RESTAURANTES', heading: '¿Tu carta en PDF o un menú digital?',
    intro: 'Un código QR puede abrir un archivo PDF o una página web. Que una carta tenga QR no significa que permita actualizar productos desde un panel o recibir pedidos. La diferencia está en lo que ocurre después de escanear.',
    sections: [
      ['Cuándo puede servir un PDF', 'Un PDF puede ser suficiente si la carta cambia poco y tienes una versión legible en celular. Revisa su peso, el tamaño de letra y el proceso para reemplazar el archivo cuando cambian los precios.'],
      ['Cuándo aporta un menú digital', 'Una carta web permite presentar categorías y fichas de producto adaptadas al celular. En Comanda, el restaurante administra su contenido desde el panel y comparte el enlace del menú con sus clientes.'],
      ['Qué debes probar en el celular', 'Escanea el QR con distintos teléfonos. Comprueba cuánto tarda en abrir, si se lee sin ampliar constantemente, cómo se consultan categorías y precios, y qué ve el cliente cuando un producto no está disponible.'],
      ['Si también necesitas recibir pedidos', 'No todos los QR permiten pedir. Verifica que el plan incluya pedidos por mesa y prueba la llegada al panel, los estados del pedido y el trabajo del equipo. Comanda ofrece este alcance en Pro y Premium.'],
      ['Una decisión que debe ayudar al servicio', 'Elige según la frecuencia de cambios, la cantidad de productos y la forma de atender. Publica fotografías útiles y precios claros. Ofrece una alternativa a quien no tenga conexión o necesite ayuda para consultar la carta.']
    ],
    related: ['/menu-qr-restaurantes', '/pedidos-qr-por-mesa', '/planes-comanda']
  }
];

export function pageMetadata(path) {
  const page = publicPages.find(p => p.path === path);
  return page ? { title: page.title, description: page.description, canonical: SITE_ORIGIN + page.path } : { title: HOME_TITLE, description: HOME_DESCRIPTION, canonical: SITE_ORIGIN + HOME_PATH };
}

export function structuredData(path) {
  const home = SITE_ORIGIN + HOME_PATH;
  const organization = { '@type': 'Organization', '@id': SITE_ORIGIN + '/#organization', name: 'Comanda', legalName: 'BREVIA TECH SAS', url: home, logo: SITE_ORIGIN + '/brand/comanda-icon.png', email: 'comercial@somosbreviatech.com', parentOrganization: { '@type': 'Organization', name: 'Brevia Tech SAS', url: 'https://www.somosbreviatech.com/' } };
  const website = { '@type': 'WebSite', '@id': SITE_ORIGIN + '/#website', name: 'Comanda', alternateName: ['Somos Comanda', 'Comanda de Brevia Tech', 'somoscomanda.com'], url: home, inLanguage: 'es-CO', publisher: { '@id': organization['@id'] } };
  const page = publicPages.find(p => p.path === path);
  const graph = [organization, website, { '@type': 'WebPage', name: page?.title || HOME_TITLE, url: SITE_ORIGIN + (page?.path || HOME_PATH), description: page?.description || HOME_DESCRIPTION, inLanguage: 'es-CO', isPartOf: { '@id': website['@id'] } }];
  if (page) graph.push({ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Comanda', item: home }, { '@type': 'ListItem', position: 2, name: page.label, item: SITE_ORIGIN + page.path }] });
  return { '@context': 'https://schema.org', '@graph': graph };
}
