// admin-web/src/pages/onboarding/Onboarding.jsx
// ======================================================================
// 🚀 Onboarding — COMANDA ENTERPRISE 2026
// ======================================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

import PASOS_ONBOARDING from './Pasos';

export default function Onboarding() {
  const navigate = useNavigate();
  const { usuario, redirigirSegunRol } = useAuth();

  const [paso, setPaso] = useState(0);
  const [loading, setLoading] = useState(false);

  // ======================================================
  // 🏁 Si ya completó onboarding → redirigir
  // ======================================================
  useEffect(() => {
    if (usuario?.onboarding_completado) {
      redirigirSegunRol(usuario);
    }
  }, [usuario, redirigirSegunRol]);

  // ======================================================
  // 👉 Avanzar paso
  // ======================================================
  const siguiente = () => {
    setPaso((prev) => Math.min(prev + 1, PASOS_ONBOARDING.length - 1));
  };

  // ======================================================
  // 🚀 Finalizar onboarding
  // ======================================================
  const finalizarOnboarding = async () => {
    try {
      setLoading(true);
      await api.post('/restaurante/onboarding');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      alert('Error completando onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center">
      <div className="bg-white rounded shadow max-w-3xl w-full p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Configura tu restaurante</h1>
          <p className="text-gray-500">Sigue estos pasos para dejar tu negocio listo en minutos</p>
        </div>

        {/* ======================================================
             PROGRESO
        ====================================================== */}
        <div className="flex items-center mb-8">
          {PASOS_ONBOARDING.map((pasoItem, index) => (
            <div key={pasoItem.key} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${
                  index <= paso ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {pasoItem.id}
              </div>

              {index < PASOS_ONBOARDING.length - 1 && (
                <div className={`flex-1 h-1 ${index < paso ? 'bg-orange-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* ======================================================
             CONTENIDO POR PASO
        ====================================================== */}
        <div className="min-h-[200px]">
          {paso === 0 && <PasoDatosNegocio onNext={siguiente} />}
          {paso === 1 && <PasoCategorias onNext={siguiente} />}
          {paso === 2 && <PasoPrimerProducto onNext={siguiente} />}
          {paso === 3 && <PasoQR onNext={siguiente} />}
          {paso === 4 && <PasoFinal loading={loading} onFinish={finalizarOnboarding} />}
        </div>
      </div>
    </div>
  );
}

// ======================================================================
// 🧩 PASO 1 — DATOS DEL NEGOCIO
// ======================================================================
function PasoDatosNegocio({ onNext }) {
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    direccion: ''
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const guardar = async () => {
    if (!form.nombre) {
      alert('El nombre es obligatorio');
      return;
    }

    await api.put('/restaurante', form);
    onNext();
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Datos del negocio</h2>

      <div className="space-y-3">
        <input
          name="nombre"
          placeholder="Nombre del restaurante"
          value={form.nombre}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />

        <input
          name="telefono"
          placeholder="Teléfono"
          value={form.telefono}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />

        <input
          name="direccion"
          placeholder="Dirección"
          value={form.direccion}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div className="mt-6 text-right">
        <button onClick={guardar} className="bg-orange-600 text-white px-4 py-2 rounded">
          Guardar y continuar →
        </button>
      </div>
    </div>
  );
}

// ======================================================================
// 🧩 PASO 2 — CATEGORÍAS
// ======================================================================
function PasoCategorias({ onNext }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Crea tus categorías</h2>
      <p className="text-gray-500 mb-4">Puedes crear categorías ahora o después desde el panel.</p>

      <div className="mt-6 text-right">
        <button onClick={onNext} className="bg-orange-600 text-white px-4 py-2 rounded">
          Continuar →
        </button>
      </div>
    </div>
  );
}

// ======================================================================
// 🧩 PASO 3 — PRIMER PRODUCTO
// ======================================================================
function PasoPrimerProducto({ onNext }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Agrega tu primer producto</h2>

      <p className="text-gray-500 mb-4">Esto ayudará a que tu menú no esté vacío.</p>

      <div className="mt-6 text-right">
        <button onClick={onNext} className="bg-orange-600 text-white px-4 py-2 rounded">
          Continuar →
        </button>
      </div>
    </div>
  );
}

// ======================================================================
// 🧩 PASO 4 — QR / MENÚ
// ======================================================================
function PasoQR({ onNext }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Revisa tu menú QR</h2>

      <p className="text-gray-500 mb-4">Tu menú ya está disponible vía QR y enlace público.</p>

      <div className="mt-6 text-right">
        <button onClick={onNext} className="bg-orange-600 text-white px-4 py-2 rounded">
          Continuar →
        </button>
      </div>
    </div>
  );
}

// ======================================================================
// 🎉 PASO FINAL — COMPLETADO
// ======================================================================
function PasoFinal({ onFinish, loading }) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">¡Todo listo! 🎉</h2>

      <p className="text-gray-500 mb-6">
        Tu restaurante ya está configurado y listo para recibir pedidos.
      </p>

      <button
        onClick={onFinish}
        disabled={loading}
        className="bg-green-600 text-white px-6 py-3 rounded text-lg"
      >
        {loading ? 'Finalizando...' : 'Ir al dashboard'}
      </button>
    </div>
  );
}
