export const LEGAL_ACCEPTANCE_VERSION = 'COMANDA-COMERCIAL-2026-05-09';

export const commercialLegalDocuments = [
  {
    key: 'terms',
    title: 'Términos y condiciones',
    shortTitle: 'Términos',
    subtitle: 'Reglas de uso, pagos, suspensión, responsabilidad del restaurante y aceptación electrónica.',
    sections: [
      {
        heading: 'Uso de COMANDA',
        body:
          'COMANDA es una plataforma SaaS operada por BREVIA TECH SAS para menú QR, pedidos, administración comercial y herramientas asociadas. El cliente usa el servicio bajo el plan contratado, sin adquirir propiedad sobre el software, código, marca, documentación o arquitectura.'
      },
      {
        heading: 'Información comercial',
        body:
          'El restaurante es responsable de mantener actualizados productos, precios, disponibilidad, imágenes, promociones, impuestos y condiciones publicadas para sus consumidores.'
      },
      {
        heading: 'Pagos y activación',
        body:
          'La activación puede depender del pago, validación comercial, confirmación de pasarela y disponibilidad técnica. La falta de pago, uso indebido o riesgo de seguridad puede generar suspensión o terminación del servicio.'
      },
      {
        heading: 'Aceptación electrónica',
        body:
          'La compra, el pago, la creación de cuenta, la activación del servicio o la marcación de aceptación constituyen aceptación por mensaje de datos conforme a la Ley 527 de 1999.'
      }
    ]
  },
  {
    key: 'contract',
    title: 'Contrato SaaS',
    shortTitle: 'Contrato SaaS',
    subtitle: 'Condiciones principales del servicio entre el restaurante cliente y BREVIA TECH SAS.',
    sections: [
      {
        heading: 'Objeto',
        body:
          'BREVIA TECH SAS concede un acceso temporal, no exclusivo, no transferible y revocable a COMANDA para operar funcionalidades de menú QR, productos, pedidos, usuarios y herramientas comerciales según el plan seleccionado.'
      },
      {
        heading: 'Obligaciones del cliente',
        body:
          'El cliente debe suministrar información veraz, administrar usuarios y permisos, obtener autorizaciones de datos personales cuando corresponda y no copiar, revender, sublicenciar, descompilar ni explotar COMANDA fuera del alcance contratado.'
      },
      {
        heading: 'Propiedad intelectual',
        body:
          'COMANDA, su software, documentación, interfaces, estructura funcional y elementos protegibles pertenecen a BREVIA TECH SAS o a sus respectivos titulares. El cliente conserva su información comercial y contenido propio.'
      }
    ]
  },
  {
    key: 'privacy',
    title: 'Política de tratamiento de datos',
    shortTitle: 'Privacidad',
    subtitle: 'Tratamiento de datos personales, roles responsable/encargado y derechos del titular.',
    sections: [
      {
        heading: 'Responsable y encargado',
        body:
          'BREVIA TECH SAS actúa como responsable frente a datos comerciales, contractuales, soporte, facturación y comunicaciones propias. Cuando el restaurante cargue o recolecte datos de sus clientes o usuarios, el restaurante será responsable y BREVIA TECH SAS actuará como encargado, salvo finalidad propia informada.'
      },
      {
        heading: 'Finalidades',
        body:
          'Los datos se usan para crear y administrar cuentas, prestar el servicio, gestionar pagos, soporte, seguridad, facturación, comunicaciones autorizadas y cumplimiento legal.'
      },
      {
        heading: 'Derechos del titular',
        body:
          'El titular puede conocer, actualizar, rectificar, solicitar prueba de autorización, revocar autorización o solicitar supresión cuando proceda, y presentar quejas ante la Superintendencia de Industria y Comercio.'
      }
    ]
  }
];

export const legalDocumentKeys = commercialLegalDocuments.map((doc) => doc.key);
