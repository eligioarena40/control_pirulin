import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag, CreditCard, FileText, MessageCircle, CheckCircle } from 'lucide-react';

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
  const [reciboVentaModal, setReciboVentaModal] = useState(null);

  const deudaTotalCalculada = historial.reduce((acc, item) => {
    if (item.tipo === "venta")
      return acc + (item.saldoPendiente || item.montoTotal || 0);
    if (item.tipo === "pago")
      return acc - (item.montoAbonado || 0);
    return acc;
  }, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <button
        onClick={() => {
          setClienteSeleccionado(null);
          setHistorial([]);
        }}
        className="btn btn-sm btn-ghost gap-2 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl px-3 py-2"
      >
        <ArrowLeft className="w-4 h-4 stroke-[2.5]" /> Volver a lista de clientes
      </button>

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
                    {new Date(item.fechaPago || item.fecha || item.createdAt).toLocaleDateString()}
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
                        className="btn btn-sm bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-extrabold rounded-xl px-3.5"
                        title="Ver Comprobante"
                      >
                        <FileText className="w-4 h-4 stroke-[2.5]" /> Recibo
                      </button>
                    ) : (
                      <button
                        onClick={() => setReciboVentaModal(item)}
                        className="btn btn-sm bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border-2 border-rose-500 text-rose-700 dark:text-rose-400 font-extrabold rounded-xl px-3.5"
                        title="Ver Recibo de Venta"
                      >
                        <FileText className="w-4 h-4 stroke-[2.5]" /> Recibo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reciboVentaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            
            <div className="text-center space-y-2 pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Comprobante de Venta</h3>
              <p className="text-xs text-gray-400">{new Date(reciboVentaModal.fecha || reciboVentaModal.createdAt).toLocaleString()}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4 space-y-3 border border-gray-100 dark:border-gray-800 text-sm">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Personal / Cliente</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200">{clienteSeleccionado.nombre}</p>
                  <p className="text-xs text-amber-600 font-semibold">Dpto: {clienteSeleccionado.departamento || 'General'}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Producto Entregado</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{reciboVentaModal.descripcion || reciboVentaModal.producto?.nombre || "Producto"}</span>
                  <span className="font-bold text-gray-900 dark:text-white">US$ {(reciboVentaModal.montoTotal || reciboVentaModal.total || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-center text-base">
                <span className="font-bold text-gray-700 dark:text-gray-300">Total a Pagar:</span>
                <span className="font-black text-rose-600 text-lg">US$ {(reciboVentaModal.montoTotal || reciboVentaModal.total || 0).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                const mensaje = `📦 *COMPROBANTE DE VENTA - PIRULÍN*\n👤 Cliente: ${clienteSeleccionado.nombre}\n🏢 Dpto: ${clienteSeleccionado.departamento || "General"}\n🛒 Producto: ${reciboVentaModal.descripcion || "Producto"}\n💰 Total: US$ ${(reciboVentaModal.montoTotal || reciboVentaModal.total || 0).toFixed(2)}`;
                const tlf = clienteSeleccionado.telefono ? clienteSeleccionado.telefono.replace(/\D/g, "") : "";
                window.open(`https://wa.me/${tlf}?text=${encodeURIComponent(mensaje)}`, "_blank");
              }}
              className="w-full btn h-12 bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-2xl flex items-center justify-center gap-2 font-bold shadow-md"
            >
              <MessageCircle className="w-5 h-5" /> Compartir por WhatsApp
            </button>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => {
                  const itemSeleccionado = reciboVentaModal;
                  setReciboVentaModal(null);
                  setEntregaModal(itemSeleccionado);
                  setEditandoEntregaId(itemSeleccionado._id);
                  setFormEdicionEntrega({
                    producto: itemSeleccionado.producto?._id || itemSeleccionado.producto || "",
                    cantidad: itemSeleccionado.cantidad || 1,
                    total: itemSeleccionado.total || itemSeleccionado.montoTotal || 0,
                  });
                }}
                className="btn h-11 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl border-none"
              >
                ✏️ Editar
              </button>
              
              <button
                onClick={() => {
                  const entregaId = reciboVentaModal._id;
                  const clienteActual = clienteSeleccionado;
                  setReciboVentaModal(null);
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
                        verHistorialCliente(clienteActual, resEntregas.data, resPagos.data);
                        mostrarToast('Entrega eliminada con éxito');
                      } catch (error) {
                        console.error('Error al eliminar entrega:', error);
                        alert('No se pudo eliminar la entrega.');
                      }
                    }
                  });
                }}
                className="btn h-11 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl border-none"
              >
                🗑️ Eliminar
              </button>

              <button
                onClick={() => setReciboVentaModal(null)}
                className="btn h-11 bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs rounded-xl border-none"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}