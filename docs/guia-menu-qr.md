# Guía interactiva para preparar el menú QR

La bienvenida de propietarios y administradores se convierte en un recorrido de cuatro pasos:

1. Datos del restaurante, logo y portada en Configuración.
2. Primera categoría mediante el formulario funcional de Productos.
3. Primer producto con nombre, precio, categoría y estado operativo.
4. Revisión del menú público, descarga del QR, copia del enlace y prueba con otro celular.

El botón «Nueva categoría» de Productos abre el formulario rápido que ya utiliza la aplicación. Se conservan sus servicios, validaciones y límites. No se utiliza el formulario incompleto de la antigua pantalla Categorías.

## Comportamiento

La guía aparece la primera vez para cada combinación de usuario, restaurante y sede en ese navegador. «Continuar después» la cierra y deja un acceso para retomarla. Al abrir una sección del panel, un acompañamiento compacto recuerda el paso y puede minimizarse. Los editores de categorías y productos aparecen por encima de este acompañamiento.

«Ya guardé este paso» registra una confirmación manual de lectura y revisión. No guarda datos del restaurante, no consulta un estado de publicación y no genera productos ni pedidos. El cierre del recorrido no afirma que el menú esté publicado: pide revisar el menú real y escanear el QR. El progreso se conserva localmente, sin almacenar contraseñas, datos del menú ni imágenes. Si el navegador impide guardar el progreso, el recorrido continúa y muestra un aviso.

## Accesibilidad y adaptación

Diálogo nativo con foco dentro del modal, cierre con Escape, retorno de foco y acciones visibles durante el desplazamiento. Pasos seleccionables por teclado y contador de progreso. Diseño en dos columnas en escritorio, una columna en móvil, botones apilados y movimiento reducido cuando corresponde. El símbolo oficial es el libro naranja.

## Verificación

Pruebas de aislamiento por usuario/restaurante/sede, progreso inválido, almacenamiento no disponible, reanudación y destinos de cada paso. Revisión de navegación, cierre, reapertura y finalización en una vista local del componente real sin sesión ni acceso a datos de producción. Comprobación de anchos 320, 390, 768 y 1440 px. Se conservan las pruebas SEO existentes.

La verificación del guardado real de configuración y productos requiere una sesión autorizada y datos de prueba; este cambio no envía formularios ni crea contenido en producción.
