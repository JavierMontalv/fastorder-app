import { useEffect, useMemo, useState } from 'react';
import { FiDownload, FiEdit2, FiLink2, FiPlus, FiRefreshCw, FiShoppingBag, FiTrash2, FiUsers, FiX } from 'react-icons/fi';
import { MdTableRestaurant } from 'react-icons/md';
import { toast } from 'react-toastify';
import {
  actualizarMesa, crearMesa, descargarPDFQRMesa, eliminarMesa, liberarMesa, listarMesas,
  obtenerCuentaUnificada, obtenerQRMesa, ocuparMesa, separarMesas, unirMesas
} from '../api/mesaApi';
import '../styles/Mesas.css';

const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const EMPTY_FORM = { numero: '', nombre: '', capacidad: 4 };
const unwrap = (response, fallback = null) => response?.data?.data ?? response?.data ?? fallback;
const itemName = (item = {}) => item.nombreProducto || item.nombre || item.producto?.nombre || 'Producto';

export default function Mesas() {
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [account, setAccount] = useState(null);
  const [qr, setQr] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupSelection, setGroupSelection] = useState([]);
  const [groupPrimary, setGroupPrimary] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const load = async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const response = await listarMesas();
      setMesas(unwrap(response, []) || []);
      setError('');
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'No fue posible cargar las mesas.');
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load({ quiet: true }), 15000);
    return () => window.clearInterval(timer);
  }, []);

  const activeMesas = useMemo(() => mesas.filter((mesa) => mesa.estado !== 'inactiva'), [mesas]);
  const visibleMesas = useMemo(() => activeMesas.filter((mesa) => !mesa.esMesaSecundaria).map((mesa) => ({
    ...mesa,
    ocupada: mesa.estado === 'ocupada' || Number(mesa.pedidosActivosGrupo || mesa.pedidosActivos || 0) > 0
  })), [activeMesas]);
  const summary = useMemo(() => ({
    total: visibleMesas.length,
    occupied: visibleMesas.filter((mesa) => mesa.ocupada).length,
    available: visibleMesas.filter((mesa) => !mesa.ocupada).length,
    capacity: activeMesas.reduce((sum, mesa) => sum + Number(mesa.capacidad || 0), 0)
  }), [activeMesas, visibleMesas]);

  const rounds = account?.pedidos || [];
  const allItems = rounds.flatMap((pedido) => (pedido.items || []).map((item) => ({ ...item, pedidoId: pedido.id })));
  const selectedSource = selected ? mesas.find((mesa) => Number(mesa.id) === Number(selected.id)) || selected : null;
  const selectedCurrent = selectedSource ? {
    ...selectedSource,
    ocupada: selectedSource.estado === 'ocupada' || Number(selectedSource.pedidosActivosGrupo || selectedSource.pedidosActivos || 0) > 0
  } : null;

  const openDetail = async (mesa) => {
    setSelected(mesa); setAccount(null); setQr(null); setDetailLoading(true);
    try {
      const requests = [obtenerQRMesa(mesa.id)];
      if (mesa.ocupada) requests.push(obtenerCuentaUnificada(mesa.id));
      const [qrResponse, accountResponse] = await Promise.all(requests);
      setQr(unwrap(qrResponse, null));
      if (accountResponse) setAccount(unwrap(accountResponse, null));
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'No fue posible cargar el detalle de la mesa.');
    } finally { setDetailLoading(false); }
  };

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormOpen(true); };
  const openEdit = (mesa) => {
    setEditing(mesa);
    setForm({ numero: mesa.numero, nombre: mesa.nombre || '', capacidad: mesa.capacidad || 4 });
    setFormOpen(true);
  };

  const saveMesa = async (event) => {
    event.preventDefault();
    if (!String(form.numero).trim()) return toast.error('El número de mesa es obligatorio.');
    if (Number(form.capacidad) < 1 || Number(form.capacidad) > 30) return toast.error('La capacidad debe estar entre 1 y 30 personas.');
    setSaving(true);
    try {
      const payload = { numero: String(form.numero).trim(), nombre: form.nombre.trim() || null, capacidad: Number(form.capacidad) };
      const response = editing ? await actualizarMesa(editing.id, payload) : await crearMesa(payload);
      const saved = unwrap(response, null);
      setMesas((current) => editing
        ? current.map((mesa) => Number(mesa.id) === Number(editing.id) ? { ...mesa, ...saved } : mesa)
        : [...current, saved]);
      if (selected && editing && Number(selected.id) === Number(editing.id)) setSelected((current) => ({ ...current, ...saved }));
      setFormOpen(false);
      toast.success(editing ? 'Mesa actualizada correctamente.' : 'Mesa creada correctamente.');
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'No fue posible guardar la mesa.');
    } finally { setSaving(false); }
  };

  const toggleStatus = async () => {
    if (!selectedCurrent) return;
    setActionBusy(true);
    try {
      const response = selectedCurrent.ocupada ? await liberarMesa(selectedCurrent.id) : await ocuparMesa(selectedCurrent.id);
      const updated = unwrap(response, null);
      setMesas((current) => current.map((mesa) => Number(mesa.id) === Number(selectedCurrent.id) ? { ...mesa, ...updated } : mesa));
      setSelected((current) => ({ ...current, ...updated, ocupada: updated?.estado === 'ocupada' }));
      toast.success(updated?.estado === 'ocupada' ? 'Mesa marcada como ocupada.' : 'Mesa marcada como desocupada.');
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'No fue posible cambiar el estado de la mesa.');
    } finally { setActionBusy(false); }
  };

  const removeMesa = async () => {
    if (!selectedCurrent || !window.confirm(`¿Eliminar la Mesa ${selectedCurrent.numero}? Esta acción solo procede si no tiene pedidos activos.`)) return;
    setActionBusy(true);
    try {
      await eliminarMesa(selectedCurrent.id);
      setMesas((current) => current.filter((mesa) => Number(mesa.id) !== Number(selectedCurrent.id)));
      setSelected(null);
      toast.success('Mesa eliminada correctamente.');
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'No fue posible eliminar la mesa.');
    } finally { setActionBusy(false); }
  };

  const downloadQr = async () => {
    if (!selectedCurrent) return;
    try {
      const { data } = await descargarPDFQRMesa(selectedCurrent.id);
      const url = URL.createObjectURL(data);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `comanda-qr-mesa-${selectedCurrent.numero}.pdf`; anchor.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('No fue posible descargar el PDF del QR.'); }
  };

  const toggleGroupMesa = (id) => setGroupSelection((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const saveGroup = async () => {
    if (groupSelection.length < 2 || !groupPrimary) return toast.error('Selecciona al menos dos mesas y define la principal.');
    setActionBusy(true);
    try {
      await unirMesas(Number(groupPrimary), groupSelection.filter((id) => Number(id) !== Number(groupPrimary)).map(Number));
      setGroupOpen(false); setGroupSelection([]); setGroupPrimary(''); await load();
      toast.success('Mesas unidas en una sola cuenta.');
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'No fue posible unir las mesas.');
    } finally { setActionBusy(false); }
  };

  const separateGroup = async () => {
    const principalId = Number(selectedCurrent?.mesaGrupoId || selectedCurrent?.id);
    if (!principalId || !window.confirm('¿Separar estas mesas? Solo procede si la cuenta no tiene pedidos activos.')) return;
    setActionBusy(true);
    try {
      await separarMesas(principalId); setSelected(null); await load();
      toast.success('Mesas separadas correctamente.');
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'No fue posible separar las mesas.');
    } finally { setActionBusy(false); }
  };

  return (
    <div className="page-container mesas-page fadeIn">
      <header className="mesas-heading">
        <div><span className="mesas-kicker">SALÓN EN TIEMPO REAL</span><h1><MdTableRestaurant /> Mesas</h1><p>Administra cada mesa, su QR y su atención actual desde un único lugar.</p></div>
        <div className="mesas-heading-actions">
          <button type="button" className="mesas-btn ghost" onClick={() => load()} disabled={loading}><FiRefreshCw className={loading ? 'is-spinning' : ''} /> Actualizar</button>
          <button type="button" className="mesas-btn ghost" onClick={() => setGroupOpen(true)} disabled={activeMesas.length < 2}><FiLink2 /> Unir mesas</button>
          <button type="button" className="mesas-btn primary" onClick={openCreate}><FiPlus /> Nueva mesa</button>
        </div>
      </header>

      <section className="mesas-summary" aria-label="Resumen de mesas">
        <div><span>Total</span><strong>{summary.total}</strong></div><div className="is-free"><span>Desocupadas</span><strong>{summary.available}</strong></div>
        <div className="is-busy"><span>Ocupadas</span><strong>{summary.occupied}</strong></div><div><span>Capacidad</span><strong>{summary.capacity}</strong></div>
      </section>
      {error && <div className="mesas-error" role="alert">{error}</div>}
      {loading ? <div className="mesas-grid">{Array.from({ length: 8 }, (_, index) => <div className="mesa-card skeleton" key={index} />)}</div>
        : visibleMesas.length === 0 ? <section className="mesas-empty-state"><MdTableRestaurant /><h2>Crea tu primera mesa</h2><p>Al crearla, Comanda generará su acceso QR individual.</p><button type="button" className="mesas-btn primary" onClick={openCreate}><FiPlus /> Nueva mesa</button></section>
          : <section className="mesas-grid" aria-label="Estado de las mesas">{visibleMesas.map((mesa) => (
            <button type="button" key={mesa.id} className={`mesa-card ${mesa.ocupada ? 'is-busy' : 'is-free'}`} onClick={() => openDetail(mesa)}>
              <span className="mesa-card-status"><i />{mesa.ocupada ? 'Ocupada' : 'Desocupada'}</span><span className="mesa-card-table" aria-hidden="true"><MdTableRestaurant /><b>{mesa.numero}</b></span>
              <strong>Mesa {mesa.numero}</strong><small>{mesa.nombre || `${mesa.capacidad || 0} personas`}</small><span className="mesa-card-cta">{mesa.ocupada ? 'Ver atención y cuenta' : 'Ver QR y configuración'}</span>
            </button>))}</section>}

      {selectedCurrent && <div className="mesa-drawer-backdrop" onMouseDown={() => setSelected(null)}><aside className="mesa-drawer" role="dialog" aria-modal="true" aria-label={`Mesa ${selectedCurrent.numero}`} onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="mesa-drawer-close" onClick={() => setSelected(null)} aria-label="Cerrar"><FiX /></button>
        <span className={`mesa-account-status ${selectedCurrent.ocupada ? 'is-busy' : 'is-free'}`}>{selectedCurrent.ocupada ? 'ATENCIÓN ACTIVA' : 'MESA DESOCUPADA'}</span>
        <h2><MdTableRestaurant /> Mesa {selectedCurrent.numero}</h2><p className="mesa-drawer-subtitle">{selectedCurrent.nombre || 'Sin alias'} · {selectedCurrent.capacidad || 0} personas</p>
        <div className="mesa-detail-actions"><button type="button" onClick={() => openEdit(selectedCurrent)}><FiEdit2 /> Editar</button><button type="button" onClick={downloadQr}><FiDownload /> PDF QR</button><button type="button" className="danger" onClick={removeMesa} disabled={actionBusy || selectedCurrent.ocupada}><FiTrash2 /> Eliminar</button></div>
        {detailLoading ? <div className="mesa-empty">Cargando información de la mesa…</div> : <>
          <section className="mesa-qr-panel"><div><span>QR individual</span><strong>Identifica automáticamente la Mesa {selectedCurrent.numero}</strong></div>{qr?.qrBase64 ? <img src={qr.qrBase64} alt={`Código QR de Mesa ${selectedCurrent.numero}`} /> : <div className="mesa-qr-placeholder">QR</div>}{qr?.qrUrl && <a href={qr.qrUrl} target="_blank" rel="noreferrer">Abrir enlace de la mesa</a>}</section>
          {selectedCurrent.ocupada ? <><div className="mesa-account-total"><div><span>Total de la cuenta</span><strong>{money.format(Number(account?.resumen?.total || 0))}</strong></div><div><span>Saldo pendiente</span><strong>{money.format(Number(account?.resumen?.pendientePago || 0))}</strong></div></div>
            <div className="mesa-account-metrics"><span><FiShoppingBag /><b>{rounds.length}</b> rondas</span><span><FiUsers /><b>{selectedCurrent.comensalesActuales || 0}</b> comensales</span></div>
            <div className="mesa-account-copy"><strong>Una mesa, una cuenta</strong><span>Los pedidos se organizan por rondas para cocina, pero se consolidan en un único total.</span></div>
            <div className="mesa-account-items">{allItems.length ? allItems.map((item, index) => <div key={item.id || `${item.pedidoId}-${index}`}><span><b>{item.cantidad || 1}×</b> {itemName(item)}</span><strong>{money.format(Number(item.subtotal ?? item.totalItem ?? 0))}</strong></div>) : <p>No hay productos activos en esta atención.</p>}</div></>
            : <div className="mesa-empty"><strong>Lista para una nueva atención</strong><p>El primer pedido confirmado abrirá la cuenta de esta mesa.</p></div>}
          <div className="mesa-operational-actions"><button type="button" className="mesas-btn ghost" onClick={toggleStatus} disabled={actionBusy || (selectedCurrent.ocupada && rounds.length > 0)}>{selectedCurrent.ocupada ? 'Marcar desocupada' : 'Marcar ocupada'}</button>{selectedCurrent.cuentaCompartidaActiva && <button type="button" className="mesas-btn ghost" onClick={separateGroup} disabled={actionBusy || rounds.length > 0}>Separar mesas</button>}</div>
        </>}
      </aside></div>}

      {formOpen && <div className="mesa-modal-backdrop" onMouseDown={() => setFormOpen(false)}><form className="mesa-modal" onSubmit={saveMesa} onMouseDown={(event) => event.stopPropagation()}>
        <div className="mesa-modal-title"><MdTableRestaurant /><div><span>{editing ? 'ACTUALIZAR MESA' : 'NUEVA MESA'}</span><h2>{editing ? `Editar Mesa ${editing.numero}` : 'Crear mesa'}</h2></div></div>
        <label><span>Número de mesa</span><input type="text" inputMode="numeric" value={form.numero} onChange={(event) => setForm((current) => ({ ...current, numero: event.target.value }))} autoFocus /></label>
        <label><span>Nombre o ubicación (opcional)</span><input type="text" maxLength="80" placeholder="Ej. Terraza, VIP, Ventana" value={form.nombre} onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} /></label>
        <label><span>Capacidad</span><input type="number" min="1" max="30" value={form.capacidad} onChange={(event) => setForm((current) => ({ ...current, capacidad: event.target.value }))} /></label>
        <div className="mesa-modal-actions"><button type="button" onClick={() => setFormOpen(false)}>Cancelar</button><button type="submit" className="primary" disabled={saving}>{saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear mesa'}</button></div>
      </form></div>}

      {groupOpen && <div className="mesa-modal-backdrop" onMouseDown={() => setGroupOpen(false)}><div className="mesa-modal mesa-group-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mesa-modal-title"><FiLink2 /><div><span>CUENTA COMPARTIDA</span><h2>Unir mesas</h2></div></div><p>Selecciona las mesas que atenderán una sola cuenta. Los pedidos se consolidarán en la mesa principal.</p>
        <div className="mesa-group-options">{activeMesas.filter((mesa) => !mesa.mesaGrupoId).map((mesa) => <button type="button" className={groupSelection.includes(mesa.id) ? 'selected' : ''} key={mesa.id} onClick={() => toggleGroupMesa(mesa.id)}><MdTableRestaurant /> Mesa {mesa.numero}</button>)}</div>
        <label><span>Mesa principal</span><select value={groupPrimary} onChange={(event) => setGroupPrimary(event.target.value)} disabled={groupSelection.length < 2}><option value="">Seleccionar</option>{activeMesas.filter((mesa) => groupSelection.includes(mesa.id)).map((mesa) => <option key={mesa.id} value={mesa.id}>Mesa {mesa.numero}</option>)}</select></label>
        <div className="mesa-modal-actions"><button type="button" onClick={() => setGroupOpen(false)}>Cancelar</button><button type="button" className="primary" onClick={saveGroup} disabled={actionBusy || groupSelection.length < 2 || !groupPrimary}>{actionBusy ? 'Uniendo…' : 'Unir mesas'}</button></div>
      </div></div>}
    </div>
  );
}
