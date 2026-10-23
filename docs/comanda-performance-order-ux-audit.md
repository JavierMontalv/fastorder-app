# Auditoría de rendimiento, pedidos y presentación

Fecha: 2026-10-23

## Resultado ejecutivo

La capacidad actual de AWS es suficiente. La lentitud percibida proviene principalmente del primer establecimiento de conexión con la API, del paquete inicial del menú y de imágenes de producto servidas fuera del frontend estático. Escalar EC2 o RDS no está justificado por las métricas actuales.

## Mediciones

- CloudFront entrega el HTML del menú con HTTPS correctamente.
- API caliente: 0.30–0.32 segundos en cinco solicitudes consecutivas.
- El primer acceso puede superar 2 segundos al incluir DNS, TLS y apertura de conexión.
- EC2 `t2.micro`: CPU media 1.81%, máximo 17.52% en 24 horas.
- RDS `db.t4g.micro`: CPU media 2.85%, máximo 5.98% en 24 horas.
- RDS: latencia media de lectura 0.55 ms y escritura 0.50 ms.
- RDS: burst balance mínimo 99% y unos 18.2 GB libres.
- RDS tiene poca memoria libre (mínimo aproximado 128 MB), pero sin presión observable de CPU o almacenamiento. Debe vigilarse antes de agregar procesos residentes.

## Cambios aplicados

### Menú de clientes

- División por rutas de carrito, checkout, estado y confirmación.
- Carga bajo demanda del lector QR y de los paneles de configuración y cierre del pedido.
- Eliminación de `framer-motion` del paquete inicial raíz.
- Caché de sesión del menú por restaurante durante 60 segundos.
- Preconexión al dominio de API.
- Imágenes con dimensiones, decodificación asíncrona y prioridad explícita.
- Reserva tipográfica para nombres largos, evitando saltos y superposiciones.
- Corrección del uso condicional de hooks en la pantalla de producto.
- Bloqueo síncrono contra doble envío del mismo pedido.

Resultado de build: el JavaScript inicial bajó de 699.61 kB a 497.72 kB sin comprimir, aproximadamente 28.9%. El CSS inicial bajó de 153.55 kB a 109.39 kB, aproximadamente 28.8%. El lector QR de 130.44 kB se descarga solamente al abrir el escáner.

### Panel de pedidos

- La barra de filtros ahora responde al ancho útil del dashboard y no al viewport completo.
- Los grupos de fechas, vista y mesas se apilan antes de invadir columnas vecinas.
- Controles claros en tema claro; oscuro reservado al tema oscuro.
- Protección contra desbordes de texto y line-height consistente.
- Corrección de textos con codificación dañada y eliminación de una función muerta.

## Integridad del pedido

- La validación de mesa QR sigue ocurriendo antes de avanzar al pago.
- El backend continúa siendo la fuente final de precio, stock y creación del pedido.
- No se añadieron reintentos automáticos al POST de creación para evitar duplicados.
- Un `ref` bloquea clics concurrentes antes de que React alcance a volver a renderizar el botón.
- El carrito se limpia solamente después de recibir un identificador de pedido válido.
- La sesión activa del pedido permanece aislada por restaurante.

## Seguridad y costo

- No se modificaron EC2, RDS, API ni DNS.
- No se agregaron servicios AWS ni capacidad adicional.
- Las dependencias de producción de ambos frontends reportan cero vulnerabilidades conocidas en `npm audit --omit=dev`.
- RDS figura como públicamente accesible. No se cambió porque cerrarlo exige validar conectividad y grupos de seguridad con la EC2; debe tratarse como una mejora de seguridad separada con reversión preparada.

## Riesgos residuales

- El repositorio contiene deuda histórica de lint fuera de los archivos modificados, especialmente componentes legacy no usados por el flujo principal.
- El bundle administrativo sigue siendo grande; conviene dividirlo por rutas en una fase independiente para no mezclar un cambio transversal con la corrección operativa.
- Para medir el endpoint de menú con datos reales se requiere un slug de cliente representativo y una prueba sintética que no cree pedidos.
