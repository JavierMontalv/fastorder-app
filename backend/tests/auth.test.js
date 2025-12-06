// backend/tests/auth.test.js
// ======================================================
// 🧪 Tests: Autenticación – FASTORDER
// ------------------------------------------------------
// Nivel enterprise (JWT, errores, flujos reales)
// ======================================================

"use strict";

const request = require("supertest");
const app = require("../index"); // tu app express exportada
const { sequelize } = require("../config/db");
const Usuario = require("../models/Usuario");

describe("AUTH TEST SUITE", () => {

  beforeAll(async () => {
    // Base de datos limpia
    await sequelize.sync({ force: true });

    // Crear usuario de pruebas
    await Usuario.create({
      nombre: "Admin Test",
      email: "admin@test.com",
      password: "123456",
      rol: "admin"
    });
  });

  // ----------------------
  // LOGIN CORRECTO
  // ----------------------
  test("Login correcto devuelve token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@test.com",
        password: "123456"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  // ----------------------
  // LOGIN USUARIO INEXISTENTE
  // ----------------------
  test("Login falla si el email no existe", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "noexiste@test.com",
        password: "123456"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/no existe/i);
  });

  // ----------------------
  // LOGIN PASSWORD ERRÓNEA
  // ----------------------
  test("Login falla si la contraseña es incorrecta", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@test.com",
        password: "incorrecta"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/credenciales inválidas/i);
  });

  // ----------------------
  // PERFIL CON TOKEN
  // ----------------------
  test("Devuelve perfil con token válido", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@test.com",
        password: "123456"
      });

    const token = login.body.token;

    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("usuario");
  });

  // ----------------------
  // PERFIL SIN TOKEN = ERROR
  // ----------------------
  test("Bloquea acceso a profile sin token", async () => {
    const res = await request(app).get("/api/auth/profile");

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/token/i);
  });

});
