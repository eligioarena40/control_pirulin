import React from 'react';
import { Edit2, Trash2, ArrowLeft, ShoppingBag, CreditCard, FileText } from 'lucide-react';

export default function DetalleCliente({
  clienteSeleccionado,
  setClienteSeleccionado,
  setHistorial,
  historial,
  setReciboPagoModal,
  setEntregaModal,
  setEditandoEntregaId,
  setFormEdicionEntrega,
  setConfirmarModal,
  api,
  todasEntregas,
  todosPagos,
  verHistorialCliente,
  mostrarToast
}) {
  const deudaTotalCalculada = historial.reduce((acc, item) => {
    if (item.tipo === "venta")
      return acc + (item.saldoPendiente || item.montoTotal || 0);
    if (item.tipo === "pago")
      return acc - (item.montoAbonado || 0);
    return acc;
  }, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Botón de retorno moderno */}
      <button
        onClick={() => {
          setClienteSeleccionado(null);
          setHistorial([]);
        }}
        className="btn btn-sm btn-ghost gap-2 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl px-3 py-2"
      >
        <ArrowLeft className="w-4 h-4 stroke-[2.5]" /> Volver a lista de clientes
      </button>

      {/* Tarjeta Resumen del Cliente Mejorada */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-amber-500"></div>
        <div className="pl-2 space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white capitalize tracking-tight">
            {clienteSeleccionado.nombre}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold">
            <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50">
              Dpto: {clienteSeleccionado.departamento || "General"}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              {clienteSeleccionado.telefono || "Sin teléfono registrado"}
            </span>
          </div>
        </div>

        <div className="w-full sm:w-auto bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-left sm:text-right flex sm:flex-col justify-between items-center sm:items-end">
          <p className="text-[10px] sm:text-xs uppercase tracking-wider font-extrabold text-gray-400">
            Deuda Acumulada
          </p>
          <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
            US$ {deudaTotalCalculada.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">
          Historial de Compras y Entregas
        </h3>
        <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-xl">
          {historial.length} registros
        </span>
      </div>

      {/* Lista del Historial */}
      {historial.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-800 p-6">
          <p className="text-gray-500 text-sm font-medium">Este cliente no tiene transacciones registradas.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {historial.map((item, index) => {
            const esVenta = item.tipo === "venta";
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200 dark:border-gray-800 space-y-3 hover:shadow-md transition-all relative overflow-hidden"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${esVenta ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>

                <div className="flex justify-between items-center pl-2">
                  <span
                    className={`badge font-extrabold text-xs px-3 py-2 rounded-xl border ${
                      esVenta 
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50" 
                        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                    }`}
                  >
                    {esVenta ? "🛒 Venta / Pendiente" : "💵 Abono / Pago"}
                  </span>
                  <span className="text-xs font-semibold text-gray-400">
                    {new Date(item.fecha || item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pl-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-gray-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                      {esVenta ? <ShoppingBag className="w-4 h-4 text-amber-600 shrink-0" /> : <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />}
                      {item.descripcion || item.concepto || "Transacción"}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {esVenta
                        ? `Venta total: US$ ${(item.montoTotal || 0).toFixed(2)} • Saldo pendiente: US$ ${(item.saldoPendiente || 0).toFixed(2)}`
                        : `Método: ${(item.metodoPago || "").replace("_", " ").toUpperCase()} • Ref: ${item.referenciaPago || "S/R"}`}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0">
                    <span className={`font-black text-lg sm:text-xl ${esVenta ? "text-gray-900 dark:text-white" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {esVenta
                        ? `US$ ${(item.montoTotal || 0).toFixed(2)}`
                        : `US$ ${(item.montoAbonado || 0).toFixed(2)}`}
                    </span>

                    {!esVenta ? (
                      <button
                        onClick={() => setReciboPagoModal(item)}
                        className="btn btn-sm bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-none font-bold rounded-xl px-3.5"
                        title="Ver Comprobante"
                      >
                        <FileText className="w-4 h-4" /> Recibo
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEntregaModal(item);
                            setEditandoEntregaId(item._id);
                            setFormEdicionEntrega({
                              cantidad: item.cantidad || 1,
                              total: item.total || item.montoTotal || 0,
                            });
                          }}
                          className="btn btn-sm btn-square btn-ghost text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl"
                          title="Actualizar Entrega"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const entregaId = item._id;
                            setConfirmarModal({
                              titulo: 'Eliminar Venta / Entrega',
                              mensaje: '¿Estás seguro de eliminar esta entrega pendiente? Esto actualizará la deuda del cliente.',
                              onConfirm: async () => {
                                try {
                                  await api.delete(`/api/entregas/${entregaId}`);
                                  const [resEntregas, resPagos] = await Promise.all([
                                    api.get('/api/entregas'),
                                    api.get('/api/pagos'),
                                  ]);
                                  verHistorialCliente(clienteSeleccionado, resEntregas.data, resPagos.data);
                                  mostrarToast('Entrega eliminada con éxito');
                                } catch (error) {
                                  console.error('Error al eliminar entrega:', error);
                                  alert('No se pudo eliminar la entrega.');
                                }
                              }
                            });
                          }}
                          className="btn btn-sm btn-square btn-ghost text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl"
                          title="Eliminar Entrega"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}