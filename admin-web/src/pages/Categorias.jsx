// src/pages/Categorias.jsx
// ======================================================================
// 📦 Categorías – COMANDA ADMIN ENTERPRISE 2026
// Dashboard estilo Shopify + Rappi Aliado
//  • Cards premium
//  • Skeleton moderno
//  • Buscador inteligente
//  • Acciones rápidas (editar / eliminar)
//  • Botón Nueva Categoría listo para modal
// ======================================================================

import { useEffect, useMemo, useState } from 'react';
import { eliminarCategoriaAdmin as eliminarCategoria, obtenerCategoriasAdmin as obtenerCategorias } from '../services/categoriasService';
import CategoriaCard from '../components/CategoriaCard';

import '../styles/Categorias.css';

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const [openModal, setOpenModal] = useState(false);

  // ======================================================
  // Cargar categorías desde API
  // ======================================================
  const cargarCategorias = async () => {
    try {
      setLoading(true);

      const res = await obtenerCategorias();
      const lista = Array.isArray(res?.data) ? res.data : [];

      setCategorias(lista);
      setError('');
    } catch (err) {
      console.error('❌ Error cargando categorías:', err);
      setError('No se pudieron cargar las categorías.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  // ======================================================
  // Filtrar categorías
  // ======================================================
  const categoriasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return categorias;
    return categorias.filter((c) => c.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  }, [categorias, busqueda]);

  // ======================================================
  // Eliminar categoría
  // ======================================================
  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar esta categoría permanentemente?')) return;

    try {
      await eliminarCategoria(id);
      setCategorias((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert('Error eliminando la categoría.');
      console.error(err);
    }
  };

  // ======================================================
  // Editar categoría → redirección o modal
  // ======================================================
  const handleEditar = (categoria) => {
    // TODO: Modal o ruta → navigate(`/categorias/editar/${categoria.id}`)
  };

  // ======================================================
  // Render principal
  // ======================================================
  return (
    <div className="categorias-container fadeIn">
      {/* ======================================================
          HEADER PRO
      ====================================================== */}
      <div className="categorias-header">
        <div>
          <h2 className="categorias-titulo">Categorías</h2>
          <p className="categorias-subtitulo">Administra y organiza tus categorías del menú.</p>
        </div>

        <div className="categorias-actions">
          <input
            type="text"
            placeholder="Buscar categoría..."
            className="categorias-search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <button className="btn-nueva-categoria" onClick={() => setOpenModal(true)}>
            ➕ Nueva Categoría
          </button>
        </div>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}
      {error && <div className="categorias-error">{error}</div>}

      {/* ======================================================
          LOADING → Skeleton Pro
      ====================================================== */}
      {loading ? (
        <div className="categorias-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="categoria-skeleton" />
          ))}
        </div>
      ) : categoriasFiltradas.length === 0 ? (
        <div className="categorias-empty">
          <p>No se encontraron categorías.</p>
        </div>
      ) : (
        <div className="categorias-grid">
          {categoriasFiltradas.map((categoria) => (
            <CategoriaCard
              key={categoria.id}
              categoria={categoria}
              onEditar={handleEditar}
              onEliminar={handleEliminar}
            />
          ))}
        </div>
      )}

      {/* ======================================================
          MODAL (placeholder listo para integrar)
      ====================================================== */}
      {openModal && (
        <div className="modal-categoria-overlay">
          <div className="modal-categoria">
            <h3>Nueva Categoría</h3>

            <p className="modal-desc">Aquí podrás crear una nueva categoría para tu menú.</p>

            <div className="modal-actions">
              <button className="btn-cancelar" onClick={() => setOpenModal(false)}>
                Cancelar
              </button>

              <button className="btn-guardar">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
