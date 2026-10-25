# Analítica: diseño y pruebas

## Alcance

Se conservan los conectores de analítica comercial e inventario, sus rutas y campos de consulta, los permisos por rol y las acciones de lectura/resolución de alertas. No se cambia backend ni infraestructura.

## Cambios

- Cabecera compacta con rango aplicado visible, módulos de ventas e inventario y actualización manual.
- Rango personalizado con aplicación explícita: no se consultan períodos incompletos o invertidos y se mantiene el último rango válido.
- Indicadores comerciales primero, gráficos con superficies coherentes con los temas claro/oscuro y una cuadrícula sin columnas implícitas vacías.
- Estados vacíos explicativos para ventas, demanda y pagos, sin gráficos grandes en blanco.
- Consumo de IA en un bloque desplegable que conserva todos sus datos y aclara que corresponden al mes actual.
- Inventario organizado en resumen, alerta prioritaria, acciones, métricas, tendencias, productos críticos, recomendaciones e historial.
- Reintento de consultas fallidas en ambos módulos, bloqueo de acciones de inventario duplicadas y descarte de respuestas antiguas al cambiar de período.
- Recarga del módulo al cambiar de sede; se mantienen las restricciones de acceso existentes.

## Verificación

- Build completo y 30 pruebas correctas (25 existentes y cinco nuevas).
- Lint sin errores ni avisos en los cuatro archivos React modificados.
- Pruebas nuevas: rangos locales, fechas imposibles/incompletas/invertidas, contrato filtro/desde/hasta, respuestas fuera de orden e invalidación de peticiones abandonadas.
- Vista aislada con servicios simulados: 7 días, 30 días, rango personalizado válido/inválido, conservación del rango aplicado al fallar, cambio de módulos y mantenimiento de filtros.
- Indicadores comerciales, gráficos, porcentajes, ranking y detalle mensual de IA revisados con datos de prueba conocidos.
- Errores simulados de ventas e inventario con recuperación mediante Reintentar.
- Acciones de marcar alerta como leída y resolver verificadas con servicios simulados, actualizando contadores e historial.
- Estado comercial vacío y permisos de un rol sin acceso a inventario verificados.
- Temas claro/oscuro y anchos 320/390/768/1440 revisados, con una columna real en móvil y dos en escritorio, sin desbordamiento horizontal.

Las operaciones de escritura fueron simuladas. No se modificaron ventas, pagos ni alertas reales. La conciliación de cifras contra transacciones de producción y las acciones autenticadas reales quedan pendientes; no se afirma una validación completa de esos datos.
