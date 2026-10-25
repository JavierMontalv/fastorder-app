# Parche acotado de carga de productos

Este directorio contiene los archivos productivos que cambian y dos archivos nuevos. El backend histórico de la raíz del repositorio es anterior al servicio en ejecución; no debe desplegarse completo para aplicar este cambio.

Destino: backend Express existente de Comanda. Comparar los hashes normalizados de `base-hashes.json` con `services/iaService.js` y `routes/iaRoutes.js` antes de copiar. Respaldar ambas versiones y comprobar sintaxis, salud y rechazo de solicitudes sin contexto autorizado. La organización se añade bajo las guardas existentes de autenticación, restaurante, plan, modo y límite.

El nuevo endpoint no escribe productos. Solo prepara sugerencias y registra el consumo del asistente. Cada imagen debe ser JPEG en datos locales acotados; no se aceptan URL externas. Las categorías provienen del restaurante autenticado y los precios se excluyen de la respuesta normalizada.

`bedrock-adapter.mjs` es una preparación independiente con cliente inyectado. No se importa en producción ni cambia el proveedor actual. Su prueba utiliza un cliente ficticio y no realiza inferencia de pago.
