# COMANDA: preparación Wompi Sandbox

Estado: componente de seguridad probado localmente; NO conectado a las rutas de AWS, NO desplegado y NO habilita cobros. No es aún una integración completa.

## Decisiones

- Checkout hospedado en Wompi. COMANDA no recibe ni almacena números de tarjetas o CVV.
- Precios y referencia salen de un registro persistido por el servidor, con importe en centavos y entorno explícito. Nunca confiar en el importe del navegador.
- Solo Sandbox (`pub_test_`), deshabilitado por defecto; no hay opción de producción en este módulo.
- Firma de integridad generada en backend; firma de eventos SHA256 con comparación de tiempo constante. Consulta independiente de la transacción antes de aprobar.
- Primer alcance propuesto: pago de un período mensual. Este componente NO implementa débitos automáticos recurrentes.
- Sin dependencias adicionales, sin nuevas máquinas ni recursos AWS creados.

## Verificación

Desde esta carpeta: `node --test` (Node >=20). Los datos de prueba son fixtures inventados, nunca credenciales de comercio. Las pruebas no realizan solicitudes de red.

## Hallazgos que impiden habilitarlo directamente

La copia local descargada de producción (`diagnostico/fuente-produccion/controllers/comercialController.js`) contiene el checkout comercial que no aparece en los árboles actuales de GitHub de `fastorder-app/backend`, `fastorder-backend` ni en el respaldo privado consultado. Es necesario recuperar y contrastar la revisión actual de AWS antes de integrar; esta copia local puede haber quedado desactualizada.

En esa copia, el webhook usa HMAC del JSON en vez de la firma documentada por Wompi y responde 200 incluso ante errores internos. La aprobación tampoco compara de manera suficiente el importe, moneda y entorno del pago con el checkout persistido. No basta con añadir llaves.

## Trabajo restante para integración y despliegue

1. Recuperar código vigente sin `.env`, contrastar hashes, establecer rama con la base correcta; no reemplazar AWS con el backend antiguo de GitHub.
2. Añadir a la persistencia del checkout el entorno `test`, moneda y precio inmutables. Los pagos Sandbox jamás activarán restaurantes o planes reales; usar datos/tenant de prueba aislados.
3. Crear checkout con importe del catálogo del servidor, referencia única y claim aleatorio almacenado como hash; llamar `hostedCheckout`. No guardar contraseñas en metadata ni enviarlas a Wompi. Restringir redirects a rutas conocidas del frontend y evitar claims en logs/referers.
4. Conectar un POST de eventos Sandbox con JSON limitado (por ejemplo 64 KB), validación de firma y consulta por ID usando `verifiedApprovedTransaction`. Buscar checkout por referencia exacta y entorno, no por un OR con link de pago. No usar el redirect como prueba de pago.
5. Dentro de una única transacción SQL, bloquear checkout con SELECT FOR UPDATE, volver a comprobar importe/moneda/entorno y asociación de tenant, registrar ID de transacción con índice único y activar exactamente una vez. Reintentos aprobados deben devolver 200 sin extender otro período; eventos atrasados no deben degradar un plan activado. No activar antes del commit.
6. Retornar 200 tras persistencia exitosa o duplicado confirmado; 401 para firma inválida, 503 ante error transitorio del proveedor/DB para permitir reintentos. No registrar payloads, secretos, claims ni datos personales completos.
7. Añadir pruebas con DB de concurrencia, doble webhook, fallo/rollback y aislamiento de tenants. Las pruebas de este paquete verifican el módulo, no sustituyen esas pruebas del sistema.
8. Desplegar endpoint de pruebas aislado, probar extremo a extremo con medios Sandbox (aprobado, rechazado, pendiente). Solo entonces configurar URL de eventos de Sandbox. Producción requiere validación separada y habilitación explícita posterior.

## Configuración que necesita el operador

En Wompi activar modo de pruebas y comprobar prefijo `pub_test_`. La captura recibida muestra `pub_prod_`, por lo que no acredita Sandbox activo.

Cargar directamente en el entorno privado del backend de pruebas los tres valores de `.env.example`: llave pública Sandbox, secreto de integridad y secreto de eventos Sandbox. No enviarlos por chat ni capturas, no ponerlos en VITE_*, commits, comandos con valores literales o logs. Esta modalidad hospedada no necesita llave privada. Un archivo runtime fuera del repositorio, propietario del servicio y permisos 0600, o el mecanismo de secretos ya disponible en AWS, evita añadir infraestructura solo para esta etapa.

No se ha cambiado la URL de eventos de Wompi. El endpoint definitivo solo se entregará después de desplegarlo y comprobarlo; no copiar una URL inventada al dashboard.

## Fuentes oficiales

- https://docs.wompi.co/docs/colombia/ambientes-y-llaves/
- https://docs.wompi.co/docs/colombia/widget-checkout-web/
- https://docs.wompi.co/docs/colombia/eventos/
- https://docs.wompi.co/docs/colombia/transacciones/
