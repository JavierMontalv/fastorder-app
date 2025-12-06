// src/context/AuthProvider.jsx
import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { loginRequest, getProfileRequest } from "../services/authService";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("fastorder_token"));
  const [loading, setLoading] = useState(true);

  // =====================================
  // 🚀 Restaurar sesión desde el token
  // =====================================
  useEffect(() => {
    const loadSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const perfil = await getProfileRequest(token);
        setUser(perfil);
      } catch (err) {
        localStorage.removeItem("fastorder_token");
        setUser(null);
        setToken(null);
      }

      setLoading(false);
    };

    loadSession();
  }, [token]);

  // =====================================
  // 🔐 LOGIN
  // =====================================
  const login = async (email, password) => {
    try {
      setLoading(true);

      const data = await loginRequest(email, password);

      localStorage.setItem("fastorder_token", data.token);
      setToken(data.token);
      setUser(data.user);

      return true;
    } catch (err) {
      console.error("❌ Error en login:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // 🚪 LOGOUT
  // =====================================
  const logout = () => {
    localStorage.removeItem("fastorder_token");
    setUser(null);
    setToken(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
