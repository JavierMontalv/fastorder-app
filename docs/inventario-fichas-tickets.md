# COMANDA — inventario, fichas y tickets

Preparado en una copia independiente. No publicado ni migrado en producción.

## Implementado

- Asesor compacto, un solo control. Se desplaza con la barra lateral; se oculta con el menú móvil abierto, fichas de producto abiertas y modales. Escape/cierre explícito y WhatsApp oficial +57 301 639 9943. El soporte de la barra ya no apunta al dominio de ejemplo.
- Módulo Inventario accesible a owner/admin/superadmin: crear y editar artículos, sección, unidad, existencias mínimas, costo, SKU/código de barras, proveedor, ubicación, lote/vencimiento de referencia, observaciones y exportación CSV de la página. Paginación de 100 artículos y búsqueda por nombre/sección. Valor y alertas mostrados corresponden a la página consultada.
- Existencias iniciales cero y cambios exclusivamente mediante entradas/salidas/ajustes. Servicio existente reforzado con filtro de restaurante, bloqueo transaccional, cantidades finitas, rechazo de negativos/stock insuficiente y ajuste a cero.
- Productos: ficha interna separada con códigos, costo, clasificación, unidad de venta, preparación, centro de elaboración, nombre corto, orden y referencias tributarias. Se completa después de crear el producto, con botón propio. Sus costos no se agregan a las respuestas del menú público.
- Configuración → Imprimir comanda: preferencias por usuario/restaurante/navegador, formatos 58 y 80 mm, encabezado, nota y precios opcionales; prueba de impresión. Cada tarjeta de pedido con órdenes tiene «Imprimir comanda» con vista previa de cantidades, modificaciones y notas.

## Límites explícitos

- Impresión universal mediante diálogo del navegador y controlador instalado. USB/red según el equipo. Guardar en PDF desde el mismo diálogo. No hay impresión silenciosa, selección automática de impresora ni puente ESC/POS; no se ha probado una impresora física.
- Impuestos de ficha son datos de referencia: no recalculan la carta ni implementan facturación fiscal.
- Lote/vencimiento corresponden a una referencia de artículo, no existencias separadas por múltiples lotes. No se implementan todavía compras a proveedores, recetas multiingrediente, kardex por lote ni traslado entre sedes.
- Preferencias de impresión locales, no sincronizadas entre dispositivos.

## Pruebas ejecutadas

- 50 pruebas frontend y 12 pruebas backend aisladas aprobadas. Las pruebas backend sustituyen Sequelize/modelos; no equivalen a una prueba de integración con MariaDB real.
- Navegador local, API simulada sin llamadas de escritura a producción: 320, 390, 768 y 1440 px. Crear/editar inventario, guardar ficha de producto, mostrar/ocultar asesor con barra y modales, formatos 58/80, evento de impresión simulado, sin errores JS ni desbordamiento.
- Archivos `evidence/browser-checks.json`, capturas `inventario-*.png`, `ticket-58mm.pdf` y `ticket-80mm.pdf`. Estos PDF son muestras de prueba.

## Publicación pendiente

1. Confirmar que las versiones GitHub del backend y AWS siguen alineadas antes de actualizar archivos (hay antecedentes de diferencias).
2. Respaldar fuente y base de datos con el proceso existente. Migración explícita `node scripts/migrate-operacion-detalles.mjs`: crea solo `operacion_detalles`; nunca alter/force sobre tablas existentes ni migración al iniciar la app.
3. Probar con MariaDB de ensayo, incluyendo rollback, upsert concurrente y casos de restaurantes distintos. Verificar índices y columnas si la tabla ya existe.
4. Publicar primero backend/modelo/rutas, comprobar API autenticada con dos restaurantes de prueba, luego frontend mediante el flujo existente.
5. Prueba de ticket del propietario con impresora instalada; ancho de papel igual en COMANDA y driver, escala 100 %, encabezados/pies deshabilitados.
6. Rollback: restaurar fuente anterior y frontend anterior conservando la tabla aditiva. No borrar fichas o movimientos.

La autorización anterior era para publicar el contacto de WhatsApp. Esta ampliación incorpora persistencia y stock; se entrega en ramas de revisión sin desplegar.
