// admin-web/src/pages/ProductosNuevo.jsx
// ======================================================================
// 🍽️ Nuevo Producto — COMANDA Admin (Enterprise 2026)
// ----------------------------------------------------------------------
// • Alta de producto (NO inventario)
// • Inventario se gestiona en módulo dedicado
// • Validaciones reales
// • Manejo de errores backend
// • Alineado 1:1 con ProductosEditar.jsx
// ======================================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import api from '../api/api';
import '../styles/AIAdminTools.css';

export default function ProductosNuevo() {
  const navigate = useNavigate();

  const [producto, setProducto] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoriaId: '',
    estado: 'activo'
  });

  const [categorias, setCategorias] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ======================================================================
  // 📦 Cargar categorías
  // ======================================================================
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        setLoading(true);
        const res = await api.get('/categorias');
        setCategorias(Array.isArray(res?.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error('❌ Error cargando categorías:', err);
        setError(err?.response?.data?.message || 'Error cargando categorías');
      } finally {
        setLoading(false);
      }
    };

    cargarCategorias();
  }, []);

  // ======================================================================
  // ✔ Validación previa
  // ======================================================================
  const validar = () => {
    if (!producto.nombre.trim()) {
      toast.warning('El nombre es obligatorio');
      return false;
    }

    if (!producto.precio || Number(producto.precio) <= 0) {
      toast.warning('El precio debe ser mayor a cero');
      return false;
    }

    if (!producto.categoriaId) {
      toast.warning('Debe seleccionar una categoría');
      return false;
    }

    return true;
  };

  // ======================================================================
  // 💾 Crear producto
  // ======================================================================
  const guardar = async () => {
    if (!validar()) return;

    try {
      setSaving(true);

      await api.post('/productos', producto);

      toast.success('Producto creado correctamente');
      navigate('/productos');
    } catch (err) {
      console.error('❌ Error creando producto:', err);
      toast.error(err?.response?.data?.message || 'No se pudo crear el producto');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="loading-text">Cargando formulario...</p>;
  if (error) return <p className="error-message">{error}</p>;

  // ======================================================================
  // RENDER UI — Enterprise
  // ======================================================================
  return (
    <div className="producto-editor fadeIn">
      <h1 className="titulo">Nuevo Producto</h1>

      {/* ===================== NOMBRE ===================== */}
      <label className="editor-label">Nombre</label>
      <input
        className="editor-input"
        type="text"
        value={producto.nombre}
        onChange={(e) => setProducto({ ...producto, nombre: e.target.value })}
      />

      {/* ===================== DESCRIPCIÓN ===================== */}
      <label className="editor-label">Descripción</label>
      <textarea
        className="editor-textarea"
        rows={4}
        value={producto.descripcion}
        onChange={(e) => setProducto({ ...producto, descripcion: e.target.value })}
      />

      {/* ===================== CATEGORÍA ===================== */}
      <label className="editor-label">Categoría</label>
      <select
        className="editor-input"
        value={producto.categoriaId}
        onChange={(e) => setProducto({ ...producto, categoriaId: e.target.value })}
      >
        <option value="">Seleccione una categoría</option>
        {categorias.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>

      {/* ===================== ESTADO ===================== */}
      <label className="editor-label">Estado</label>
      <select
        className="editor-input"
        value={producto.estado}
        onChange={(e) => setProducto({ ...producto, estado: e.target.value })}
      >
        <option value="activo">Activo</option>
        <option value="inactivo">Inactivo</option>
      </select>

      {/* ===================== PRECIO ===================== */}
      <label className="editor-label">Precio</label>
      <input
        className="editor-input"
        type="number"
        min="1"
        value={producto.precio}
        onChange={(e) => setProducto({ ...producto, precio: e.target.value })}
      />

      {/* ===================== GUARDAR ===================== */}
      <button className="guardar-btn" disabled={saving} onClick={guardar}>
        {saving ? 'Creando...' : 'Crear producto'}
      </button>
    </div>
  );
}
