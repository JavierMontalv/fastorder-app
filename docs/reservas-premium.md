# Reservas: diseño y validación de los flujos

La agenda ocupa el primer plano y el salón queda debajo, con el mismo lenguaje visual de Panel y Pedidos. Se conserva crear, editar, asignar o dejar sin mesa, todos los estados y orígenes, notas, filtros y eliminación con confirmación.

## Correcciones

- Las personas y el estado dejan de ocultarse en móvil y tablet.
- El formulario incorpora el correo ya admitido por el contrato existente, etiquetas de estados legibles y grupos de cliente, horario/mesa y notas.
- Se valida salida posterior a llegada, personas enteras de 1 a 50, nombre y capacidad antes de enviar. El servidor conserva la autoridad sobre cruces de horarios y pertenencia de mesas.
- El envío usa los valores visibles del formulario y conserva el contrato API. Se bloquean envíos duplicados mientras hay una petición en curso.
- Los errores de carga se distinguen de una agenda vacía. Los errores al guardar se muestran sin cerrar ni limpiar el formulario.
- La eliminación usa un diálogo dentro de la aplicación, con foco inicial en Conservar reserva y alternativa de cancelar el estado para mantener el historial. No cambia el endpoint DELETE existente.
- Se incorpora búsqueda por cliente, contacto o número de mesa, actualización manual y orden cronológico. Las métricas siguen usando la agenda completa; sus etiquetas explican el alcance.
- El formulario admite Escape, mantiene el foco dentro del diálogo y bloquea cierres durante el guardado.

## Validación y límites

Compilación y 19 pruebas automáticas correctas; ESLint de los archivos modificados sin errores ni advertencias. Cuatro pruebas nuevas cubren horarios/capacidad, payload, fechas locales y conservación de estados/orígenes.

El componente real se probó con servicios simulados: crear con mesa, reabrir y editar, pasar a Completada, filtrar cerradas, buscar, cerrar con Escape y conservar datos ante conflicto de horario. Se comprobaron las validaciones de salida y capacidad. Se revisaron 320, 390, 768 y 1440 px y que personas/estados continúen visibles.

Una confirmación nativa de la versión inicial interrumpió el navegador de prueba; se sustituyó por el diálogo interno. No se completó una eliminación desde la interfaz durante esta revisión. No se afirma una prueba integral autenticada contra el servidor real. Las capturas y escrituras de prueba corresponden exclusivamente a datos simulados y descartables.

No se modificaron la API, la base de datos, la infraestructura, los permisos de rutas ni las reservas reales. Se mantienen la asignación pendiente y las comprobaciones del servidor.
