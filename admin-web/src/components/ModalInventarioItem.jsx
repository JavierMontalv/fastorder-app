import { useEffect, useMemo, useState } from 'react';
import '../styles/ModalAjusteStock.css';

const UNIDADES = ['unidad', 'kg', 'g', 'litro', 'ml', 'porcion'];

export default function ModalInventarioItem({
  abierto,
  onCerrar,
  onGuardar,
  seccionesDisponibles = []
}) {
  const [form, setForm] = useState({
    nombre: '',
    categoria: '',
    unidad: 'unidad',
    stockMinimo: '',
    costoUnitario: ''
  });
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (!abierto) return;
    setForm({
      nombre: '',
      categoria: '',
      unidad: 'unidad',
      stockMinimo: '',
      costoUnitario: ''
    });
    setErrores({});
    setLoading(false);
  }, [abierto]);

  const secciones = useMemo(
    () => [...new Set((seccionesDisponibles || []).map((value) => String(value || '').trim()).filter(Boolean))],
    [seccionesDisponibles]
  );

  if (!abierto) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validar = () => {
    const next = {};
    if (!form.nombre.trim()) next.nombre = 'El nombre es obligatorio.';
    if (form.stockMinimo !== '' && Number(form.stockMinimo) < 0) next.stockMinimo = 'Debe ser mayor o igual a cero.';
    if (form.costoUnitario !== '' && Number(form.costoUnitario) < 0) next.costoUnitario = 'Debe ser mayor o igual a cero.';
    setErrores(next);
    return Object.keys(next).length === 0;
  };

  const handleGuardar = async () => {
    if (!validar()) return;

    try {
      setLoading(true);
      await onGuardar({
        nombre: form.nombre.trim(),
        categoria: form.categoria.trim(),
        unidad: form.unidad,
        stockMinimo: form.stockMinimo === '' ? 0 : Number(form.stockMinimo),
        costoUnitario: form.costoUnitario === '' ? null : Number(form.costoUnitario)
      });
      onCerrar();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pro-modal-overlay">
      <div className="pro-modal">
        <div className="pro-modal-header">
          <h2>Nuevo item de stock</h2>
          <button className="pro-close-btn" onClick={onCerrar}>✖</button>
        </div>

        <div className="pro-modal-body">
          <div className="ajuste-form">
            <label>Nombre del item</label>
            <input
              className="fo-input"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej: Carne hamburguesa"
            />
            {errores.nombre && <small className="pm-error">{errores.nombre}</small>}

            <label>Seccion operativa</label>
            <input
              className="fo-input"
              name="categoria"
              list="inventario-secciones"
              value={form.categoria}
              onChange={handleChange}
              placeholder="Ej: Proteinas, Bebidas, Panaderia"
            />
            <datalist id="inventario-secciones">
              {secciones.map((seccion) => (
                <option key={seccion} value={seccion} />
              ))}
            </datalist>

            <label>Unidad</label>
            <select className="fo-input" name="unidad" value={form.unidad} onChange={handleChange}>
              {UNIDADES.map((unidad) => (
                <option key={unidad} value={unidad}>{unidad}</option>
              ))}
            </select>

            <label>Stock minimo recomendado</label>
            <input
              className="fo-input"
              type="number"
              min="0"
              name="stockMinimo"
              value={form.stockMinimo}
              onChange={handleChange}
              placeholder="0"
            />
            {errores.stockMinimo && <small className="pm-error">{errores.stockMinimo}</small>}

            <label>Costo unitario (opcional)</label>
            <input
              className="fo-input"
              type="number"
              min="0"
              step="0.01"
              name="costoUnitario"
              value={form.costoUnitario}
              onChange={handleChange}
              placeholder="0"
            />
            {errores.costoUnitario && <small className="pm-error">{errores.costoUnitario}</small>}
          </div>
        </div>

        <div className="pro-modal-actions ajuste-actions">
          <button className="fo-btn fo-btn-outline" onClick={onCerrar}>
            Cancelar
          </button>
          <button className="fo-btn fo-btn-primary" disabled={loading} onClick={handleGuardar}>
            {loading ? 'Creando...' : 'Crear item'}
          </button>
        </div>
      </div>
    </div>
  );
}
