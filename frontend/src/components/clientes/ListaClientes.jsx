import React from 'react';
import { Search, Edit2, Trash2 } from 'lucide-react';

export default function ListaClientes({
  busqueda,
  setBusqueda,
  clientesFiltrados,
  calcularDeudaCliente,
  verHistorialCliente,
  setClienteModal,
  setFormEdicionCliente,
  setConfirmarModal,
  api,
  cargarDatosGenerales,
  mostrarToast
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-800">
            Gestión de Personal y Clientes
          </h1>
          <p className="text-sm text-gray-500">
            Consulta estatus de deudas, historial y administración
          </p>
        </div>
      </div>

      {/* Barra de búsqueda engrosada y estilizada */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="search"
          autoComplete="off"
          placeholder="Buscar por nombre o departamento..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full h-14 pl-12 pr-4 bg-white shadow-sm rounded-2xl border-2 border-gray-200 focus:border-amber-600 focus:outline-none text-base font-semibold text-gray-800 transition-all"
        />
      </div>

      {/* Tarjetas de Clientes */}
      <div className="grid grid-cols-1 gap-4">
        {clientesFiltrados.map((cliente) => {
          const deudaReal = calcularDeudaCliente(cliente._id);
          return (
            <div
              key={cliente._id}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition"
            >
              <div
                className="flex items-center gap-4 flex-grow cursor-pointer"
                onClick={() => verHistorialCliente(cliente)}
              >
                <div
                  className={`w-3 h-12 rounded-full ${
                    deudaReal > 0 ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                />
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {cliente.nombre}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Dpto: {cliente.departamento || "General"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {cliente.telefono || "Sin teléfono"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  {deudaReal > 0 ? (
                    <span className="badge badge-error bg-rose-100 text-rose-700 border-rose-200 font-extrabold text-xs px-4 py-3.5 rounded-2xl shadow-2xs">
                      US$ {deudaReal.toFixed(2)} pendiente
                    </span>
                  ) : (
                    <span className="badge badge-success bg-emerald-100 text-emerald-700 border-emerald-200 font-extrabold text-xs px-4 py-3.5 rounded-2xl shadow-2xs">
                      Sin deuda
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 border-l pl-3 border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setClienteModal(cliente);
                      setFormEdicionCliente({
                        nombre: cliente.nombre || "",
                        departamento: cliente.departamento || "",
                        telefono: cliente.telefono || "",
                      });
                    }}
                    className="btn btn-sm btn-ghost bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-2.5 rounded-xl"
                    title="Actualizar Cliente"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmarModal({
                        titulo: "Eliminar Cliente",
                        mensaje: `¿Estás seguro de eliminar al cliente ${cliente.nombre}? Esta acción no se puede deshacer.`,
                        onConfirm: async () => {
                          try {
                            await api.delete(`/api/clientes/${cliente._id}`);
                            await cargarDatosGenerales();
                            mostrarToast("Cliente eliminado con éxito");
                          } catch (error) {
                            console.error("Error al eliminar cliente:", error);
                            alert("No se pudo eliminar el cliente.");
                          }
                        },
                      });
                    }}
                    className="btn btn-sm btn-ghost bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2.5 rounded-xl"
                    title="Eliminar Cliente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}