# COMANDA — estructura de producto y experiencia administrativa

## Qué ofrece realmente el producto

COMANDA no debe presentarse como un POS genérico. Su propuesta actual es coordinar la operación digital de un restaurante desde la carta hasta la lectura del negocio:

1. **Operación:** pedidos QR en tiempo real y reservas.
2. **Carta y crecimiento:** productos, categorías, disponibilidad y promociones.
3. **Inteligencia:** panel ejecutivo, analítica comercial e inventario cuando el plan lo habilita.
4. **Administración:** identidad del local, horarios, equipo, roles y configuración.
5. **Asistencia:** soporte IA condicionado por plan y datos disponibles.

## Arquitectura de navegación propuesta

- **Inicio:** Panel.
- **Operación:** Pedidos y Reservas.
- **Carta y ventas:** Productos, Categorías y Promociones.
- **Inteligencia:** Analítica y Auditoría.
- **Administración:** Configuración, Equipo y Soporte IA.

Esta jerarquía reduce el menú plano, separa trabajo diario de configuración y evita prometer módulos de caja, pagos o domicilios que todavía no constituyen el núcleo estable del producto.

## Bienvenida de primer ingreso

La presentación inicial resume cinco tareas reales: configurar el local, construir la carta, recibir pedidos QR, sumar al equipo y medir resultados. La versión inicial se guarda por usuario en el navegador para no bloquear la operación. La evolución recomendada es persistir `welcome_seen_at` en el perfil del usuario para sincronizar el estado entre dispositivos.

## Auditoría

La interfaz se incorpora sin datos simulados. Para volverla funcional se requiere un registro inmutable en backend con:

- restaurante y sede;
- usuario, rol, IP y agente de usuario;
- acción, recurso e identificador;
- valores anteriores y posteriores con datos sensibles redactados;
- fecha, resultado e identificador de correlación.

Los primeros eventos deben cubrir inicio de sesión, cambios de estado o eliminación de pedidos, edición de productos, ajustes de inventario, cambios de configuración y administración del equipo. El registro de auditoría no debe impedir la operación principal si falla, pero sí debe emitir una alerta técnica.

## Principios visuales

- Superficies claras, bordes suaves y una única acción principal por pantalla.
- Coral de COMANDA como acento, no como fondo dominante.
- Tipografía y espaciado consistentes; menos tarjetas decorativas y más jerarquía.
- Estados vacíos honestos, sin métricas ficticias.
- Roles y planes gobiernan la visibilidad de cada módulo.
