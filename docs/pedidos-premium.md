# Pedidos: organización visual y conservación de funciones

La pantalla mantiene el flujo operativo existente. El cambio organiza el documento en una secuencia de encabezado, indicadores, filtros, salón, prioridades, tarjetas y paginación. La configuración de TV y las aclaraciones permanecen montadas dentro de secciones desplegables para conservar los borradores.

## Diseño

- Paleta crema, verde y terracota coherente con Panel y Configuración; se conservan los colores semánticos de estados y acciones sensibles.
- Encabezado compacto con sincronización, abiertos, sonido y acceso rápido a TV.
- Resumen sin anillos decorativos; filtros agrupados por estado, rango y mesas. Las fechas manuales aparecen al elegir Personalizado.
- Salón compacto con las mismas mesas, ocupación, detalle y acciones. Los cambios de su estilo solo se aplican dentro de Pedidos.
- Tarjetas existentes con mejor alineación y espaciado. Se conservan pagos, avance de estados, cancelación, eliminación, agrupación y cuenta unificada, según permisos.
- TV desplegable con configuración, duración, sonido, anuncio automático, modo de entrega, mensaje, vista previa y relanzamiento. Un acceso superior la abre directamente.
- Ajuste de contraste del titular de la pantalla TV para que los estilos globales de encabezados no lo oscurezcan.

## Alcance y verificación

No se alteran API, infraestructura, modelos, consultas, permisos ni cálculos. La revisión diferencial del AST confirma 111 instrucciones de lógica conservadas y los 51 manejadores de eventos originales; se añade un manejador para abrir TV. Se excluyen de esa comparación las variables de textos visibles y la referencia del desplegable nuevo.

La demostración usa el componente real con servicios simulados y datos locales. Se verificaron filtros, selección para unir mesas, cancelación de esa selección, duración de TV y conservación del mensaje al cerrar/abrir el desplegable. Cocina conserva Marcar listo; mesero, Marcar entregado; caja, Marcar pago; lectura, solo detalle. Esos perfiles no reciben configuración TV ni ventas históricas.

Se revisaron 320, 390, 768 y 1440 px, tema claro y oscuro. La TV abierta se comprobó también a 320 px sin controles desbordados. La compilación y las 15 pruebas existentes se ejecutan antes de publicar. ESLint del componente no presenta errores; conserva tres advertencias previas de dependencias de efectos que no se refactorizan en este cambio visual.

Las capturas son de la demostración aislada. No se modificaron pedidos, pagos, mesas ni llamados reales durante las pruebas.
