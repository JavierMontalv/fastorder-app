import useDialogFocus from '../hooks/useDialogFocus';
import { useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from '../context/AuthContext';
import { DEFAULT_PRINT, normalizePrint, printKey, readPrint, ticketOrders } from '../utils/ticketPrint.mjs';
import '../styles/TicketPrinter.css';
const money = n => new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
}).format(n);
export function TicketPreview({
  grupo,
  settings,
  restaurant = ''
}) {
  const orders = ticketOrders(grupo);
  return <article className="ticket-paper" style={{
    width: settings.paper - 6 + 'mm'
  }}><h2>{restaurant || 'COMANDA'}</h2><h3>{settings.heading}</h3><p>{grupo.mesaLabel || 'Pedido directo'}</p><p>{new Date().toLocaleString('es-CO', {
        timeZone: 'America/Bogota'
      })}</p>{orders.map((o, index) => <section key={index}><h3>Pedido #{o.id} · {o.estado}</h3>{o.items.map((i, n) => <div className="ticket-item" key={n}><strong>{i.cantidad} × {i.nombre}</strong>{i.notas.map((t, k) => <p key={k}>• {t}</p>)}{settings.showPrices && i.precio !== null && <small>{money(i.precio * i.cantidad)}</small>}</div>)}{o.nota && <p>Nota: {o.nota}</p>}</section>)}{settings.footer && <p>{settings.footer}</p>}<small>Comanda operativa · No es factura fiscal</small></article>;
}
export default function TicketPrinter({
  grupo,
  label = 'Imprimir comanda'
}) {
  const {
    user
  } = useContext(AuthContext) || {};
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(() => readPrint(user));
  useDialogFocus(open, '.ticket-dialog', () => setOpen(false));
  const orders = ticketOrders(grupo);
  function show() {
    setSettings(readPrint(user));
    setOpen(true);
  }
  return <><button type="button" className="ticket-trigger" onClick={show} disabled={!orders.length}>{label}</button>{open && createPortal(<div id="comanda-print-root" className="ticket-overlay"><section className="ticket-dialog" role="dialog" aria-modal="true" aria-labelledby="ticket-title"><header className="ticket-screen"><h2 id="ticket-title">Vista previa de comanda</h2><button type="button" onClick={() => setOpen(false)} aria-label="Cerrar vista de impresión">×</button></header><div className="ticket-screen ticket-controls"><label>Papel<select aria-label="Papel" value={settings.paper} onChange={e => setSettings({
              ...settings,
              paper: Number(e.target.value)
            })}><option value={80}>80 mm</option><option value={58}>58 mm</option></select></label><p>Selecciona la impresora instalada y el mismo ancho de papel. Escala 100 %, sin encabezados ni pies del navegador.</p></div><div className="ticket-preview"><TicketPreview grupo={grupo} settings={settings} restaurant={user?.restauranteNombre || ''} /></div><footer className="ticket-screen"><button type="button" onClick={() => window.print()}>Abrir diálogo de impresión</button><button type="button" onClick={() => setOpen(false)}>Cerrar</button></footer></section></div>, document.body)}</>;
}
export function PrintSettings() {
  const {
    user
  } = useContext(AuthContext) || {};
  const [settings, setSettings] = useState(() => readPrint(user)),
    [status, setStatus] = useState('');
  const example = {
    mesaLabel: 'Mesa 08 · PRUEBA',
    pedidos: [{
      numero: 'PRUEBA',
      estado: 'pendiente',
      items: [{
        nombre: 'Producto de prueba',
        cantidad: 2,
        nota: 'Sin cebolla',
        precioUnitario: 12000
      }]
    }]
  };
  function save() {
    try {
      const key = printKey(user);
      if (!key) throw Error('Restaurante no identificado.');
      localStorage.setItem(key, JSON.stringify(normalizePrint(settings)));
      setStatus('Preferencias guardadas para este usuario, restaurante y navegador.');
    } catch {
      setStatus('No se pudieron guardar las preferencias en este navegador.');
    }
  }
  return <section className="config-panel"><div className="config-panel-head"><div><span className="config-panel-kicker">COCINA Y SERVICIO</span><h2>Imprimir comanda</h2></div><p>USB o red: utiliza una impresora instalada en tu equipo. También puedes guardar en PDF desde el diálogo del navegador.</p></div><div className="op-fields"><label>Ancho del papel<select aria-label="Papel" value={settings.paper} onChange={e => setSettings({
          ...settings,
          paper: Number(e.target.value)
        })}><option value={80}>80 mm · ticket ancho</option><option value={58}>58 mm · ticket compacto</option></select></label><label>Encabezado<input maxLength={60} value={settings.heading} onChange={e => setSettings({
          ...settings,
          heading: e.target.value
        })} /></label><label>Texto al final<input maxLength={140} value={settings.footer} onChange={e => setSettings({
          ...settings,
          footer: e.target.value
        })} /></label><label><input type="checkbox" checked={settings.showPrices} onChange={e => setSettings({
          ...settings,
          showPrices: e.target.checked
        })} /> Mostrar precios</label></div><p className="op-note">Las preferencias se guardan en este navegador. COMANDA abre el diálogo de impresión; la impresora se elige allí. No se instala un agente ni se imprime automáticamente.</p><div className="op-actions"><button type="button" className="op-button" onClick={save}>Guardar preferencias</button><TicketPrinter grupo={example} label="Imprimir prueba" /></div><p role="status">{status}</p></section>;
}
