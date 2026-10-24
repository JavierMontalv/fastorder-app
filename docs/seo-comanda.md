# Posicionamiento orgánico de Comanda

Fecha de la revisión: 24 de octubre de 2026. Mercado inicial: restaurantes, cafeterías y bares en Colombia.

## Objetivo y criterio de éxito

Construir una presencia reconocible para Comanda de Brevia Tech y captar solicitudes de demostración con intención comercial. La consulta «comanda» comparte nombre con otros productos y un término del sector; ningún cambio técnico garantiza el primer puesto. Primero se medirá cobertura e impresiones de marca, después clics cualificados y solicitudes que terminan en activaciones.

La muestra pública de resultados mostró productos en comanda.com.co, mycomanda.app y trycomanda.com. Es una observación de competencia, no una medición de posiciones de Google Colombia ni de volumen de búsqueda. La página corporativa www.somosbreviatech.com/comanda.html también aparece como referencia pública de la marca. No se dispone todavía de histórico de Search Console, conversiones ni volúmenes validados.

## Arquitectura publicada

- Preferencia canónica: https://www.somoscomanda.com/.
- somoscomanda.com redirige de forma permanente a www y conserva las rutas.
- Inicio, menú QR, pedidos por mesa, planes y guía se generan como HTML durante la compilación.
- El administrador conserva https://admin.somoscomanda.com/admin y el resto de sus rutas. Su HTML inicial incluye noindex. Las solicitudes de activación permanecen en admin y también llevan noindex.
- sitemap.xml enumera únicamente las cinco direcciones públicas canónicas. robots.txt permite rastrear los recursos necesarios.
- Cada página contiene título, descripción, canonical, Open Graph y datos estructurados de organización, sitio y página. Las páginas interiores añaden navegación de migas. No se inventan valoraciones ni testimonios.
- Se cargan por separado el sitio comercial y el panel. Las fotos WebP reducen el peso de las dos imágenes de 317.436 a 59.498 bytes; esta comparación es de archivos, no una medición de Core Web Vitals.

## Operación y seguridad de despliegue

La distribución de administración atiende también el dominio comercial usando el certificado de apex y wildcard validado en ACM. Se reutilizan S3 y CloudFront. La función comanda-commercial-seo atiende únicamente esta distribución. Los menús de restaurantes mantienen comanda-spa-rewrite; no se debe sustituir esa función compartida por el enrutador comercial.

El template infra/aws/static-frontends.yml contiene ambas funciones. Antes de actualizar el stack, usar un certificado que cubra somoscomanda.com y *.somoscomanda.com; el certificado anterior que solo cubre wildcard no sirve para el apex.

El build valida la configuración comercial pública, genera HTML y ejecuta pruebas de canonical, sitemap, noindex, rutas, 404 y aislamiento del enrutador del menú. La publicación de los archivos debe completarse antes de activar el nuevo enrutador. Los recursos con hash anteriores se conservan. El cambio DNS fue realizado por el titular del dominio.

## Mapa inicial de búsquedas

| Intención | Grupo de consultas | Página de destino |
| --- | --- | --- |
| Marca | comanda; somos comanda; comanda brevia tech | / |
| Solución | menú QR para restaurantes; carta digital para restaurantes Colombia | /menu-qr-restaurantes |
| Operación | pedidos por mesa con QR; sistema de pedidos QR para restaurantes | /pedidos-qr-por-mesa |
| Compra | planes Comanda; precio menú QR Comanda | /planes-comanda y comparación de Inicio |
| Investigación | menú QR o PDF; diferencia carta digital y PDF | /guias/menu-qr-o-pdf |

Son grupos de intención a validar con Search Console, no estimaciones de demanda. Evitar crear docenas de páginas casi iguales por ciudad o prometer funcionalidades que no están incluidas en el plan.

## Plan de 90 días

1. Días 0-7: dominio y HTTPS, publicación técnica, propiedad de Search Console, envío de sitemap e inspección de las cinco URLs. Registrar la línea base disponible; «sin datos» no equivale a cero búsquedas.
2. Días 8-30: revisar indexación, canónica elegida, errores y consultas emergentes una vez por semana. Unificar los enlaces oficiales de Brevia Tech y los perfiles propios con la dirección canónica. Identificar las preguntas reales de los primeros restaurantes.
3. Días 31-60: publicar dos casos reales con autorización, alcance del plan y resultados verificables. Añadir dos guías útiles basadas en preguntas comerciales, sin repetir las páginas existentes. Solicitar menciones editoriales a aliados reales cuando exista una colaboración que las justifique.
4. Días 61-90: mejorar títulos y mensajes de páginas que ya tengan impresiones. Contrastar clics con solicitudes y activaciones. Reforzar contenidos que atraigan restaurantes adecuados y revisar la prioridad de consultas según evidencia.

## Métricas y reglas de decisión

- Cobertura: páginas públicas válidas e indexadas, canónica elegida y fecha de rastreo. Objetivo de preparación técnica: 5 de 5 accesibles, con sitemap válido y sin bloqueos propios.
- Búsqueda: impresiones, clics, CTR y posición media de consultas de marca y de solución, separados por país y dispositivo. Comparar ventanas equivalentes de 28 días cuando exista histórico.
- Negocio: solicitudes comerciales recibidas, demos realizadas y planes activados. Mantener un registro con fecha, fuente, restaurante y resultado. Un clic en un enlace de correo no demuestra que se haya enviado una solicitud.
- Rendimiento: comprobar Core Web Vitals con datos de campo cuando estén disponibles. La reducción de archivos no demuestra por sí sola mejoras de LCP, INP o CLS.
- Si no se descubre una página: revisar sitemap y enlaces internos. Si se descubre pero no se indexa: revisar canonical, respuesta, contenido y rastreo. Si tiene impresiones y pocos clics: revisar título y encaje de intención. Si recibe clics sin solicitudes: revisar oferta, claridad y contacto.

No se contratan enlaces, reseñas ficticias ni tráfico artificial. Un perfil de empresa en Google solo corresponde si el negocio cumple los requisitos de contacto presencial; no registrar una oficina ficticia para un servicio exclusivamente en línea. No se han contratado anuncios ni herramientas de pago.

## Pendientes que dependen de Google o de operación comercial

La propiedad de dominio de Search Console fue verificada por el titular (captura aportada durante la revisión). El envío del sitemap y las solicitudes de indexación deben confirmarse con su resultado en Search Console; la verificación de propiedad no acredita que las páginas ya estén indexadas. El rastreo, la indexación y las posiciones dependen de Google. Los casos de clientes, testimonios y acuerdos con aliados requieren evidencia y autorización antes de publicarse.

## Fuentes de referencia

- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/docs/appearance/site-names
- https://support.google.com/business/answer/13763036
- https://vite.dev/guide/ssr
