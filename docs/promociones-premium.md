# Promociones: organización y verificación

## Alcance

Se mantiene el servicio de promociones y sus rutas GET, POST, PUT, PUT de estado y DELETE. Se conservan los cuatro formatos (banner, ventana emergente, tarjeta y TV), los cinco estados, fechas, prioridad, color, texto del botón, destino, URL multimedia y subida multipart con la clave `imagen`. No se cambia infraestructura, backend ni el menú público.

## Cambios

- Cabecera y métricas compactas; acceso a pantalla TV sin una columna vacía.
- Búsqueda por título/descripción sin distinguir tildes, filtros combinables de canal y estado y limpieza de filtros.
- Tarjetas de altura controlada con imágenes completas, estado, canal, vigencia, prioridad, impresiones y acciones.
- Editor adaptable con vista previa y textos corregidos; foco contenido dentro del diálogo y restaurado al cerrarlo.
- Confirmación de eliminación dentro de la aplicación, con opción para conservar la campaña.
- Bloqueo de envíos y acciones duplicados durante peticiones, errores visibles y reintento de carga/guardado.
- El formulario lee los valores visibles antes de validar y enviar. Conserva los datos al fallar.
- Corrección de fechas de calendario que aparecían un día antes en Colombia.
- Validación de prioridad 1–10, color hexadecimal, fechas, archivos de hasta 5 MB por imagen o 25 MB por video y videos exclusivos de TV.
- Se conserva el filtro por restaurante y se actualiza el enlace TV al cambiar de sede.

## Pruebas

- Build completo y 25 pruebas automatizadas correctas: 19 existentes y seis nuevas sobre filtros, calendario en Colombia, programación, prioridad/color, archivos y canal de videos.
- Lint de Promociones: cero errores y dos avisos previos sobre dependencias de efectos.
- Vista aislada con API simulada: creación QR, creación TV con imagen seleccionada, edición, guardado de fechas, rechazo de título vacío y rango invertido, activación, pausa, cancelación y confirmación de eliminación; actualización de listado e indicadores.
- Filtros combinados TV + pausada, búsqueda sin resultados, limpieza, notificación de copia del enlace TV y exclusión de una campaña de otra sede.
- Fallos simulados de carga y guardado con reintentos correctos y conservación del formulario.
- Sin desbordamiento horizontal a 320/390/768/1440 px. Editor móvil revisado visualmente y medido a 320/390 px; temas claro y oscuro revisados.

No se han modificado campañas reales. Las pruebas de escritura fueron simuladas. La reproducción real de videos, la apertura en una TV física y el flujo autenticado completo contra la API de producción quedan pendientes; no se afirma una verificación completa de esos entornos.
