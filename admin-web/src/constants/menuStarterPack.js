export const MENU_STARTER_PACK = [
  {
    id: 'comida',
    nombre: 'Comida',
    descripcion:
      'Platos principales del negocio. Ideal para hamburguesas, perros calientes y referencias fuertes del menú.',
    icono: '🍔',
    accent: 'var(--starter-accent-comida)',
    helper: 'Apartado principal del menú',
    productos: [
      {
        nombre: 'Hamburguesa clásica',
        descripcion: 'Pan brioche, carne artesanal, queso cheddar, lechuga, tomate y salsa de la casa.',
        precio: 24900,
        destacado: true
      },
      {
        nombre: 'Hamburguesa doble carne',
        descripcion: 'Doble carne, doble queso, cebolla caramelizada y pepinillos.',
        precio: 32900,
        destacado: true
      },
      {
        nombre: 'Perro caliente especial',
        descripcion: 'Salchicha premium, queso, ripio de papa, tocineta y salsas.',
        precio: 18900
      },
      {
        nombre: 'Hamburguesa BBQ',
        descripcion: 'Carne artesanal, queso, tocineta crocante y salsa BBQ ahumada.',
        precio: 28900
      }
    ]
  },
  {
    id: 'bebidas',
    nombre: 'Bebidas',
    descripcion:
      'Bebidas rápidas para acompañar comidas y elevar el ticket promedio con opciones frías y especiales.',
    icono: '🥤',
    accent: 'var(--starter-accent-bebidas)',
    helper: 'Acompaña el pedido y aumenta ticket',
    productos: [
      {
        nombre: 'Gaseosa 400 ml',
        descripcion: 'Coca-Cola, Pepsi, Colombiana o manzana según disponibilidad.',
        precio: 6500
      },
      {
        nombre: 'Limonada natural',
        descripcion: 'Refrescante, balanceada y perfecta para comidas rápidas.',
        precio: 8900
      },
      {
        nombre: 'Malteada de vainilla',
        descripcion: 'Cremosa, fría y con topping ligero de crema.',
        precio: 12900,
        destacado: true
      },
      {
        nombre: 'Agua sin gas',
        descripcion: 'Botella personal de agua purificada.',
        precio: 4500
      }
    ]
  },
  {
    id: 'postres',
    nombre: 'Postres',
    descripcion:
      'Cierre dulce para la experiencia del cliente y una oportunidad clara de venta adicional.',
    icono: '🍰',
    accent: 'var(--starter-accent-postres)',
    helper: 'Cierre dulce y rentable',
    productos: [
      {
        nombre: 'Brownie con helado',
        descripcion: 'Brownie tibio con bola de helado de vainilla.',
        precio: 11900,
        destacado: true
      },
      {
        nombre: 'Cheesecake de frutos rojos',
        descripcion: 'Porción suave con salsa de frutos rojos.',
        precio: 12900
      },
      {
        nombre: 'Galleta rellena',
        descripcion: 'Galleta artesanal con centro cremoso de chocolate.',
        precio: 7900
      }
    ]
  },
  {
    id: 'promociones',
    nombre: 'Promociones',
    descripcion:
      'Sección visible para combos, ofertas y productos gancho que ayudan a vender más sin rehacer todo el menú.',
    icono: '🔥',
    accent: 'var(--starter-accent-promos)',
    helper: 'Ofertas y combos del negocio',
    productos: [
      {
        nombre: 'Combo clásico',
        descripcion: 'Hamburguesa clásica, papas a la francesa y bebida personal.',
        precio: 32900,
        destacado: true
      },
      {
        nombre: 'Combo doble',
        descripcion: 'Hamburguesa doble carne, papas grandes y gaseosa 400 ml.',
        precio: 38900,
        destacado: true
      },
      {
        nombre: 'Promo del día',
        descripcion: 'Producto sugerido para rotar campañas semanales o por horario.',
        precio: 19900
      }
    ]
  }
];
