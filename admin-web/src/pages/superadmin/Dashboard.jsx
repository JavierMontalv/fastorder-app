// admin-web/src/pages/superadmin/Dashboard.jsx
// ======================================================================
// SuperAdmin Dashboard legacy
// ----------------------------------------------------------------------
// Mantiene compatibilidad, pero usa el contrato real del backend:
//  - /estado controla el acceso operativo del restaurante
// ======================================================================

import { useEffect, useState } from 'react';
import {
  actualizarEstadoRestaurante,
  crearRestaurante as crearRestauranteService,
  obtenerRestaurantes
} from '../../services/superadminService';

export default function SuperadminDashboard() {
  const [restaurantes, setRestaurantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    cargarRestaurantes();
  }, []);

  const cargarRestaurantes = async () => {
    try {
      setLoading(true);
      setRestaurantes(await obtenerRestaurantes());
    } catch (error) {
      console.error('Error cargando restaurantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const crearRestaurante = async () => {
    const nombreRestaurante = prompt('Nombre del restaurante');
    const nombreAdmin = prompt('Nombre del administrador');
    const emailAdmin = prompt('Email del administrador');

    if (!nombreRestaurante || !nombreAdmin || !emailAdmin) return;

    try {
      setCreando(true);
      await crearRestauranteService({
        nombreRestaurante,
        nombreAdmin,
        emailAdmin
      });
      await cargarRestaurantes();
    } catch (_error) {
      alert('Error creando restaurante');
    } finally {
      setCreando(false);
    }
  };

  const toggleEstado = async (restaurante) => {
    const siguienteEstado = restaurante.estado === 'activo' ? 'suspendido' : 'activo';
    const accion = siguienteEstado === 'activo' ? 'reactivar' : 'suspender';
    const confirmar = window.confirm(`¿Deseas ${accion} este restaurante?`);
    if (!confirmar) return;

    try {
      await actualizarEstadoRestaurante(restaurante.id, siguienteEstado);
      await cargarRestaurantes();
    } catch (_error) {
      alert('Error actualizando estado');
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Cargando restaurantes...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel SuperAdmin</h1>
          <p className="text-gray-500">
            Gestion individual por restaurante, separando acceso operativo y contrato comercial.
          </p>
        </div>

        <button
          onClick={crearRestaurante}
          disabled={creando}
          className="rounded bg-orange-600 px-4 py-2 text-white transition hover:bg-orange-700"
        >
          + Crear restaurante
        </button>
      </div>

      <div className="overflow-x-auto rounded bg-white shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Restaurante</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Operacion</th>
              <th className="px-4 py-3">Suscripcion</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {restaurantes.map((restaurante) => (
              <tr key={restaurante.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{restaurante.nombre}</div>
                  <div className="text-xs text-gray-400">{restaurante.slug}</div>
                </td>

                <td className="px-4 py-3 text-center">
                  <span className="rounded bg-gray-100 px-2 py-1">
                    {restaurante.plan?.toUpperCase()}
                  </span>
                </td>

                <td className="px-4 py-3 text-center">
                  <span
                    className={`rounded px-2 py-1 text-xs ${
                      restaurante.estado === 'activo'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {restaurante.estado}
                  </span>
                </td>

                <td className="px-4 py-3 text-center">
                  <span
                    className={`rounded px-2 py-1 text-xs ${
                      restaurante.estadoSuscripcion === 'activa' ||
                      restaurante.estadoSuscripcion === 'trial'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {restaurante.estadoSuscripcion}
                  </span>
                </td>

                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleEstado(restaurante)}
                    className="text-blue-600 hover:underline"
                  >
                    {restaurante.estado === 'activo' ? 'Suspender acceso' : 'Reactivar acceso'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
