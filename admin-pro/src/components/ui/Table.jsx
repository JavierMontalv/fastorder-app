export default function Table({ columns = [], data = [] }) {
  // Convertimos columnas en objetos compatibles
  const normalizedColumns = columns.map((col) =>
    typeof col === "string"
      ? { label: col, accessor: col }
      : col
  );

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full">

        {/* HEADER */}
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {normalizedColumns.map((col) => (
              <th
                key={col.accessor}
                className="text-left px-4 py-3 text-gray-600 text-sm font-semibold uppercase tracking-wide"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* BODY */}
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={normalizedColumns.length}
                className="text-center py-6 text-gray-500 text-sm"
              >
                No hay datos disponibles
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={idx}
                className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {normalizedColumns.map((col) => (
                  <td key={col.accessor} className="px-4 py-3 text-sm text-gray-800">
                    {row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
