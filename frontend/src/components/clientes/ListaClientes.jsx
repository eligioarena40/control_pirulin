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
    <div className="space-y-5 pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-800 dark:text-white">
            Gestión de Personal y Clientes
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Consulta estatus de deudas, historial y administración
          </p>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="search"
          autoComplete="off"
          placeholder="Buscar por nombre o departamento..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full h-13 sm:h-14 pl-12 pr-4 bg-white dark:bg-gray-900 shadow-sm rounded-2xl border-2 border-gray-200 dark:border-gray-800 focus:border-amber-600 focus:outline-none text-sm sm:text-base font-semibold text-gray-800 dark:text-white transition-all"
        />
      </div>

      {/* Tarjetas de Clientes */}
      <div className="grid grid-cols-1 gap-3.5">
        {clientesFiltrados.map((cliente) => {
          const deudaReal = calcularDeudaCliente(cliente._id);
          return (
            <div
              key={cliente._id}
              className="bg-white dark:bg-gray-900 rounded-3xl p-4 sm:p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2.5 hover:shadow-md transition"
            >
              {/* Datos del cliente */}
              <div
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                onClick={() => verHistorialCliente(cliente)}
              >
                <div
                  className={`w-2.5 sm:w-3 h-12 sm:h-14 shrink-0 rounded-full ${
                    deudaReal > 0 ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                />
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white truncate capitalize">
                    {cliente.nombre}
                  </h3>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 truncate">
                    Dpto: {cliente.departamento || "General"}
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-400 truncate">
                    {cliente.telefono || "Sin teléfono"}
                  </p>
                </div>
              </div>

              {/* Estado de deuda + acciones */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="text-right">
                  {deudaReal > 0 ? (
                    <span className="inline-block whitespace-nowrap bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 font-extrabold text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-2 rounded-xl">
                      US$ {deudaReal.toFixed(2)}
                      <span className="hidden sm:inline"> pendiente</span>
                    </span>
                  ) : (
                    <span className="inline-block whitespace-nowrap bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 font-extrabold text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-2 rounded-xl">
                      Sin deuda
                    </span>
                  )}
                </div>

                {/* Lápiz arriba y basura abajo en móvil; juntos en escritorio */}
                <div className="flex flex-col sm:flex-row items-center gap-1.5 border-l pl-2 sm:pl-3 border-gray-200 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setClienteModal(cliente);
                      setFormEdicionCliente({
                        nombre: cliente.nombre || "",
                        departamento: cliente.departamento || "",
                        telefono: cliente.telefono || "",
                      });
                    }}
                    className="btn btn-xs sm:btn-sm btn-ghost bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold p-2 rounded-xl"
                    title="Actualizar Cliente"
                  >
                    <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    type="button"
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
                    className="btn btn-xs sm:btn-sm btn-ghost bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 font-bold p-2 rounded-xl"
                    title="Eliminar Cliente"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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