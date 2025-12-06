// src/services/authService.js
import api from "./http";

export async function loginRequest(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

export async function getProfileRequest() {
  const { data } = await api.get("/auth/profile");
  return data.user;
}
