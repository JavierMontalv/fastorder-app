import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function Restaurante() {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Configuración del Restaurante</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">

        <Input label="Nombre del Restaurante" placeholder="Ej: FastOrder Burger" />

        <Input label="Dirección" placeholder="Calle 123 #45-67" />

        <Input label="Teléfono" placeholder="+57 300 000 0000" />

        <Input label="Tiempo promedio de entrega (min)" type="number" />

        <div className="flex justify-end">
          <Button variant="primary">Guardar Cambios</Button>
        </div>
      </div>
    </div>
  );
}
