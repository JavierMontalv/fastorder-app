import { useEffect, useMemo, useRef, useState } from 'react';
import { FiCalendar, FiCheck, FiEdit3, FiPlus, FiTrash2, FiUsers, FiX, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { listarMesas } from '../api/mesaApi';
import { actualizarReserva, crearReserva, eliminarReserva, listarReservas } from '../api/reservasApi';
import SalonVisual from '../components/SalonVisual';
import { RESERVA_ESTADOS, RESERVA_ORIGENES, prepararReserva, toLocalInput, validarReserva } from '../utils/reservas.mjs';
import '../styles/Reservas.css';
import '../styles/ReservasWorkspace.css';

const EMPTY_FORM = { clienteNombre: '', clienteTelefono: '', clienteEmail: '', mesaId: '', fechaHoraInicio: '', fechaHoraFin: '', numeroPersonas: 2, estado: 'pendiente', origen: 'telefono', notas: '' };
const ACTIVAS = ['pendiente', 'confirmada', 'sentada'];
const CERRADAS = ['completada', 'cancelada', 'no_asistio'];
const errorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;
function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Horario por revisar' : new Intl.DateTimeFormat('es-CO', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(date);
}
export default function Reservas() {
  const [reservas, setReservas] = useState([]), [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('activas'), [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false), [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM), [fieldErrors, setFieldErrors] = useState({});
  const [loadError, setLoadError] = useState(''), [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const deleteDialogRef = useRef(null);
  const drawerRef = useRef(null), requestVersion = useRef(0), submitLock = useRef(false), deleteLock = useRef(false);
  const load = async () => {
    const version = ++requestVersion.current;
    setLoading(true); setLoadError('');
    try {
      const [r, m] = await Promise.all([listarReservas(), listarMesas()]);
      if (version !== requestVersion.current) return;
      const agenda = r?.data?.data, tables = m?.data?.data || m?.data;
      if (!Array.isArray(agenda) || !Array.isArray(tables)) throw new Error('La respuesta de la agenda no es válida.');
      setReservas(agenda); setMesas(tables);
    } catch (error) { if (version === requestVersion.current) setLoadError(errorMessage(error, 'No fue posible cargar las reservas.')); }
    finally { if (version === requestVersion.current) setLoading(false); }
  };
  useEffect(() => { load(); return () => { requestVersion.current += 1; }; }, []);
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.activeElement;
    drawerRef.current?.querySelector('input')?.focus();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = oldOverflow; previous?.focus?.(); };
  }, [drawerOpen]);
  useEffect(() => {
    if (!deleteTarget) return;
    const previous = document.activeElement;
    deleteDialogRef.current?.querySelector('button')?.focus();
    return () => previous?.focus?.();
  }, [deleteTarget]);
  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es');
    return reservas.filter((item) => filter === 'todas' || (filter === 'cerradas' ? CERRADAS : ACTIVAS).includes(item.estado))
      .filter((item) => !query || [item.clienteNombre, item.clienteTelefono, item.clienteEmail, item.mesa?.numero].some((value) => String(value ?? '').toLocaleLowerCase('es').includes(query)))
      .sort((a, b) => new Date(a.fechaHoraInicio) - new Date(b.fechaHoraInicio));
  }, [filter, search, reservas]);
  const counts = useMemo(() => ({ activas: reservas.filter((r) => ACTIVAS.includes(r.estado)).length,
    hoy: reservas.filter((r) => new Date(r.fechaHoraInicio).toDateString() === new Date().toDateString()).length,
    personas: reservas.filter((r) => ACTIVAS.includes(r.estado)).reduce((sum, r) => sum + Number(r.numeroPersonas || 0), 0) }), [reservas]);
  const openCreate = () => {
    const start = new Date(Date.now() + 3600000); start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
    setEditingId(null); setFieldErrors({}); setFormError('');
    setForm({ ...EMPTY_FORM, fechaHoraInicio: toLocalInput(start), fechaHoraFin: toLocalInput(new Date(start.getTime() + 5400000)) }); setDrawerOpen(true);
  };
  const openEdit = (r) => {
    setEditingId(r.id); setFieldErrors({}); setFormError('');
    setForm({ clienteNombre: r.clienteNombre || '', clienteTelefono: r.clienteTelefono || '', clienteEmail: r.clienteEmail || '', mesaId: r.mesaId || '', fechaHoraInicio: toLocalInput(r.fechaHoraInicio), fechaHoraFin: toLocalInput(r.fechaHoraFin), numeroPersonas: r.numeroPersonas || 1, estado: r.estado, origen: r.origen, notas: r.notas || '' }); setDrawerOpen(true);
  };
  const close = () => { if (!submitLock.current) setDrawerOpen(false); };
  const update = (key, value) => { setForm((prev) => ({ ...prev, [key]: value })); setFieldErrors({}); setFormError(''); };
  const submit = async (event) => {
    event.preventDefault(); if (submitLock.current) return;
    const draft = { ...form, ...Object.fromEntries(new FormData(event.currentTarget).entries()) };
    const errors = validarReserva(draft, mesas); setForm(draft); setFieldErrors(errors); setFormError('');
    if (Object.keys(errors).length) { drawerRef.current?.querySelector(`[name="${Object.keys(errors)[0]}"]`)?.focus(); return; }
    submitLock.current = true; setSaving(true);
    try {
      const payload = prepararReserva(draft);
      if (editingId) await actualizarReserva(editingId, payload); else await crearReserva(payload);
      toast.success(editingId ? 'Reserva actualizada' : 'Reserva creada'); setDrawerOpen(false); await load();
    } catch (error) { setFormError(errorMessage(error, 'No fue posible guardar la reserva. Revisa la agenda antes de volver a intentarlo.')); }
    finally { submitLock.current = false; setSaving(false); }
  };
  const remove = async (reserva) => {
    if (deleteLock.current) return;
    deleteLock.current = true; setDeletingId(reserva.id);
    try { await eliminarReserva(reserva.id); toast.success('Reserva eliminada'); setDeleteTarget(null); await load(); }
    catch (error) { toast.error(errorMessage(error, 'No fue posible eliminar la reserva.')); }
    finally { deleteLock.current = false; setDeletingId(null); }
  };
  const trapKeys = (event) => {
    if (event.key === 'Escape') { event.stopPropagation(); close(); }
    if (event.key !== 'Tab') return;
    const nodes = [...drawerRef.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')];
    const first = nodes[0], last = nodes.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  const propsFor = (key) => ({ name: key, value: form[key], onChange: (e) => update(key, e.target.value), 'aria-invalid': !!fieldErrors[key], 'aria-describedby': fieldErrors[key] ? `reserva-error-${key}` : undefined });
  const fieldError = (key) => fieldErrors[key] && <small id={`reserva-error-${key}`} className="rw-field-error">{fieldErrors[key]}</small>;
  const selectedMesa = mesas.find((m) => String(m.id) === String(form.mesaId));
  return <main className="reservas-page reservas-workspace">
    <header className="reservas-hero"><div><span>EL SERVICIO EMPIEZA ANTES DE LA LLEGADA</span><h1>Reservas y llegadas</h1><p>Tu agenda, tus mesas y cada cliente, en un solo lugar.</p></div><button type="button" onClick={openCreate}><FiPlus aria-hidden="true" /> Nueva reserva</button></header>
    {loadError && <div className="rw-error" role="alert"><span>{loadError} {reservas.length > 0 ? 'Se conserva la última agenda cargada.' : 'Los datos no están disponibles.'}</span><button type="button" onClick={load} disabled={loading}>Reintentar</button></div>}
    <section className="reservas-kpis" aria-label="Resumen de la agenda" aria-busy={loading}>
      <div><FiCalendar aria-hidden="true" /><span>Reservas activas</span><strong>{loading || loadError ? '—' : counts.activas}</strong><small>Pendientes, confirmadas y en mesa</small></div>
      <div><FiCheck aria-hidden="true" /><span>Reservas para hoy</span><strong>{loading || loadError ? '—' : counts.hoy}</strong><small>Todos los estados de la fecha actual</small></div>
      <div><FiUsers aria-hidden="true" /><span>Personas en reservas activas</span><strong>{loading || loadError ? '—' : counts.personas}</strong><small>Total de la agenda activa</small></div>
    </section>
    <section className="reservas-agenda" aria-labelledby="rw-agenda-title" aria-busy={loading}>
      <header><div><span>AGENDA DEL RESTAURANTE</span><h2 id="rw-agenda-title">{filter === 'cerradas' ? 'Reservas cerradas' : filter === 'todas' ? 'Todas las reservas' : 'Próximas llegadas'}</h2><p>Ordenadas por fecha y hora de llegada.</p></div><button type="button" className="rw-refresh" onClick={load} disabled={loading}>{loading ? 'Actualizando…' : 'Actualizar agenda'}</button></header>
      <div className="rw-tools"><div className="reservas-filters" role="group" aria-label="Estado de las reservas">{['activas','todas','cerradas'].map((item) => <button key={item} type="button" className={filter === item ? 'active' : ''} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}</div><label className="rw-search"><FiSearch aria-hidden="true" /><span className="rw-sr-only">Buscar por cliente, contacto o mesa</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente, contacto o mesa" /></label></div>
      {loading ? <div className="reservas-empty" role="status">Cargando agenda…</div> : loadError && !reservas.length ? <div className="reservas-empty">La agenda no está disponible. Usa «Reintentar» para consultarla.</div>
        : visible.length === 0 ? <div className="reservas-empty"><FiCalendar aria-hidden="true" /><strong>{search ? 'No encontramos coincidencias' : 'No hay reservas en esta vista'}</strong><p>{search ? 'Prueba con otro nombre, contacto o número de mesa.' : 'Registra las solicitudes que recibas por teléfono, WhatsApp o en el local.'}</p>{!search && <button type="button" className="rw-refresh" onClick={openCreate}>Crear una reserva</button>}</div>
        : <div className="reservas-list">{visible.map((r) => <article key={r.id} className={`reserva-row reserva-row-${r.estado}`}>
          <time dateTime={r.fechaHoraInicio}>{formatDate(r.fechaHoraInicio)}<small>Hasta {formatDate(r.fechaHoraFin)}</small></time><div className="reserva-client"><strong>{r.clienteNombre}</strong><span>{r.clienteTelefono || r.clienteEmail || RESERVA_ORIGENES[r.origen] || r.origen}</span></div>
          <div className="rw-table-cell"><span>Mesa</span><strong>{r.mesa?.numero || mesas.find((m) => String(m.id) === String(r.mesaId))?.numero || 'Por asignar'}</strong></div><div className="rw-people-cell"><span>Personas</span><strong>{r.numeroPersonas}</strong></div><span className="reserva-state">{RESERVA_ESTADOS[r.estado] || r.estado}</span>
          <div className="reserva-actions"><button type="button" onClick={() => openEdit(r)} title="Editar" aria-label={`Editar reserva de ${r.clienteNombre}`}><FiEdit3 /></button><button type="button" onClick={() => setDeleteTarget(r)} title="Eliminar" aria-label={`Eliminar reserva de ${r.clienteNombre}`} disabled={deletingId !== null}><FiTrash2 /></button></div>
        </article>)}</div>}
    </section>
    <SalonVisual mesas={mesas} reservas={reservas} onEditReserva={openEdit} title="Tus mesas y sus reservas" description="Consulta la disponibilidad y gestiona la reserva asociada a cada mesa." />
    {deleteTarget && <div className="rw-confirm-backdrop" onMouseDown={() => { if (!deleteLock.current) setDeleteTarget(null); }}><section className="rw-confirm" ref={deleteDialogRef} role="alertdialog" aria-modal="true" aria-labelledby="rw-confirm-title" aria-describedby="rw-confirm-description" onMouseDown={(e) => e.stopPropagation()} onKeyDown={(e) => {
      if (e.key === 'Escape' && !deleteLock.current) setDeleteTarget(null);
      if (e.key === 'Tab') {
        const buttons = [...deleteDialogRef.current.querySelectorAll('button:not(:disabled)')];
        if (buttons.length && ((e.shiftKey && document.activeElement === buttons[0]) || (!e.shiftKey && document.activeElement === buttons.at(-1)))) { e.preventDefault(); (e.shiftKey ? buttons.at(-1) : buttons[0]).focus(); }
      }
    }}><h2 id="rw-confirm-title">¿Eliminar esta reserva?</h2><p id="rw-confirm-description">Se eliminará la reserva de <strong>{deleteTarget.clienteNombre}</strong>. Esta acción no se puede deshacer. Si quieres conservar el registro, puedes editar su estado a Cancelada.</p><div className="rw-form-actions"><button type="button" className="rw-refresh" onClick={() => setDeleteTarget(null)} disabled={deletingId !== null}>Conservar reserva</button><button type="button" className="rw-delete-confirm" onClick={() => remove(deleteTarget)} disabled={deletingId !== null}>{deletingId !== null ? 'Eliminando…' : 'Eliminar definitivamente'}</button></div></section></div>}
    {drawerOpen && <div className="reserva-drawer-backdrop" onMouseDown={close}><aside ref={drawerRef} className="reserva-drawer" role="dialog" aria-modal="true" aria-labelledby="rw-drawer-title" aria-busy={saving} onKeyDown={trapKeys} onMouseDown={(e) => e.stopPropagation()}>
      <button className="reserva-drawer-close" type="button" aria-label="Cerrar formulario de reserva" onClick={close} disabled={saving}><FiX /></button><span>{editingId ? 'Editar reserva' : 'Nueva reserva'}</span><h2 id="rw-drawer-title">{editingId ? 'Cada detalle, al día.' : 'Prepara una buena bienvenida.'}</h2><p className="rw-form-intro">Completa el cliente y el horario. Puedes asignar la mesa después.</p>
      <form onSubmit={submit}><fieldset disabled={saving}><legend>01 · Cliente y contacto</legend>
        <label>Nombre del cliente *<input required minLength={2} maxLength={120} autoComplete="name" {...propsFor('clienteNombre')} />{fieldError('clienteNombre')}</label>
        <div className="reserva-form-grid"><label>Teléfono<input type="tel" maxLength={40} autoComplete="tel" {...propsFor('clienteTelefono')} /></label><label>Correo electrónico<input type="email" maxLength={150} autoComplete="email" {...propsFor('clienteEmail')} /></label></div>
        <label>Origen<select {...propsFor('origen')}>{Object.entries(RESERVA_ORIGENES).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </fieldset><fieldset disabled={saving}><legend>02 · Horario y mesa</legend>
        <div className="reserva-form-grid"><label>Llegada *<input required type="datetime-local" {...propsFor('fechaHoraInicio')} />{fieldError('fechaHoraInicio')}</label><label>Salida *<input required type="datetime-local" {...propsFor('fechaHoraFin')} />{fieldError('fechaHoraFin')}</label></div>
        <div className="reserva-form-grid"><label>Personas *<input required type="number" min="1" max="50" step="1" {...propsFor('numeroPersonas')} />{fieldError('numeroPersonas')}</label><label>Estado<select {...propsFor('estado')}>{Object.entries(RESERVA_ESTADOS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
        <label>Mesa<select {...propsFor('mesaId')}><option value="">Asignar después</option>{mesas.map((m) => <option key={m.id} value={m.id}>Mesa {m.numero} · {m.capacidad} puestos</option>)}</select>{fieldError('mesaId')}</label><p className="rw-form-hint">{selectedMesa ? `Capacidad de la mesa: ${selectedMesa.capacidad} personas.` : 'Sin mesa asignada: la reserva queda en la agenda para organizarla después.'} El servidor confirma la disponibilidad al guardar.</p>
      </fieldset><fieldset disabled={saving}><legend>03 · Detalles del servicio</legend><label>Notas<textarea maxLength={500} rows={3} {...propsFor('notas')} placeholder="Preferencias, celebración o detalles para el equipo" /></label></fieldset>
      {formError && <div className="rw-error" role="alert">{formError}</div>}<div className="rw-form-actions"><button type="button" className="rw-refresh" onClick={close} disabled={saving}>Cancelar</button><button className="reserva-submit" type="submit" disabled={saving}>{saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear reserva'}</button></div></form>
    </aside></div>}
  </main>;
}
