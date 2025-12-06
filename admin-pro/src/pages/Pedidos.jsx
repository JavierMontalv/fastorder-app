import Table from "../components/ui/Table";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { RefreshCw } from "lucide-react";

export default function Pedidos() {
  const columns = ["ID", "Cliente", "Total", "Estado", "Fecha", "Acciones"];

  const data = [
    {
      id: "P-001",
      cliente: "Laura Gómez",
      total: "$32.000",
      estado: "Pendiente",
      fecha: "04/12/2025",
    },
    {
      id: "P-002",
      cliente: "Juan Pérez",
      total: "$18.500",
      estado: "En preparación",
      fecha: "04/12/2025",
    },
    {
      id: "P-003",
      cliente: "Carlos Ruiz",
      total: "$45.900",
      estado: "Entregado",
      fecha: "03/12/2025",
    },
  ];

  const renderEstado = (estado) => {
    const color =
      estado === "Pendiente"
        ? "yellow"
        : estado === "En preparación"
        ? "blue"
        : "green";

    return <Badge color={color}>{estado}</Badge>;
  };

  const rows = data.map((p) => ({
    ID: p.id,
    Cliente: p.cliente,
    Total: p.total,
    Estado: renderEstado(p.estado),
    Fecha: p.fecha,
    Acciones: (
      <Button size="sm" variant="secondary">
        Ver
      </Button>
    ),
  }));

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pedidos</h1>

        <Button icon={<RefreshCw />} variant="secondary">
          Actualizar
        </Button>
      </div>

      {/* TABLA */}
      <Table columns={columns} data={rows} />
    </div>
  );
}
