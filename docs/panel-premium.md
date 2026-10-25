# Panel: jerarquía visual y comportamiento

El inicio concentra el resumen comercial en cuatro indicadores y reduce las superficies duplicadas. Se mantiene la identidad crema, verde y terracota, con contraste para ambos temas.

## Organización

- Saludo y fecha compactos, con accesos a carga de productos y pedidos.
- Un único bloque de métricas con filtros Hoy, 7 días y 30 días; el estado de la carta se identifica como actual.
- «Cómo leer este resumen» conserva las aclaraciones del período, comparación con Pedidos, promedio diario, variación, hora pico, pago predominante, producto líder y mejor día.
- Recomendación comercial con acceso a detalle y promociones. Su resumen conserva el período propio del servicio de recomendaciones, separado explícitamente del filtro de gráficos.
- Gráficos existentes de ventas, pedidos por hora, productos y pagos. Los estados sin datos son compactos; se preservan los gráficos y tooltips cuando hay actividad.
- Indicadores de inventario existentes con menor altura y estilos limitados al Panel.

## Alcance técnico

Solo se cambia `admin-web/src/pages/Dashboard.jsx` y se añade `admin-web/src/styles/DashboardWorkspace.css`. No se altera la hoja compartida, las rutas, contratos, consultas, cálculos, permisos, inventario, API ni infraestructura.

Las consultas ignoran respuestas de efectos ya descartados. Al cambiar rápidamente de filtro, un resultado anterior no puede reemplazar el período vigente. Los fallos de carga muestran un aviso y valores no disponibles en vez de confundirse con una venta de cero. Reintentar conserva el filtro elegido.

## Validación

- ESLint del componente y compilación de producción.
- 15 pruebas existentes de SEO, guía y carga de productos.
- Vista aislada del componente real con datos simulados para estados vacío, con actividad y error. Sin sesión de cliente ni consultas a información privada.
- Ajuste a 320, 390, 768 y 1440 px; revisión de tema claro y oscuro, filtros y detalle desplegable.
- No se crean pedidos, productos ni se realizan inferencias pagadas durante la revisión.

Las capturas de `output/panel-premium` son demostraciones locales, no capturas de una cuenta real.
