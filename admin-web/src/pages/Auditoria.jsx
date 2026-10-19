import { useMemo, useState } from 'react';
import { FiActivity, FiClock, FiFilter, FiSearch, FiShield, FiUsers } from 'react-icons/fi';

import '../styles/Auditoria.css';

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'orders', label: 'Pedidos' },
  { id: 'catalog', label: 'Carta' },
  { id: 'team', label: 'Equipo' },
  { id: 'security', label: 'Accesos' }
];

export default function Auditoria() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const events = useMemo(() => [], []);

  return (
    <section className="audit-page">
      <header className="audit-hero">
        <div>
          <span className="audit-eyebrow"><FiShield size={14} /> Control y trazabilidad</span>
          <h1>Auditoría</h1>
          <p>Consulta quién realizó un cambio, sobre qué elemento y cuándo ocurrió.</p>
        </div>
        <span className="audit-status"><i /> Diseño preparado para registro verificable</span>
      </header>

      <div className="audit-summary" aria-label="Resumen de auditoría">
        <article><FiActivity /><span>Eventos registrados</span><strong>{events.length}</strong><small>en el periodo visible</small></article>
        <article><FiUsers /><span>Usuarios con actividad</span><strong>0</strong><small>identidad y rol del actor</small></article>
        <article><FiClock /><span>Último movimiento</span><strong>—</strong><small>sin actividad disponible</small></article>
      </div>

      <div className="audit-panel">
        <div className="audit-toolbar">
          <div className="audit-filters" aria-label="Filtrar eventos">
            <FiFilter size={15} />
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={filter === item.id ? 'active' : ''}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label className="audit-search">
            <FiSearch size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar usuario o acción"
              aria-label="Buscar en auditoría"
            />
          </label>
        </div>

        <div className="audit-table-head" aria-hidden="true">
          <span>Actividad</span><span>Responsable</span><span>Fecha</span><span>Resultado</span>
        </div>

        <div className="audit-empty">
          <span className="audit-empty-icon"><FiShield size={24} /></span>
          <h2>Aún no hay eventos de auditoría</h2>
          <p>
            Esta vista no muestra datos simulados. Cuando se active el registro del backend aparecerán aquí cambios
            de pedidos, catálogo, usuarios, configuración y accesos.
          </p>
          <div className="audit-scope">
            <span>Actor y rol</span><span>Acción y recurso</span><span>Antes y después</span><span>Fecha e IP</span>
          </div>
        </div>
      </div>
    </section>
  );
}
