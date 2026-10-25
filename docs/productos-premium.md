# Productos: catálogo y edición

Se mantiene la carga paginada del catálogo y los conectores de productos, categorías, inventario, adicionales, promociones y asistencia. Los endpoints, permisos y campos de FormData no cambian.

## Cambios

- Encabezado compacto con acceso a nuevo producto, categoría y carga con fotos.
- Búsqueda y filtro por categoría con limpieza de filtros y contador de resultados.
- Acceso a crear un producto con la categoría seleccionada desde cada apartado.
- Tarjetas con precios legibles, fotografías sin oscurecer, estados y acciones accesibles.
- Estilos encapsulados en ProductosWorkspace.css, con temas claro/oscuro y adaptación a móvil/tablet.
- Se evita pasar el evento del botón Nuevo como categoriaId.
- Se elimina la transformación persistente del contenedor que desplazaba los diálogos respecto a la ventana.
- Etiquetas de formulario asociadas a sus campos y textos simplificados; se mantienen borradores, imágenes, alérgenos, stock y adicionales.

## Verificación

- Build de producción y 19 pruebas existentes correctos.
- Comparación de lint frente al código anterior: ningún diagnóstico nuevo. Permanecen 32 errores y 2 avisos anteriores en Productos y ModalProducto, principalmente código sin uso y efectos de React. TarjetaProducto no presenta errores.
- Contrato de creación/actualización FormData comparado sin cambios.
- Vista aislada con datos simulados: búsqueda, limpiar filtros, ausencia de coincidencias, apertura por categoría, captura de precio COP, selección de stock propio, guardado simulado y actualización del listado; apertura de categoría y carga con fotos.
- Anchos 320, 390, 768 y 1440 sin desbordamiento horizontal; tema oscuro revisado visualmente.
- No se han creado, editado ni eliminado productos reales. La eliminación y la asistencia de IA no se ejecutaron; sus conectores se conservan. La comprobación autenticada completa contra el backend de producción queda pendiente.
