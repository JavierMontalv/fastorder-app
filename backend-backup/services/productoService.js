// backend/services/productoService.js
// ======================================================
// 🛒 Servicio: Producto – FASTORDER Enterprise 2026
// ------------------------------------------------------
// Servicios profesionales para manejar productos con:
//  ✓ Inventario avanzado
//  ✓ SEO (slug)
//  ✓ Búsqueda tipo Shopify
//  ✓ Integración con Categorías
//  ✓ IA-ready (traducción / recomendaciones)
// ======================================================

'use strict';

const { Op } = require('sequelize');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const slugify = require('slugify');

// ======================================================
// Helpers
// ======================================================

const crearSlug = (nombre) =>
  slugify(nombre, { lower: true, strict: true }) + '-' + Math.floor(Math.random() * 9999);

const normalizarPayload = (data = {}) => {
  const limpio = { ...data };

  if (limpio.nombre) limpio.slug = crearSlug(limpio.nombre);

  if (limpio.precio) limpio.precio = Number(limpio.precio);
  if (limpio.costo) limpio.costo = Number(limpio.costo);

  if (limpio.stock) limpio.stock = Number(limpio.stock);
  if (limpio.stockMinimo) limpio.stockMinimo = Number(limpio.stockMinimo);

  return limpio;
};

// ======================================================
// Servicio principal
// ======================================================

const productoService = {
  // --------------------------------------------------
  // Crear producto
  // --------------------------------------------------
  async crearProducto(data) {
    const payload = normalizarPayload(data);

    const existeCategoria = await Categoria.findByPk(payload.categoriaId);
    if (!existeCategoria) {
      throw new Error('La categoría especificada no existe.');
    }

    const producto = await Producto.create(payload);
    return producto;
  },

  // --------------------------------------------------
  // Obtener producto por ID
  // --------------------------------------------------
  async obtenerProducto(id) {
    const producto = await Producto.findByPk(id, {
      include: [{ model: Categoria, as: 'categoria' }]
    });

    if (!producto) throw new Error('Producto no encontrado.');

    return producto;
  },

  // --------------------------------------------------
  // Listado con filtros pro
  // --------------------------------------------------
  async listarProductos(query = {}) {
    const {
      buscar = '',
      estado,
      categoriaId,
      destacado,
      visibleEnMenu,
      page = 1,
      limit = 20
    } = query;

    const filtros = {};

    if (buscar) {
      filtros[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { descripcion: { [Op.like]: `%${buscar}%` } },
        { sku: { [Op.like]: `%${buscar}%` } }
      ];
    }

    if (estado) filtros.estado = estado;
    if (destacado) filtros.destacado = destacado === 'true';
    if (visibleEnMenu) filtros.visibleEnMenu = visibleEnMenu === 'true';
    if (categoriaId) filtros.categoriaId = categoriaId;

    const offset = (page - 1) * limit;

    const productos = await Producto.findAndCountAll({
      where: filtros,
      include: [{ model: Categoria, as: 'categoria' }],
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      total: productos.count,
      paginaActual: Number(page),
      totalPaginas: Math.ceil(productos.count / limit),
      data: productos.rows
    };
  },

  // --------------------------------------------------
  // Actualizar producto
  // --------------------------------------------------
  async actualizarProducto(id, data) {
    const producto = await Producto.findByPk(id);
    if (!producto) throw new Error('Producto no encontrado.');

    const payload = normalizarPayload(data);

    await producto.update(payload);

    return producto;
  },

  // --------------------------------------------------
  // Eliminar producto
  // --------------------------------------------------
  async eliminarProducto(id) {
    const producto = await Producto.findByPk(id);
    if (!producto) throw new Error('Producto no encontrado.');

    await producto.destroy();
    return true;
  },

  // --------------------------------------------------
  // Actualizar Stock
  // --------------------------------------------------
  async actualizarStock(id, cantidad) {
    const producto = await Producto.findByPk(id);
    if (!producto) throw new Error('Producto no encontrado.');

    if (!producto.controlarStock)
      throw new Error('El stock de este producto no está siendo controlado.');

    const nuevoStock = producto.stock + Number(cantidad);

    if (nuevoStock < 0) throw new Error('Stock insuficiente.');

    await producto.update({
      stock: nuevoStock,
      alertaStockBajo: nuevoStock <= producto.stockMinimo
    });

    return producto;
  },

  // --------------------------------------------------
  // Productos destacados
  // --------------------------------------------------
  async obtenerDestacados() {
    return await Producto.findAll({
      where: { destacado: true, estado: 'activo', visibleEnMenu: true },
      limit: 15,
      order: [['createdAt', 'DESC']]
    });
  },

  // --------------------------------------------------
  // Productos por categoría
  // --------------------------------------------------
  async productosPorCategoria(categoriaId) {
    return await Producto.findAll({
      where: {
        categoriaId,
        estado: 'activo',
        visibleEnMenu: true
      },
      order: [['nombre', 'ASC']]
    });
  },

  // --------------------------------------------------
  // Modo POS (solo activos visibles)
  // --------------------------------------------------
  async productosPOS() {
    return await Producto.findAll({
      where: {
        estado: 'activo',
        visibleEnPOS: true
      },
      order: [['nombre', 'ASC']]
    });
  }
};

module.exports = productoService;
