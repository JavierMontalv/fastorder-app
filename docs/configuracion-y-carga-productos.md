# Configuración y carga de productos

## Diagnóstico comprobado

- El navegador pedía `/sounds/new-order.mp3`, pero el archivo no estaba incluido en la web. Se incorpora un tono WAV propio y se evita precargarlo cuando las notificaciones están inactivas.
- `start_url` del manifiesto usaba la web comercial desde el dominio del administrador. Ahora es una ruta relativa al dominio actual.
- Configuración mezclaba identidad, menú, consumo, sedes y mesas en una página larga. Había títulos oscuros sobre fondos oscuros y nombres técnicos visibles.
- La guía expandida podía tapar controles. Ahora al abrir una sección queda en formato compacto; en móvil se separa del guardado.

## Nuevo recorrido

Secciones: Tu restaurante; Tu carta; Vista previa y QR; Mesas y servicio; Asistente; Sedes, cuando corresponda. Los formularios se mantienen montados al cambiar de sección para conservar lo que se está editando. Guardar cambios conserva el mismo servicio. Las acciones operativas de mesas siguen siendo independientes.

La apariencia utiliza marfil, verde profundo y terracota, con textos más claros, botones identificables y controles adaptados a móvil. La vista de QR se separa de la carga de logo y portada.

## Productos desde fotos

1. Abrir Productos → Cargar con fotos, o el acceso desde Configuración.
2. Seleccionar hasta cuatro fotos por lote. Se preparan versiones de hasta 1600 px para la carta y miniaturas de hasta 512 px para el asistente.
3. Añadir nombres y notas si se conocen. Organizar con asistente prepara sugerencias en una sola solicitud.
4. Revisar nombres, descripciones y categorías. Los precios siempre los escribe el restaurante.
5. Guardar borradores. La publicación es una acción posterior y explícita.

Las sugerencias no crean categorías, inventan precios ni publican productos. No deben tratarse como verificación de ingredientes o alérgenos. Un resultado de guardado no confirmado bloquea el reintento de esa fila y pide revisar el catálogo; los productos ya confirmados no se vuelven a enviar. Se mantienen el editor completo, los permisos, los cupos y los servicios de productos existentes.

## Coste y proveedor actual

La inspección de producción confirmó `gpt-4o-mini` y una clave configurada. No confirma saldo prepagado restante. Se conserva ese proveedor, sin una migración automática ni consumo deliberado de saldo.

El lote usa una solicitud con imágenes de detalle bajo, hasta cuatro fotos y 1400 tokens de salida; no tiene reintentos automáticos de imagen. Se reutilizan respuestas equivalentes y solicitudes simultáneas del mismo lote. La contabilidad usa los tokens informados por el proveedor, y comprueba presupuesto antes de enviar fotos. Los registros no guardan las imágenes codificadas.

El presupuesto del restaurante y su cuota interna no equivalen al saldo de la cuenta OpenAI. Una respuesta fallida o poco precisa sigue requiriendo revisión humana. Las pruebas de este cambio no realizan llamadas de inferencia de pago ni crean productos reales.

## Camino a AWS

Se prepara un adaptador Converse independiente, aún sin activar. Amazon Nova Lite es un candidato multimodal para comparar con un conjunto pequeño de fotos reales. Antes del cambio se deben verificar disponibilidad regional, calidad de nombres/categorías, latencia, precios y permisos mínimos del modelo. No se crea infraestructura ni se conceden permisos nuevos en este cambio.

La migración debe conservar el validador, las categorías autorizadas de cada restaurante, la caché, los límites de gasto y la normalización de consumo. No debe ocurrir solo por un error transitorio o por una estimación de saldo.

Referencias: [imágenes y coste de entrada en OpenAI](https://developers.openai.com/api/docs/guides/images-vision), [Nova Lite](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-lite.html), [Converse](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html), [precios de Bedrock](https://aws.amazon.com/bedrock/pricing/).
