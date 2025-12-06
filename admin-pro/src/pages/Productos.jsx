import { Plus } from "lucide-react";
import Button from "../components/ui/Button";
import Table from "../components/ui/Table";

export default function Productos() {
  const columns = ["Nombre", "Categoría", "Precio", "Estado", "Acciones"];

  const data = [
    {
      nombre: "Hamburguesa Clásica",
      categoria: "Comidas",
      precio: "$18.000",
      estado: "Activo",
    },
    {
      nombre: "Gaseosa 400ml",
      categoria: "Bebidas",
      precio: "$4.000",
      estado: "Activo",
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Productos</h1>

        <Button icon={<Plus />} variant="primary">
          Nuevo Producto
        </Button>
      </div>

      {/* TABLA */}
      <Table columns={columns} data={data} />
    </div>
  );
}
