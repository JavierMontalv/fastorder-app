import { useEffect, useMemo, useState } from 'react';
import {
  activarSolicitudComercial,
  listarSolicitudesComerciales
} from '../../services/superadminService';

const planLabels = {
  base: 'Basico QR',
  pro: 'Pro pedidos',
  ia: 'Premium inteligente'
};

const statusStyles = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  activated: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-rose-100 text-rose-800',
  cancelled: 'bg-slate-100 text-slate-700',
  expired: 'bg-slate-100 text-slate-700'
};

const formatCOP = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
};

export default function SolicitudesComerciales() {
  const [items, setItems] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState(null);
  const [error, setError] = useState('');

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === 'pending').length,
    [items]
  );

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listarSolicitudesComerciales({ limit: 50 });
      setItems(data.items || []);
      setPaymentStatus(data.paymentStatus || null);
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleActivate = async (item) => {
    const ok = window.confirm(
      `Activar ${item.businessName} en el plan ${planLabels[item.plan] || item.plan}?`
    );

    if (!ok) return;

    try {
      setActivatingId(item.id);
      await activarSolicitudComercial(item.id, {
        note: 'Activacion manual desde bandeja comercial SuperAdmin'
      });
      await load();
    } catch (err) {
      alert(err?.message || 'No se pudo activar la solicitud.');
    } finally {
      setActivatingId(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Cargando solicitudes comerciales...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.22em] text-orange-600">
            Trazabilidad comercial
          </span>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950">
            Solicitudes y compras de planes
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
            Aqui queda cada intento comercial: plan elegido, cliente, referencia, medio de pago,
            estado y accion de activacion. Si Wompi aun no esta completo, la solicitud no se
            pierde y puede activarse manualmente.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">
            Estado Wompi
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <strong className="text-lg text-gray-950">
              {paymentStatus?.checkoutReady ? 'Pago disponible' : 'Pago pendiente'}
            </strong>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                paymentStatus?.automaticActivationReady
                  ? 'bg-emerald-100 text-emerald-800'
                  : paymentStatus?.checkoutReady
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
              }`}
            >
              {paymentStatus?.activationMode || 'sin_configurar'}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            Pendientes por gestionar: <strong className="text-gray-950">{pendingCount}</strong>
          </p>
          {paymentStatus?.missing?.length ? (
            <p className="mt-2 text-xs leading-5 text-amber-700">
              Faltan variables: {paymentStatus.missing.join(', ')}
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-[0.14em] text-gray-500">
            <tr>
              <th className="px-4 py-4 text-left">Cliente</th>
              <th className="px-4 py-4 text-left">Plan</th>
              <th className="px-4 py-4 text-left">Referencia</th>
              <th className="px-4 py-4 text-left">Estado</th>
              <th className="px-4 py-4 text-left">Fecha</th>
              <th className="px-4 py-4 text-right">Accion</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-gray-100">
                <td className="px-4 py-4 align-top">
                  <div className="font-bold text-gray-950">{item.businessName}</div>
                  <div className="mt-1 text-xs text-gray-500">{item.customerName}</div>
                  <div className="text-xs text-gray-500">{item.customerEmail}</div>
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="font-bold text-gray-950">{planLabels[item.plan] || item.plan}</div>
                  <div className="mt-1 text-xs text-gray-500">{formatCOP(item.amountCOP)} / mes</div>
                  <div className="text-xs text-gray-400">{item.mode}</div>
                </td>
                <td className="px-4 py-4 align-top">
                  <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                    {item.reference}
                  </code>
                  {item.paymentLinkId ? (
                    <div className="mt-2 text-xs text-gray-400">Link Wompi: {item.paymentLinkId}</div>
                  ) : null}
                </td>
                <td className="px-4 py-4 align-top">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      statusStyles[item.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {item.status}
                  </span>
                  {item.wompiStatus ? (
                    <div className="mt-2 text-xs text-gray-500">Wompi: {item.wompiStatus}</div>
                  ) : null}
                </td>
                <td className="px-4 py-4 align-top text-xs text-gray-500">
                  {formatDate(item.createdAt)}
                </td>
                <td className="px-4 py-4 text-right align-top">
                  {item.status === 'activated' ? (
                    <span className="text-xs font-bold text-emerald-700">Activado</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleActivate(item)}
                      disabled={activatingId === item.id}
                      className="rounded-xl bg-gray-950 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-600 disabled:opacity-60"
                    >
                      {activatingId === item.id ? 'Activando...' : 'Activar plan'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!items.length ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Todavia no hay solicitudes comerciales registradas.
          </div>
        ) : null}
      </div>
    </div>
  );
}
