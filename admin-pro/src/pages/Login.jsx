// src/pages/Login.jsx
import { useState } from "react";
import useAuth from "../context/useAuth";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Logo from "../components/ui/Logo";

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-lg border border-gray-200">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo size={50} textSize="text-2xl" />
        </div>

        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Iniciar Sesión
        </h2>
        <p className="text-gray-500 text-center mb-6">
          Panel administrativo FastOrder
        </p>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <Input
            label="Correo Electrónico"
            value={email}
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@fastorder.com"
          />

          <Input
            label="Contraseña"
            value={password}
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
          />

          <Button
            variant="primary"
            disabled={loading}
            className="w-full justify-center"
            type="submit"
          >
            {loading ? "Ingresando..." : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          © {new Date().getFullYear()} FastOrder – Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
