import { Plus } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';

export default function Categorias() {
  const columns = ['Nombre', 'Icono', 'Estado', 'Acciones'];

  const data = [
    {
      nombre: 'Hamburguesas',
      icono: '🍔',
      estado: 'Activa'
    },
    {
      nombre: 'Bebidas',
      icono: '🥤',
      estado: 'Activa'
    },
    {
      nombre: 'Postres',
      icono: '🍰',
      estado: 'Inactiva'
    }
  ];

  const rows = data.map((c) => ({
    Nombre: c.nombre,
    Icono: <span className="text-xl">{c.icono}</span>,
    Estado: <Badge color={c.estado === 'Activa' ? 'green' : 'red'}>{c.estado}</Badge>,
    Acciones: (
      <Button size="sm" variant="secondary">
        Editar
      </Button>
    )
  }));

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Categorías</h1>

        <Button icon={<Plus />} variant="primary">
          Nueva Categoría
        </Button>
      </div>

      {/* TABLA */}
      <Table columns={columns} data={rows} />
    </div>
  );
}
