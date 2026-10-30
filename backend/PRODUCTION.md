# Fuente de producción del backend

El backend vigente de AWS se reconcilió en el repositorio privado `JavierMontalv/fastorder-backend` (PR #1). Esa es la fuente de despliegue para la API; el backend histórico de este monorepo no debe reemplazarla.

La integración de pagos reutiliza las primitivas de firma y validación del PR #43 de este monorepo, extendidas a producción, transacciones SQL e integración con la aplicación. Las credenciales se cargan desde un archivo privado fuera del repositorio en AWS.

Webhook: `https://api.somoscomanda.com/api/billing/webhook`.
Checkout de contratación: `https://admin.somoscomanda.com/pagos?plan=base`.
Mensualidad: `https://admin.somoscomanda.com/pagos?modo=mensualidad` (requiere sesión del restaurante).

No hay débitos automáticos. El primer pago real lo realiza personalmente el propietario; la validación automática no sustituye la comprobación de ese pago en Wompi.
