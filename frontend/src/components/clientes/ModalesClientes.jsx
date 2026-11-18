import React from 'react';
import { MessageCircle, UserPen, Save, X, AlertTriangle, FileText, CheckCircle } from 'lucide-react';

export default function ModalesClientes({
  confirmarModal,
  setConfirmarModal,
  clienteModal,
  setClienteModal,
  formEdicionCliente,
  setFormEdicionCliente,
  api,
  cargarDatosGenerales,
  mostrarToast,
  entregaModal,
  setEntregaModal,
  setEditandoEntregaId,
  formEdicionEntrega,
  setFormEdicionEntrega,
  clientes,
  productos,
  clienteSeleccionado,
  setClienteSeleccionado,
  verHistorialCliente,
  reciboPagoModal,
  setReciboPagoModal,
  editandoPagoId,
  setEditandoPagoId,
  formEdicion,
  setFormEdicion,
  toastMensaje,
  setToastMensaje
}) {
  return (
    <>
      {/* 📌 MODAL DE CONFIRMACIÓN */}
      {confirmarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4 text-center my-auto">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">
                {confirmarModal.titulo}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                {confirmarModal.mensaje}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={async () => {
                  const accion = confirmarModal.onConfirm;
                  setConfirmarModal(null);
                  if (accion) await accion();
                }}
                className="btn h-12 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm rounded-2xl shadow-md border-none"
              >
                Sí, Eliminar
              </button>
              <button
                onClick={() => setConfirmarModal(null)}
                className="btn h-12 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-extrabold text-sm rounded-2xl border-none"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📌 MODAL DE EDICIÓN DE CLIENTE */}
      {clienteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-5 my-auto">
            
            <div className="text-center pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-extrabold text-xs uppercase tracking-wider mb-2 shadow-2xs">
                <UserPen className="w-4 h-4" /> Editando Cliente
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white capitalize">
                {clienteModal.nombre}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Nombre y Apellido
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={formEdicionCliente.nombre}
                  onChange={(e) => setFormEdicionCliente({ ...formEdicionCliente, nombre: e.target.value })}
                  className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-amber-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none text-sm font-semibold text-gray-900 dark:text-white rounded-xl shadow-2xs transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Departamento
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={formEdicionCliente.departamento}
                  onChange={(e) => setFormEdicionCliente({ ...formEdicionCliente, departamento: e.target.value })}
                  className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-amber-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none text-sm font-semibold text-gray-900 dark:text-white rounded-xl shadow-2xs transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={formEdicionCliente.telefono}
                  onChange={(e) => setFormEdicionCliente({ ...formEdicionCliente, telefono: e.target.value })}
                  className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-amber-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none text-sm font-semibold text-gray-900 dark:text-white rounded-xl shadow-2xs transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setClienteModal(null)}
                className="btn h-12 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-none font-bold text-sm rounded-2xl flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4 stroke-[2.5]" /> Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await api.put(`/api/clientes/${clienteModal._id}`, {
                      nombre: formEdicionCliente.nombre,
                      departamento: formEdicionCliente.departamento,
                      telefono: formEdicionCliente.telefono,
                    });
                    await cargarDatosGenerales();
                    setClienteModal(null);
                    mostrarToast("Cliente actualizado con éxito");
                  } catch (err) {
                    console.error(err);
                    alert("Error al actualizar el cliente.");
                  }
                }}
                className="btn h-12 bg-emerald-600 hover:bg-emerald-700 text-white border-none font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4 stroke-[2.5]" /> Guardar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 📌 MODAL DE EDICIÓN DE ENTREGA (CON CÁLCULO AUTOMÁTICO DE PRECIO) */}
      {entregaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-5 my-auto">
            
            <div className="text-center pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-extrabold text-xs uppercase tracking-wider mb-2 shadow-2xs">
                ✏️ Editando Entrega
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white capitalize">
                {productos?.find((p) => p._id === (typeof formEdicionEntrega.producto === "object" ? formEdicionEntrega.producto?._id : formEdicionEntrega.producto))?.nombre || entregaModal.producto?.nombre || "Producto"}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Producto
                </label>
                <select
                  value={
                    typeof formEdicionEntrega.producto === "object"
                      ? formEdicionEntrega.producto?._id
                      : formEdicionEntrega.producto || ""
                  }
                  onChange={(e) => {
                    const nuevoProdId = e.target.value;
                    const prodSeleccionado = productos?.find((p) => p._id === nuevoProdId);
                    const nuevaCantidad = Number(formEdicionEntrega.cantidad) || 1;
                    
                    // Multiplicamos automáticamente el precio real del nuevo producto por la cantidad
                    const nuevoTotal = prodSeleccionado ? Number(prodSeleccionado.precio) * nuevaCantidad : formEdicionEntrega.total;

                    setFormEdicionEntrega({
                      ...formEdicionEntrega,
                      producto: nuevoProdId,
                      total: nuevoTotal,
                    });
                  }}
                  className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-amber-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none text-sm font-semibold text-gray-900 dark:text-white rounded-xl shadow-2xs transition-all"
                >
                  <option value="" disabled>Selecciona un producto</option>
                  {productos?.map((prod) => (
                    <option key={prod._id} value={prod._id}>
                      {prod.nombre} (US$ {Number(prod.precio).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={formEdicionEntrega.cantidad}
                  onChange={(e) => {
                    const nuevaCant = Number(e.target.value) || 1;
                    const prodIdActual = typeof formEdicionEntrega.producto === "object" ? formEdicionEntrega.producto?._id : formEdicionEntrega.producto;
                    const prodSeleccionado = productos?.find((p) => p._id === prodIdActual);
                    
                    const nuevoTotal = prodSeleccionado ? Number(prodSeleccionado.precio) * nuevaCant : formEdicionEntrega.total;

                    setFormEdicionEntrega({
                      ...formEdicionEntrega,
                      cantidad: nuevaCant,
                      total: nuevoTotal,
                    });
                  }}
                  className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-amber-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none text-sm font-semibold text-gray-900 dark:text-white rounded-xl shadow-2xs transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Monto Total (US$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formEdicionEntrega.total}
                  onChange={(e) => setFormEdicionEntrega({ ...formEdicionEntrega, total: Number(e.target.value) })}
                  className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-amber-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none text-sm font-semibold text-gray-900 dark:text-white rounded-xl shadow-2xs transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => {
                  setEntregaModal(null);
                  setEditandoEntregaId(null);
                }}
                className="btn h-12 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-none font-bold text-sm rounded-2xl flex items-center justify-center gap-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await api.put(`/api/entregas/${entregaModal._id}`, {
                      producto: formEdicionEntrega.producto,
                      cantidad: Number(formEdicionEntrega.cantidad),
                      total: Number(formEdicionEntrega.total),
                      montoTotal: Number(formEdicionEntrega.total),
                    });
                    
                    const datosNuevos = await cargarDatosGenerales();
                    if (datosNuevos && clienteSeleccionado) {
                      const clienteActualizado = datosNuevos.clientes.find((c) => c._id === clienteSeleccionado._id);
                      if (clienteActualizado) {
                        setClienteSeleccionado(clienteActualizado);
                        verHistorialCliente(clienteActualizado, datosNuevos.entregas, datosNuevos.pagos);
                      }
                    }

                    setEntregaModal(null);
                    setEditandoEntregaId(null);
                    mostrarToast("Entrega actualizada con éxito");
                  } catch (err) {
                    console.error(err);
                    alert("Error al actualizar la entrega.");
                  }
                }}
                className="btn h-12 bg-emerald-600 hover:bg-emerald-700 text-white border-none font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2"
              >
                Guardar Cambios
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 📌 MODAL DE COMPROBANTE DE PAGO */}
      {reciboPagoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            
            <div className="text-center space-y-2 pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Comprobante de Pago</h3>
              <p className="text-xs text-gray-400">{new Date(reciboPagoModal.createdAt).toLocaleString()}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4 space-y-3 border border-gray-100 dark:border-gray-800 text-sm">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Personal / Cliente</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200">{clienteSeleccionado?.nombre}</p>
                  <p className="text-xs text-amber-600 font-semibold">Dpto: {clienteSeleccionado?.departamento || 'General'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Método</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200 capitalize">{(reciboPagoModal.metodoPago || "").replace("_", " ")}</p>
                </div>
              </div>

              {editandoPagoId === reciboPagoModal._id ? (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Monto Abonado (US$)</label>
                    <input
                      type="number"
                      value={formEdicion.montoAbonado}
                      onChange={(e) => setFormEdicion({ ...formEdicion, montoAbonado: e.target.value })}
                      className="w-full h-11 px-3 bg-white dark:bg-gray-900 border-2 border-emerald-500 rounded-xl font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">Referencia</label>
                      <input
                        type="text"
                        value={formEdicion.referenciaPago}
                        onChange={(e) => setFormEdicion({ ...formEdicion, referenciaPago: e.target.value })}
                        className="w-full h-11 px-3 bg-white dark:bg-gray-900 border-2 border-emerald-500 rounded-xl font-bold text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">Monto Bs</label>
                      <input
                        type="number"
                        value={formEdicion.montoBs}
                        onChange={(e) => setFormEdicion({ ...formEdicion, montoBs: e.target.value })}
                        className="w-full h-11 px-3 bg-white dark:bg-gray-900 border-2 border-emerald-500 rounded-xl font-bold text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">Cambiar Comprobante (Opcional)</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setFormEdicion({ ...formEdicion, nuevoComprobante: e.target.files[0] })}
                      className="file-input file-input-sm file-input-bordered file-input-success w-full bg-white dark:bg-gray-900 text-xs"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Si no seleccionas ninguno, se conservará el actual.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-gray-400 font-bold uppercase block text-[10px]">Referencia</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{reciboPagoModal.referenciaPago || "S/R"}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 font-bold uppercase block text-[10px]">Monto Bs</span>
                    <span className="font-bold text-amber-600">Bs. {(reciboPagoModal.montoBs || 0).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {editandoPagoId !== reciboPagoModal._id && reciboPagoModal.comprobanteUrl && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <a
                    href={reciboPagoModal.comprobanteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border-2 border-emerald-400 text-emerald-700 dark:text-emerald-300 w-full flex items-center justify-center gap-2 rounded-xl font-extrabold h-12 shadow-2xs"
                  >
                    <FileText className="w-4 h-4" /> Ver Comprobante en Cloudinary
                  </a>
                </div>
              )}

              {editandoPagoId !== reciboPagoModal._id && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-base">
                  <span className="font-bold text-gray-700 dark:text-gray-300">Monto Abonado:</span>
                  <span className="font-black text-emerald-600 text-lg">US$ {(reciboPagoModal.montoAbonado || 0).toFixed(2)}</span>
                </div>
              )}
            </div>

            {editandoPagoId !== reciboPagoModal._id && clienteSeleccionado && (
              <button
                onClick={() => {
                  const mensaje = `📦 *COMPROBANTE DE PAGO - PIRULÍN*\n👤 Cliente: ${clienteSeleccionado.nombre}\n🏢 Dpto: ${clienteSeleccionado.departamento || "General"}\n💳 Método: ${(reciboPagoModal.metodoPago || "").replace("_", " ").toUpperCase()}\n📌 Referencia: ${reciboPagoModal.referenciaPago || "S/R"}\n🇻🇪 Monto Bs: Bs. ${(reciboPagoModal.montoBs || 0).toFixed(2)}\n💰 Abonado: US$ ${(reciboPagoModal.montoAbonado || 0).toFixed(2)}`;
                  const tlf = clienteSeleccionado.telefono ? clienteSeleccionado.telefono.replace(/\D/g, "") : "";
                  window.open(`https://wa.me/${tlf}?text=${encodeURIComponent(mensaje)}`, "_blank");
                }}
                className="w-full btn h-12 bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-2xl flex items-center justify-center gap-2 font-bold shadow-md"
              >
                <MessageCircle className="w-5 h-5" /> Compartir por WhatsApp
              </button>
            )}

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
              {editandoPagoId === reciboPagoModal._id ? (
                <>
                  <button
                    onClick={async () => {
                      try {
                        const formData = new FormData();
                        formData.append("montoAbonado", Number(formEdicion.montoAbonado));
                        formData.append("referenciaPago", formEdicion.referenciaPago);
                        formData.append("montoBs", Number(formEdicion.montoBs));
                        if (formEdicion.nuevoComprobante) {
                          formData.append("comprobante", formEdicion.nuevoComprobante);
                        }

                        await api.put(`/api/pagos/${reciboPagoModal._id}`, formData, {
                          headers: { "Content-Type": "multipart/form-data" }
                        });

                        const datosNuevos = await cargarDatosGenerales();
                        if (datosNuevos && clienteSeleccionado) {
                          const clienteActualizado = datosNuevos.clientes.find((c) => c._id === clienteSeleccionado._id);
                          if (clienteActualizado) {
                            setClienteSeleccionado(clienteActualizado);
                            verHistorialCliente(clienteActualizado, datosNuevos.entregas, datosNuevos.pagos);
                          }
                        }
                        setEditandoPagoId(null);
                        setReciboPagoModal(null);
                        mostrarToast("Comprobante actualizado con éxito");
                      } catch (err) {
                        console.error(err);
                        alert("Error al actualizar el pago.");
                      }
                    }}
                    className="btn h-11 bg-emerald-600 text-white font-bold text-xs rounded-xl col-span-2 border-none"
                  >
                    Guardar Cambios
                  </button>
                  <button
                    onClick={() => setEditandoPagoId(null)}
                    className="btn h-11 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl border-none"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditandoPagoId(reciboPagoModal._id);
                      setFormEdicion({
                        montoAbonado: reciboPagoModal.montoAbonado || 0,
                        referenciaPago: reciboPagoModal.referenciaPago || "",
                        montoBs: reciboPagoModal.montoBs || 0,
                        nuevoComprobante: null,
                      });
                    }}
                    className="btn h-11 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl border-none"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => {
                      const pagoId = reciboPagoModal._id;
                      const clienteActual = clienteSeleccionado;
                      setReciboPagoModal(null);
                      setConfirmarModal({
                        titulo: "Eliminar Comprobante",
                        mensaje: "¿Estás seguro de eliminar este pago? Esto afectará los saldos y deudas del cliente.",
                        onConfirm: async () => {
                          try {
                            await api.delete(`/api/pagos/${pagoId}`);
                            const datosNuevos = await cargarDatosGenerales();
                            if (datosNuevos) {
                              verHistorialCliente(clienteActual, datosNuevos.entregas, datosNuevos.pagos);
                            }
                            mostrarToast("Comprobante eliminado con éxito");
                          } catch (error) {
                            console.error("Error al eliminar pago:", error);
                            alert("No se pudo eliminar el pago.");
                          }
                        },
                      });
                    }}
                    className="btn h-11 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl border-none"
                  >
                    🗑️ Eliminar
                  </button>
                  <button
                    onClick={() => setReciboPagoModal(null)}
                    className="btn h-11 bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs rounded-xl border-none"
                  >
                    Cerrar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {toastMensaje && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex flex-col gap-1.5 min-w-[300px] border border-gray-800 relative overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  ✓
                </div>
                <span className="text-sm font-medium tracking-wide">
                  {toastMensaje}
                </span>
              </div>
              <button
                onClick={() => setToastMensaje(null)}
                className="text-gray-400 hover:text-white text-xs font-bold px-1"
              >
                ✕
              </button>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800">
              <div className="h-full bg-emerald-500 animate-progress-shrink"></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}