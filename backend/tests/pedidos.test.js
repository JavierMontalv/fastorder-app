// backend/tests/pedidos.test.js
// ======================================================
// 🧪 Tests: Pedidos – FASTORDER
// ------------------------------------------------------
// Validación, flujos POS, estados, productos.
// ======================================================

"use strict";

const request = require("supertest");
const app = require("../index");
const { sequelize } = require("../config/db");

const Usuario = require("../models/Usuario");
const Producto = require("../models/Producto");
const Categoria = require("../models/Categoria");
const Pedido = require("../models/Pedido");

describe("PEDIDOS TEST SUITE", () => {
  let token;
  let productoId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Crear datos base
    const user = await Usuario.create({
      nombre: "Admin Pedido",
      email: "pedido@test.com",
      password: "123456",
      rol: "admin"
    });

    const categoria = await Categoria.create({
      nombre: "Bebidas",
      slug: "bebidas"
    });

    const producto = await Producto.create({
      nombre: "Coca Cola",
      precio: 4500,
      categoriaId: categoria.id
    });

    productoId = producto.id;

    // Login para obtener token
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "pedido@test.com", password: "123456" });

    token = login.body.token;
  });

  // ----------------------
  // CREAR PEDIDO CORRECTO
  // ----------------------
  test("Crear pedido correctamente", async () => {
    const res = await request(app)
      .post("/api/pedidos")
      .set("Authorization", `Bearer ${token}`)
      .send({
        items: [
          { productoId, cantidad: 2 }
        ]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty("id");
  });

  // ----------------------
  // ERROR: ITEMS VACÍOS
  // ----------------------
  test("Error si items está vacío", async () => {
    const res = await request(app)
      .post("/api/pedidos")
      .set("Authorization", `Bearer ${token}`)
      .send({ items: [] });

    expect(res.statusCode).toBe(400);
  });

  // ----------------------
  // LISTAR PEDIDOS
  // ----------------------
  test("Obtener pedidos", async () => {
    const res = await request(app)
      .get("/api/pedidos")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  // ----------------------
  // CAMBIAR ESTADO
  // ----------------------
  test("Cambiar estado del pedido", async () => {
    const pedido = await Pedido.findOne();

    const res = await request(app)
      .put(`/api/pedidos/${pedido.id}/estado`)
      .set("Authorization", `Bearer ${token}`)
      .send({ estado: "preparacion" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.estado).toBe("preparacion");
  });

});
