// admin-web/src/pages/ProductosEditar.jsx
// ======================================================================
// 🍽️ Editor de Producto – COMANDA Admin (Enterprise 2026)
// ----------------------------------------------------------------------
// • Validación previa obligatoria
// • Manejo de errores backend reales (message)
// • Sin alert()
// • Permite editar estado
// • Alineado con ModalProducto
// • ⛓️ Extendido con módulo de Modificadores (FASE 2.2)
// ======================================================================

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import api from '../api/api';
import ProductoEdiciones from '../components/ProductoEdiciones';

import '../styles/AIAdminTools.css';

export default function ProductosEditar() {
  const { id } = useParams();
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

  // 🔽 Acordeón modificadores (aislado)
  const [ediciones, setEdiciones] = useState([]);
  const [cargandoEdiciones, setCargandoEdiciones] = useState(false);
  const [errorCargaEdiciones, setErrorCargaEdiciones] = useState('');

  // ======================================================================
  // 📦 Cargar producto + categorías
  // ======================================================================
  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);

        const [resProducto, resCategorias] = await Promise.all([
          api.get(`/productos/${id}`),
          api.get('/categorias')
        ]);

        const data = resProducto?.data?.data;

        if (!data) {
          setError('No se encontró el producto.');
          return;
        }

        setProducto({
          nombre: data.nombre || '',
          descripcion: data.descripcion || '',
          precio: data.precio || '',
          categoriaId: data.categoriaId || '',
          estado: data.estado || 'activo'
        });

        setCategorias(Array.isArray(resCategorias?.data?.data) ? resCategorias.data.data : []);
      } catch (err) {
        console.error('❌ Error cargando producto:', err);
        setError(err?.response?.data?.message || 'Error al cargar el producto.');
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [id]);

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
  // 💾 Guardar producto actualizado
  // ======================================================================
  const guardar = async () => {
    if (!validar()) return;

    try {
      setSaving(true);

      await api.put(`/productos/${id}`, {
        ...producto,
        ediciones
      });

      toast.success('Producto actualizado correctamente');
      navigate('/productos');
    } catch (err) {
      console.error('❌ Error guardando producto:', err);
      toast.error(err?.response?.data?.message || 'No se pudo guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="loading-text">Cargando producto...</p>;
  if (error) return <p className="error-message">{error}</p>;

  // ======================================================================
  // RENDER UI — Enterprise
  // ======================================================================
  return (
    <div className="producto-editor fadeIn">
      <h1 className="titulo">Editar Producto</h1>

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
      <button
        className="guardar-btn"
        disabled={saving || cargandoEdiciones || Boolean(errorCargaEdiciones)}
        onClick={guardar}
      >
        {saving
          ? 'Guardando...'
          : cargandoEdiciones
            ? 'Cargando ediciones...'
            : 'Guardar cambios'}
      </button>

      {/* =====================================================
          🧩 MODIFICADORES — ACORDEÓN AISLADO (FASE 2.2)
         ===================================================== */}
      <div style={{ marginTop: 32 }}>
        <ProductoEdiciones
          productoId={id}
          value={ediciones}
          onChange={setEdiciones}
          disabled={saving}
          onLoadingChange={setCargandoEdiciones}
          onErrorChange={setErrorCargaEdiciones}
        />
      </div>
    </div>
  );
}
