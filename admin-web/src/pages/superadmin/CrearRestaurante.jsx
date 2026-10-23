// admin-web/src/pages/superadmin/CrearRestaurante.jsx
// ======================================================================
// 🏪 Crear Restaurante — SUPERADMIN
// ======================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';

export default function CrearRestaurante() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '',
    emailAdmin: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ======================================================
  // 📝 Manejo de formulario
  // ======================================================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // ======================================================
  // 🚀 Crear restaurante
  // ======================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.nombre || !form.emailAdmin) {
      setError('Todos los campos son obligatorios');
      return;
    }

    try {
      setLoading(true);

      await api.post('/superadmin/restaurantes', {
        nombre: form.nombre,
        emailAdmin: form.emailAdmin
      });

      navigate('/superadmin/restaurantes');
    } catch (err) {
      setError(err?.response?.data?.message || 'Error creando el restaurante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Crear restaurante</h1>
        <p className="text-gray-500">Alta de un nuevo cliente en COMANDA</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del restaurante
          </label>
          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email del administrador
          </label>
          <input
            type="email"
            name="emailAdmin"
            value={form.emailAdmin}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
          />
          <p className="text-xs text-gray-400 mt-1">Se creará automáticamente un usuario ADMIN</p>
        </div>

        <div className="border rounded p-4 bg-gray-50 text-sm text-gray-600">
          <p className="font-medium mb-1">Plan inicial asignado</p>
          <ul className="list-disc list-inside">
            <li>
              Plan: <strong>FREE</strong>
            </li>
            <li>IA deshabilitada</li>
            <li>
              Estado: <strong>TRIAL / ACTIVA</strong>
            </li>
          </ul>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/superadmin/restaurantes')}
            className="px-4 py-2 rounded border text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700"
          >
            {loading ? 'Creando...' : 'Crear restaurante'}
          </button>
        </div>
      </form>
    </div>
  );
}
