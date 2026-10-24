import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/ComandaInicio.css';

export default function AdminLogin() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  useEffect(() => { document.title = 'Ingresar a mi restaurante | Comanda'; }, []);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const destination = await login({ ...form, email: form.email.trim() });
      navigate(destination || '/', { replace: true });
    } catch (err) {
      setError(err.status === 401 ? 'El correo o la contraseña no son correctos. Intenta nuevamente.' : err.message || 'No pudimos ingresar. Intenta nuevamente.');
    } finally { setBusy(false); }
  }

  return <div className="cm-public cm-access">
    <header className="cm-nav"><Link className="cm-brand" to="/inicio"><img src="/brand/comanda-icon.png" alt="" /><strong>comanda</strong></Link><Link className="cm-text-link" to="/inicio">← Volver a Inicio</Link></header>
    <main className="cm-access-grid">
      <section className="cm-access-story"><span className="cm-eyebrow">EL DETRÁS DE CADA GRAN SERVICIO</span><h1>Tu restaurante.<br />Tu equipo.<br /><em>Todo conectado.</em></h1><p>Actualiza tu carta, organiza los pedidos y acompaña cada servicio desde un solo lugar.</p><div className="cm-access-note"><span>●</span><div><strong>Un espacio para tu operación</strong><p>Acceso para restaurantes con una demo o un plan activado y sus equipos autorizados.</p></div></div><small>Comanda, una solución de Brevia Tech.</small></section>
      <section className="cm-access-card" aria-labelledby="cm-access-title"><span className="cm-label">ADMINISTRACIÓN</span><h2 id="cm-access-title">Qué bueno tenerte<br />de vuelta.</h2><p>Ingresa con el correo de tu cuenta.</p>
        <form onSubmit={submit} aria-busy={busy}>
          <label htmlFor="cm-email">Correo electrónico</label><input id="cm-email" name="email" type="email" value={form.email} autoComplete="username" required maxLength={254} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="tu@restaurante.com" />
          <label htmlFor="cm-password">Contraseña</label><div className="cm-password"><input id="cm-password" name="password" type={visible ? 'text' : 'password'} value={form.password} autoComplete="current-password" required onChange={e => setForm({ ...form, password: e.target.value })} /><button type="button" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? 'Ocultar' : 'Ver'}</button></div>
          {error ? <p className="cm-error" role="alert">{error}</p> : null}
          <button className="cm-button" type="submit" disabled={busy}>{busy ? 'Ingresando…' : 'Entrar a mi restaurante →'}</button>
        </form>
        <a className="cm-text-link" href="mailto:comercial@somosbreviatech.com?subject=Ayuda%20con%20mi%20acceso%20a%20Comanda">¿Necesitas ayuda para ingresar?</a><div className="cm-access-divider" /><p>¿Todavía no tienes Comanda?<br /><Link className="cm-text-link" to="/inicio#planes">Conoce los planes o solicita una demo ↗</Link></p>
      </section>
    </main>
    <footer className="cm-access-footer">© {new Date().getFullYear()} Comanda · Brevia Tech SAS</footer>
  </div>;
}
