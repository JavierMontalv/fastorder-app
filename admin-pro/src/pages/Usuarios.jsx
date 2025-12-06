import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import { Plus } from "lucide-react";

export default function Usuarios() {
  const columns = ["Nombre", "Email", "Rol", "Estado", "Acciones"];

  const data = [
    {
      nombre: "Juan Pérez",
      email: "juan@example.com",
      rol: "Administrador",
      estado: "Activo",
    },
    {
      nombre: "Laura Gómez",
      email: "laura@example.com",
      rol: "Staff",
      estado: "Inactivo",
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER DE PÁGINA */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Usuarios</h1>

        <Button icon={<Plus />} variant="primary">
          Nuevo Usuario
        </Button>
      </div>

      {/* TABLA */}
      <Table columns={columns} data={data} />
    </div>
  );
}
