import { useEffect, useMemo, useState } from 'react';
import { FiCalendar, FiCheck, FiEdit3, FiPlus, FiTrash2, FiUsers, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { listarMesas } from '../api/mesaApi';
import {
  actualizarReserva,
  crearReserva,
  eliminarReserva,
  listarReservas
} from '../api/reservasApi';
import SalonVisual from '../components/SalonVisual';
import '../styles/Reservas.css';

const EMPTY_FORM = {
  clienteNombre: '',
  clienteTelefono: '',
  clienteEmail: '',
  mesaId: '',
  fechaHoraInicio: '',
  fechaHoraFin: '',
  numeroPersonas: 2,
  estado: 'pendiente',
  origen: 'telefono',
  notas: ''
};

function toLocalInput(value) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function formatDate(value) {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

export default function Reservas() {
  const [reservas, setReservas] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('activas');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = async () => {
    try {
      setLoading(true);
      const [reservasRes, mesasRes] = await Promise.all([listarReservas(), listarMesas()]);
      setReservas(reservasRes?.data?.data || []);
      setMesas(mesasRes?.data?.data || mesasRes?.data || []);
    } catch (error) {
      toast.error(error.message || 'No fue posible cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    if (filter === 'todas') return reservas;
    if (filter === 'cerradas') {
      return reservas.filter((item) => ['completada', 'cancelada', 'no_asistio'].includes(item.estado));
    }
    return reservas.filter((item) => ['pendiente', 'confirmada', 'sentada'].includes(item.estado));
  }, [filter, reservas]);

  const counts = useMemo(
    () => ({
      activas: reservas.filter((item) => ['pendiente', 'confirmada', 'sentada'].includes(item.estado)).length,
      hoy: reservas.filter((item) => new Date(item.fechaHoraInicio).toDateString() === new Date().toDateString()).length,
      personas: reservas
        .filter((item) => ['pendiente', 'confirmada', 'sentada'].includes(item.estado))
        .reduce((sum, item) => sum + Number(item.numeroPersonas || 0), 0)
    }),
    [reservas]
  );

  const openCreate = () => {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
    const end = new Date(start.getTime() + 90 * 60 * 1000);
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      fechaHoraInicio: toLocalInput(start),
      fechaHoraFin: toLocalInput(end)
    });
    setDrawerOpen(true);
  };

  const openEdit = (reserva) => {
    setEditingId(reserva.id);
    setForm({
      clienteNombre: reserva.clienteNombre || '',
      clienteTelefono: reserva.clienteTelefono || '',
      clienteEmail: reserva.clienteEmail || '',
      mesaId: reserva.mesaId || '',
      fechaHoraInicio: toLocalInput(reserva.fechaHoraInicio),
      fechaHoraFin: toLocalInput(reserva.fechaHoraFin),
      numeroPersonas: reserva.numeroPersonas || 1,
      estado: reserva.estado,
      origen: reserva.origen,
      notas: reserva.notas || ''
    });
    setDrawerOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...form,
        mesaId: form.mesaId ? Number(form.mesaId) : null,
        numeroPersonas: Number(form.numeroPersonas),
        fechaHoraInicio: new Date(form.fechaHoraInicio).toISOString(),
        fechaHoraFin: new Date(form.fechaHoraFin).toISOString()
      };
      if (editingId) {
        await actualizarReserva(editingId, payload);
        toast.success('Reserva actualizada');
      } else {
        await crearReserva(payload);
        toast.success('Reserva creada');
      }
      setDrawerOpen(false);
      await load();
    } catch (error) {
      toast.error(error.message || 'No fue posible guardar la reserva');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (reserva) => {
    if (!window.confirm(`Eliminar la reserva de ${reserva.clienteNombre}?`)) return;
    try {
      await eliminarReserva(reserva.id);
      toast.success('Reserva eliminada');
      await load();
    } catch (error) {
      toast.error(error.message || 'No fue posible eliminar la reserva');
    }
  };

  return (
    <main className="reservas-page">
      <header className="reservas-hero">
        <div>
          <span>Operacion de sala</span>
          <h1>Reservas</h1>
          <p>Registra solicitudes recibidas por telefono, WhatsApp, Instagram o en el local.</p>
        </div>
        <button type="button" onClick={openCreate}><FiPlus /> Nueva reserva</button>
      </header>

      <section className="reservas-kpis">
        <div><FiCalendar /><span>Reservas activas</span><strong>{counts.activas}</strong></div>
        <div><FiCheck /><span>Programadas hoy</span><strong>{counts.hoy}</strong></div>
        <div><FiUsers /><span>Personas esperadas</span><strong>{counts.personas}</strong></div>
      </section>

      <SalonVisual
        mesas={mesas}
        reservas={reservas}
        onEditReserva={openEdit}
        title="Plano de reservas"
        description="Consulta ocupacion, disponibilidad y la proxima llegada de cada mesa."
      />

      <section className="reservas-agenda">
        <header>
          <div>
            <span>Agenda operativa</span>
            <h2>Proximas llegadas</h2>
          </div>
          <div className="reservas-filters">
            {['activas', 'todas', 'cerradas'].map((item) => (
              <button
                key={item}
                type="button"
                className={filter === item ? 'active' : ''}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="reservas-empty">Cargando agenda...</div>
        ) : visible.length === 0 ? (
          <div className="reservas-empty">No hay reservas en esta vista.</div>
        ) : (
          <div className="reservas-list">
            {visible.map((reserva) => (
              <article key={reserva.id} className={`reserva-row reserva-row-${reserva.estado}`}>
                <time>{formatDate(reserva.fechaHoraInicio)}</time>
                <div className="reserva-client">
                  <strong>{reserva.clienteNombre}</strong>
                  <span>{reserva.clienteTelefono || reserva.origen}</span>
                </div>
                <div><span>Mesa</span><strong>{reserva.mesa?.numero || 'Por asignar'}</strong></div>
                <div><span>Personas</span><strong>{reserva.numeroPersonas}</strong></div>
                <span className="reserva-state">{reserva.estado.replace('_', ' ')}</span>
                <div className="reserva-actions">
                  <button type="button" onClick={() => openEdit(reserva)} title="Editar"><FiEdit3 /></button>
                  <button type="button" onClick={() => remove(reserva)} title="Eliminar"><FiTrash2 /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {drawerOpen && (
        <div className="reserva-drawer-backdrop" onMouseDown={() => setDrawerOpen(false)}>
          <aside className="reserva-drawer" onMouseDown={(event) => event.stopPropagation()}>
            <button className="reserva-drawer-close" type="button" onClick={() => setDrawerOpen(false)}><FiX /></button>
            <span>{editingId ? 'Editar reserva' : 'Nueva reserva'}</span>
            <h2>{editingId ? 'Actualiza la llegada' : 'Registra una llegada'}</h2>
            <form onSubmit={submit}>
              <label>Nombre del cliente<input required value={form.clienteNombre} onChange={(e) => setForm({ ...form, clienteNombre: e.target.value })} /></label>
              <div className="reserva-form-grid">
                <label>Telefono<input value={form.clienteTelefono} onChange={(e) => setForm({ ...form, clienteTelefono: e.target.value })} /></label>
                <label>Personas<input required type="number" min="1" max="50" value={form.numeroPersonas} onChange={(e) => setForm({ ...form, numeroPersonas: e.target.value })} /></label>
              </div>
              <label>Mesa<select value={form.mesaId} onChange={(e) => setForm({ ...form, mesaId: e.target.value })}><option value="">Asignar despues</option>{mesas.map((mesa) => <option key={mesa.id} value={mesa.id}>Mesa {mesa.numero} · {mesa.capacidad} puestos</option>)}</select></label>
              <div className="reserva-form-grid">
                <label>Inicio<input required type="datetime-local" value={form.fechaHoraInicio} onChange={(e) => setForm({ ...form, fechaHoraInicio: e.target.value })} /></label>
                <label>Fin<input required type="datetime-local" value={form.fechaHoraFin} onChange={(e) => setForm({ ...form, fechaHoraFin: e.target.value })} /></label>
              </div>
              <div className="reserva-form-grid">
                <label>Estado<select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>{['pendiente', 'confirmada', 'sentada', 'completada', 'cancelada', 'no_asistio'].map((item) => <option key={item}>{item}</option>)}</select></label>
                <label>Origen<select value={form.origen} onChange={(e) => setForm({ ...form, origen: e.target.value })}>{['telefono', 'whatsapp', 'instagram', 'presencial', 'otro'].map((item) => <option key={item}>{item}</option>)}</select></label>
              </div>
              <label>Notas<textarea maxLength="500" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></label>
              <button className="reserva-submit" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar reserva'}</button>
            </form>
          </aside>
        </div>
      )}
    </main>
  );
}
