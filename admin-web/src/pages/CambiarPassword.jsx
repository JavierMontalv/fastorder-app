import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usuariosApi from '../api/usuariosApi';

const PASSWORD_RULES = [
  {
    id: 'length',
    label: 'Minimo 8 caracteres',
    test: (value) => value.length >= 8
  },
  {
    id: 'upper',
    label: 'Al menos una mayuscula',
    test: (value) => /[A-Z]/.test(value)
  },
  {
    id: 'lower',
    label: 'Al menos una minuscula',
    test: (value) => /[a-z]/.test(value)
  },
  {
    id: 'number',
    label: 'Al menos un numero',
    test: (value) => /\d/.test(value)
  },
  {
    id: 'symbol',
    label: 'Al menos un simbolo',
    test: (value) => /[!@#$%^&*()_\-+={}[\]|:;"'<>,.?/~`]/.test(value)
  }
];

const resolveApiError = (error) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.data?.message) return error.data.message;
  if (Array.isArray(error?.response?.data?.errors) && error.response.data.errors[0]?.msg) {
    return error.response.data.errors[0].msg;
  }
  if (Array.isArray(error?.data?.errors) && error.data.errors[0]?.msg) {
    return error.data.errors[0].msg;
  }
  if (error?.message) return error.message;
  return 'No fue posible cambiar la contrasena.';
};

function RuleItem({ label, passed }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition ${
        passed
          ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
          : 'border-white/8 bg-white/[0.03] text-white/60'
      }`}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
          passed ? 'bg-emerald-300/20 text-emerald-200' : 'bg-white/10 text-white/35'
        }`}
      >
        {passed ? 'OK' : '•'}
      </span>
      <span>{label}</span>
    </div>
  );
}

export default function CambiarPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('comanda_token');

    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const passwordChecks = useMemo(
    () =>
      PASSWORD_RULES.map((rule) => ({
        id: rule.id,
        label: rule.label,
        passed: rule.test(password)
      })),
    [password]
  );

  const allChecksPassed = passwordChecks.every((item) => item.passed);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!password || !confirmacion) {
      setError('Completa ambos campos para continuar.');
      return;
    }

    if (password !== confirmacion) {
      setError('Las contrasenas no coinciden.');
      return;
    }

    if (!allChecksPassed) {
      setError('La nueva contrasena aun no cumple la politica de seguridad.');
      return;
    }

    try {
      setEnviando(true);
      setError('');

      await usuariosApi.cambiarPassword({
        nuevaPassword: password
      });

      setOk(true);

      setTimeout(() => {
        window.location.replace('/');
      }, 1100);
    } catch (err) {
      console.error('Error cambiar password:', err);
      setError(resolveApiError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090f] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,91,43,0.28),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(62,90,255,0.2),transparent_28%),linear-gradient(180deg,#090c14_0%,#05070c_100%)]" />
        <div className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.08]" />

        <div className="relative mx-auto grid min-h-screen max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
          <section className="flex flex-col justify-between rounded-[36px] border border-white/10 bg-white/[0.03] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/65">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ff6a3d]" />
                Acceso protegido
              </div>

              <h1 className="mt-8 max-w-xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                Define una nueva clave y activa tu acceso seguro
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/65">
                Estas ingresando con una credencial temporal. Antes de continuar al panel administrativo, Comanda te
                pide establecer una contrasena exclusiva para esta cuenta.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-3 text-sm font-semibold text-white">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff6a3d]/15 text-lg text-[#ff6a3d]">
                    S
                  </span>
                  Cambio obligatorio
                </div>
                <p className="mt-3 text-sm leading-6 text-white/60">
                  La clave temporal queda invalidada apenas completes este paso.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-3 text-sm font-semibold text-white">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7c8cff]/15 text-lg text-[#9aa6ff]">
                    K
                  </span>
                  Politica premium
                </div>
                <p className="mt-3 text-sm leading-6 text-white/60">
                  Exigimos una combinacion fuerte para proteger la operacion y el acceso administrativo.
                </p>
              </div>
            </div>
          </section>

          <section className="flex items-center">
            <div className="w-full rounded-[36px] border border-white/10 bg-[#10141d]/95 p-8 shadow-[0_28px_100px_rgba(0,0,0,0.4)] backdrop-blur-xl">
              <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/45">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ff6437,#ff2f2f)] shadow-[0_12px_30px_rgba(255,78,43,0.35)]">
                  <span className="text-sm font-bold text-white">CP</span>
                </span>
                Primer ingreso
              </div>

              <h2 className="mt-6 text-3xl font-semibold text-white">Actualizar contrasena</h2>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Completa este paso una sola vez. Al guardar, te redirigiremos al login para entrar con tu nueva clave.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                    Nueva contrasena
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-14 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-white outline-none transition placeholder:text-white/25 focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/20"
                    placeholder="Escribe tu nueva clave"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                    Confirmar contrasena
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmacion}
                    onChange={(event) => setConfirmacion(event.target.value)}
                    className="h-14 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-white outline-none transition placeholder:text-white/25 focus:border-[#7c8cff] focus:ring-2 focus:ring-[#7c8cff]/20"
                    placeholder="Repite la nueva clave"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {passwordChecks.map((item) => (
                    <RuleItem key={item.id} label={item.label} passed={item.passed} />
                  ))}
                </div>

                {error ? (
                  <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {error}
                  </div>
                ) : null}

                {ok ? (
                  <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    Contrasena actualizada correctamente. Entrando al panel administrativo.
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={enviando}
                  className="h-14 w-full rounded-2xl bg-[linear-gradient(135deg,#ff6a3d,#ff3d2b)] text-base font-semibold text-white shadow-[0_18px_40px_rgba(255,87,51,0.35)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enviando ? 'Actualizando acceso...' : 'Guardar nueva contrasena'}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
