# Inicio comercial y acceso administrativo

- `/inicio`: presentación comercial, vista ilustrativa del producto, planes de la API pública, solicitud de demo por correo, preguntas frecuentes y documentos comerciales.
- `/inicio?plan=basico|pro|premium&modo=activar`: formulario de activación del plan seleccionado. Usa el endpoint existente `POST /api/public/comercial/checkout` con datos del cliente y aceptación explícita de los documentos versionados.
- `/admin`: acceso independiente. No crea cuentas ni habilita permisos. Mantiene la autenticación, los roles y el cambio de contraseña del sistema existente.
- `/login`: redirige a `/admin`; los enlaces antiguos que incluyen selección de plan redirigen a Inicio y conservan la selección.
- `/descubre`: redirige a Inicio.
- `/`: conserva el panel para sesiones autenticadas; los visitantes llegan a Inicio. Las rutas privadas redirigen al acceso administrativo.

## Activación

Los precios y límites se consultan en `/api/public/comercial/config`; no se presentan precios estáticos como si fueran vigentes cuando falla la API. El botón de reintento permite recuperar esa carga.

Cuando `checkoutReady` es falso, el formulario registra una solicitud de activación asistida. La confirmación muestra su referencia y avisa que el acceso está pendiente. Cuando sea verdadero, el formulario utiliza el enlace HTTPS devuelto por el backend para continuar al pago. La autorización sigue en el servidor; esta separación de páginas no concede acceso por una selección de plan ni por enviar una solicitud.

Solicitar una demo abre un borrador de correo a la dirección comercial configurada actualmente. No envía correos automáticamente ni habilita cuentas demo. El equipo confirma condiciones y activa las cuentas por el procedimiento existente.

## Publicación y verificación

Se reutilizan S3 y CloudFront existentes y el workflow `deploy-admin-aws.yml`. No se crea infraestructura adicional. Los archivos con hash del despliegue anterior se conservan para los navegadores que todavía los utilizan.

Verificar: compilación de producción, lint de componentes modificados, Inicio y planes desde API, selección de plan, lectura y cierre de documentos, menú móvil, ausencia de desbordamiento horizontal, alias antiguos, protección de rutas y error con credenciales inválidas. La prueba no crea solicitudes reales, no acepta contratos por un cliente y no realiza cobros. El acceso exitoso con una cuenta real y la validación de un pago requieren una cuenta de prueba autorizada y pasarela habilitada.
