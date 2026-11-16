import React, { useState, useEffect } from "react";
import api from "../services/api";
import { MessageCircle, Edit2, Trash2 } from "lucide-react";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [reciboPagoModal, setReciboPagoModal] = useState(null);
  const [entregaModal, setEntregaModal] = useState(null);
  const [clienteModal, setClienteModal] = useState(null);

  // 📌 Estado para el Modal de Confirmación Moderno
  const [confirmarModal, setConfirmarModal] = useState(null); // { titulo, mensaje, onConfirm }

  // 📌 Estados globales y de cálculo en tiempo real
  const [todasEntregas, setTodasEntregas] = useState([]);
  const [todosPagos, setTodosPagos] = useState([]);

  // 📌 Estados de edición y notificación flotante (Toast)
  const [editandoPagoId, setEditandoPagoId] = useState(null);
  const [editandoEntregaId, setEditandoEntregaId] = useState(null);

  const [formEdicion, setFormEdicion] = useState({
    montoAbonado: "",
    referenciaPago: "",
    montoBs: "",
  });

  const [formEdicionEntrega, setFormEdicionEntrega] = useState({
    cantidad: 1,
    total: 0,
  });

  const [formEdicionCliente, setFormEdicionCliente] = useState({
    nombre: "",
    departamento: "",
    telefono: "",
  });

  const [toastMensaje, setToastMensaje] = useState(null);

  const mostrarToast = (mensaje) => {
    setToastMensaje(mensaje);
    setTimeout(() => {
      setToastMensaje(null);
    }, 3500);
  };

  useEffect(() => {
    cargarDatosGenerales();
  }, []);

  const cargarDatosGenerales = async () => {
    try {
      const [resClientes, resEntregas, resPagos] = await Promise.all([
        api.get("/api/clientes"),
        api.get("/api/entregas"),
        api.get("/api/pagos"),
      ]);
      setClientes(resClientes.data);
      setTodasEntregas(resEntregas.data);
      setTodosPagos(resPagos.data);
    } catch (error) {
      console.error("Error al cargar datos generales:", error);
    }
  };

  // 📌 Función para calcular la deuda real cruzando entregas y pagos
  const calcularDeudaCliente = (clienteId) => {
    const entregasCliente = todasEntregas.filter(
      (e) => (e.cliente?._id || e.cliente) === clienteId,
    );
    const pagosCliente = todosPagos.filter(
      (p) => (p.cliente?._id || p.cliente) === clienteId,
    );

    const totalDeuda = entregasCliente.reduce(
      (acc, e) =>
        acc +
        (e.saldoPendiente ?? (e.pagado ? 0 : e.total || e.montoTotal || 0)),
      0,
    );
    const totalPagos = pagosCliente.reduce(
      (acc, p) => acc + (p.montoAbonado || 0),
      0,
    );

    return Math.max(0, totalDeuda - totalPagos);
  };

  const verHistorialCliente = async (
    cliente,
    entregasOverride = null,
    pagosOverride = null,
  ) => {
    setClienteSeleccionado(cliente);
    try {
      const entregasAUsar = entregasOverride || todasEntregas;
      const pagosAUsar = pagosOverride || todosPagos;

      const entregasCliente = entregasAUsar
        .filter((e) => (e.cliente?._id || e.cliente) === cliente._id)
        .map((e) => ({
          ...e,
          tipo: "venta",
          fecha: e.createdAt,
          descripcion: `${e.producto?.nombre || "Producto"} (Cant: ${e.cantidad || 1})`,
          montoTotal: e.total || e.montoTotal || 0,
          saldoPendiente: e.saldoPendiente ?? (e.pagado ? 0 : e.total || 0),
        }));

      const pagosCliente = pagosAUsar
        .filter((p) => (p.cliente?._id || p.cliente) === cliente._id)
        .map((p) => ({
          ...p,
          tipo: "pago",
          fecha: p.createdAt,
          descripcion: `Abono (${(p.metodoPago || "pago_movil").replace("_", " ")})`,
        }));

      const historialCombinado = [...entregasCliente, ...pagosCliente].sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha),
      );

      setHistorial(historialCombinado);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    }
  };

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.departamento &&
        c.departamento.toLowerCase().includes(busqueda.toLowerCase())),
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 📌 VISTA PRINCIPAL: LISTA DE CLIENTES */}
      {!clienteSeleccionado ? (
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

          {/* Barra de búsqueda */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre o departamento..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full input input-bordered bg-white shadow-sm rounded-2xl pl-4"
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
                        <span className="badge badge-error bg-rose-100 text-rose-700 border-rose-200 font-bold text-xs p-3">
                          US$ {deudaReal.toFixed(2)} pendiente
                        </span>
                      ) : (
                        <span className="badge badge-success bg-emerald-100 text-emerald-700 border-emerald-200 font-bold text-xs p-3">
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
                        className="btn btn-sm btn-ghost bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-2.5"
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
                                console.error(
                                  "Error al eliminar cliente:",
                                  error,
                                );
                                alert("No se pudo eliminar el cliente.");
                              }
                            },
                          });
                        }}
                        className="btn btn-sm btn-ghost bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2.5"
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
      ) : (
        /* 📌 VISTA DE DETALLE / HISTORIAL DEL CLIENTE SELECCIONADO */
        <div className="space-y-6">
          <button
            onClick={() => {
              setClienteSeleccionado(null);
              setHistorial([]);
            }}
            className="btn btn-sm btn-ghost gap-2 font-bold text-gray-600"
          >
            ← Volver a lista de clientes
          </button>

          {/* Tarjeta Resumen del Cliente */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-gray-800">
                {clienteSeleccionado.nombre}
              </h2>
              <p className="text-sm text-gray-500">
                Dpto: {clienteSeleccionado.departamento || "General"}
              </p>
              <p className="text-xs text-gray-400">
                {clienteSeleccionado.telefono || "Sin teléfono"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider font-bold text-gray-400">
                Deuda Acumulada
              </p>
              <p className="text-2xl font-black text-rose-600">
                US${" "}
                {historial
                  .reduce((acc, item) => {
                    if (item.tipo === "venta")
                      return (
                        acc + (item.saldoPendiente || item.montoTotal || 0)
                      );
                    if (item.tipo === "pago")
                      return acc - (item.montoAbonado || 0);
                    return acc;
                  }, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800">
            Historial de Compras y Entregas
          </h3>

          {/* Historial */}
          <div className="space-y-3">
            {historial.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`badge font-bold text-xs ${item.tipo === "venta" ? "badge-error bg-rose-100 text-rose-700 border-rose-200" : "badge-success bg-emerald-100 text-emerald-700 border-emerald-200"}`}
                  >
                    {item.tipo === "venta" ? "Pendiente" : "Abono / Pago"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(
                      item.fecha || item.createdAt,
                    ).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-800">
                      {item.descripcion || item.concepto || "Transacción"}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {item.tipo === "venta"
                        ? `Venta: US$ ${(item.montoTotal || 0).toFixed(2)} | Queda pendiente: US$ ${(item.saldoPendiente || 0).toFixed(2)}`
                        : `Método: ${(item.metodoPago || "").replace("_", " ")} | Ref: ${item.referenciaPago || "S/R"}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`font-black text-lg ${item.tipo === "venta" ? "text-gray-800" : "text-emerald-600"}`}
                    >
                      {item.tipo === "venta"
                        ? `US$ ${(item.montoTotal || 0).toFixed(2)}`
                        : `US$ ${(item.montoAbonado || 0).toFixed(2)}`}
                    </span>

                    {/* Botones de acción según el tipo (Pago o Venta Pendiente) */}
                    {item.tipo === "pago" ? (
                      <button
                        onClick={() => setReciboPagoModal(item)}
                        className="btn btn-sm btn-ghost bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold"
                        title="Ver Comprobante"
                      >
                        📄 Ver Recibo
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEntregaModal(item);
                            setEditandoEntregaId(item._id);
                            setFormEdicionEntrega({
                              cantidad: item.cantidad || 1,
                              total: item.total || item.montoTotal || 0,
                            });
                          }}
                          className="btn btn-sm btn-ghost bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-2.5"
                          title="Actualizar Entrega"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const entregaId = item._id;
                            const clienteActual = clienteSeleccionado;
                            setConfirmarModal({
                              titulo: 'Eliminar Venta / Entrega',
                              mensaje: '¿Estás seguro de eliminar esta entrega pendiente? Esto actualizará la deuda del cliente.',
                              onConfirm: async () => {
                                try {
                                  await api.delete(`/api/entregas/${entregaId}`);

                                  // Descargamos los datos frescos de la API
                                  const [resEntregas, resPagos] = await Promise.all([
                                    api.get('/api/entregas'),
                                    api.get('/api/pagos'),
                                  ]);

                                  setTodasEntregas(resEntregas.data);
                                  setTodosPagos(resPagos.data);

                                  // Actualizamos el historial de inmediato con los datos nuevos
                                  await verHistorialCliente(clienteActual, resEntregas.data, resPagos.data);

                                  mostrarToast('Entrega eliminada con éxito');
                                } catch (error) {
                                  console.error('Error al eliminar entrega:', error);
                                  alert('No se pudo eliminar la entrega.');
                                }
                              }
                            });
                          }}
                          className="btn btn-sm btn-ghost bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2.5"
                          title="Eliminar Entrega"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📌 MODAL DE CONFIRMACIÓN MODAL PERSONALIZADO */}
      {confirmarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center my-auto">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800">
                {confirmarModal.titulo}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {confirmarModal.mensaje}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={async () => {
                  const accion = confirmarModal.onConfirm;
                  setConfirmarModal(null);
                  if (accion) await accion();
                }}
                className="btn btn-sm bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 h-auto text-xs shadow-sm border-none"
              >
                Sí, Eliminar
              </button>
              <button
                onClick={() => setConfirmarModal(null)}
                className="btn btn-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2.5 h-auto text-xs shadow-sm border-none"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📌 MODAL DE EDICIÓN DE CLIENTE */}
      {clienteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 pb-6 shadow-2xl space-y-4 my-auto">
            <div className="text-center">
              <span className="badge badge-lg font-bold bg-blue-100 text-blue-700 p-3 uppercase">
                ✏️ Editando Cliente
              </span>
              <h3 className="text-xl font-black text-gray-800 mt-2">
                {clienteModal.nombre}
              </h3>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-200 text-sm">
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formEdicionCliente.nombre}
                  onChange={(e) =>
                    setFormEdicionCliente({
                      ...formEdicionCliente,
                      nombre: e.target.value,
                    })
                  }
                  className="w-full input input-bordered input-sm mt-1 bg-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase">
                  Departamento
                </label>
                <input
                  type="text"
                  value={formEdicionCliente.departamento}
                  onChange={(e) =>
                    setFormEdicionCliente({
                      ...formEdicionCliente,
                      departamento: e.target.value,
                    })
                  }
                  className="w-full input input-bordered input-sm mt-1 bg-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={formEdicionCliente.telefono}
                  onChange={(e) =>
                    setFormEdicionCliente({
                      ...formEdicionCliente,
                      telefono: e.target.value,
                    })
                  }
                  className="w-full input input-bordered input-sm mt-1 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
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
                className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 h-auto text-xs shadow-sm"
              >
                💾 Guardar Cambios
              </button>
              <button
                onClick={() => setClienteModal(null)}
                className="btn btn-sm bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2.5 h-auto text-xs shadow-sm"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📌 MODAL DE EDICIÓN DE ENTREGA / VENTA PENDIENTE */}
      {entregaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 pb-6 shadow-2xl space-y-4 my-auto">
            <div className="text-center">
              <span className="badge badge-lg font-bold bg-amber-100 text-amber-700 p-3 uppercase">
                ✏️ Editando Entrega / Venta
              </span>
              <h3 className="text-xl font-black text-gray-800 mt-2">
                {entregaModal.producto?.nombre || "Producto"}
              </h3>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-200 text-sm">
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase">
                  Cantidad
                </label>
                <input
                  type="number"
                  value={formEdicionEntrega.cantidad}
                  onChange={(e) =>
                    setFormEdicionEntrega({
                      ...formEdicionEntrega,
                      cantidad: e.target.value,
                    })
                  }
                  className="w-full input input-bordered input-sm mt-1 bg-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase">
                  Monto Total (US$)
                </label>
                <input
                  type="number"
                  value={formEdicionEntrega.total}
                  onChange={(e) =>
                    setFormEdicionEntrega({
                      ...formEdicionEntrega,
                      total: e.target.value,
                    })
                  }
                  className="w-full input input-bordered input-sm mt-1 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={async () => {
                  try {
                    await api.put(`/api/entregas/${entregaModal._id}`, {
                      cantidad: Number(formEdicionEntrega.cantidad),
                      total: Number(formEdicionEntrega.total),
                    });

                    await cargarDatosGenerales();
                    const clienteActualizado = clientes.find(
                      (c) => c._id === clienteSeleccionado._id,
                    );
                    if (clienteActualizado) {
                      setClienteSeleccionado(clienteActualizado);
                      verHistorialCliente(clienteActualizado);
                    }

                    setEntregaModal(null);
                    setEditandoEntregaId(null);
                    mostrarToast("Entrega actualizada con éxito");
                  } catch (err) {
                    console.error(err);
                    alert("Error al actualizar la entrega.");
                  }
                }}
                className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 h-auto text-xs shadow-sm"
              >
                💾 Guardar Cambios
              </button>
              <button
                onClick={() => {
                  setEntregaModal(null);
                  setEditandoEntregaId(null);
                }}
                className="btn btn-sm bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2.5 h-auto text-xs shadow-sm"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📌 MODAL / VISTA DEL COMPROBANTE DE PAGO ORIGINAL CON EDICIÓN INTEGRADA */}
      {reciboPagoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 pb-6 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <span className="badge badge-lg font-bold bg-emerald-100 text-emerald-700 p-3 uppercase">
                {editandoPagoId === reciboPagoModal._id
                  ? "✏️ Editando Comprobante"
                  : "✅ Comprobante de Pago Original"}
              </span>
              <h3 className="text-xl font-black text-gray-800 mt-2">
                Detalle del Abono
              </h3>
              <p className="text-xs text-gray-400">
                {new Date(reciboPagoModal.createdAt).toLocaleString()}
              </p>
            </div>

            {/* 📌 SI ESTÁ EDITANDO MOSTRAR INPUTS, SI NO MOSTRAR DATOS */}
            {editandoPagoId === reciboPagoModal._id ? (
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-200 text-sm">
                <div>
                  <label className="text-xs text-gray-500 font-semibold uppercase">
                    Monto Abonado (US$)
                  </label>
                  <input
                    type="number"
                    value={formEdicion.montoAbonado}
                    onChange={(e) =>
                      setFormEdicion({
                        ...formEdicion,
                        montoAbonado: e.target.value,
                      })
                    }
                    className="w-full input input-bordered input-sm mt-1 bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 font-semibold uppercase">
                      Referencia
                    </label>
                    <input
                      type="text"
                      value={formEdicion.referenciaPago}
                      onChange={(e) =>
                        setFormEdicion({
                          ...formEdicion,
                          referenciaPago: e.target.value,
                        })
                      }
                      className="w-full input input-bordered input-sm mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-semibold uppercase">
                      Monto Bs
                    </label>
                    <input
                      type="number"
                      value={formEdicion.montoBs}
                      onChange={(e) =>
                        setFormEdicion({
                          ...formEdicion,
                          montoBs: e.target.value,
                        })
                      }
                      className="w-full input input-bordered input-sm mt-1 bg-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">
                      Método
                    </p>
                    <p className="font-bold text-gray-800 capitalize">
                      {(reciboPagoModal.metodoPago || "").replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">
                      Referencia
                    </p>
                    <p className="font-bold text-gray-800">
                      {reciboPagoModal.referenciaPago || "S/R"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">
                      Monto Bs
                    </p>
                    <p className="font-bold text-amber-700">
                      Bs. {(reciboPagoModal.montoBs || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {reciboPagoModal.comprobanteUrl && (
                  <div className="pt-2 border-t border-gray-200">
                    <a
                      href={reciboPagoModal.comprobanteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 w-full flex items-center justify-center gap-2"
                    >
                      📄 Ver Capture / Comprobante en Cloudinary
                    </a>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-base">
                  <span className="font-bold text-gray-700">
                    Monto Abonado:
                  </span>
                  <span className="font-extrabold text-emerald-600">
                    US$ {(reciboPagoModal.montoAbonado || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* BOTÓN WHATSAPP (Solo si no está editando) */}
            {editandoPagoId !== reciboPagoModal._id && (
              <button
                onClick={() => {
                  const mensaje = `📦 *COMPROBANTE DE PAGO - PIRULÍN*\n👤 Cliente: ${clienteSeleccionado.nombre}\n🏢 Dpto: ${clienteSeleccionado.departamento || "General"}\n💳 Método: ${(reciboPagoModal.metodoPago || "").replace("_", " ").toUpperCase()}\n📌 Referencia: ${reciboPagoModal.referenciaPago || "S/R"}\n🇻🇪 Monto Bs: Bs. ${(reciboPagoModal.montoBs || 0).toFixed(2)}\n💰 Abonado: US$ ${(reciboPagoModal.montoAbonado || 0).toFixed(2)}`;
                  const tlf = clienteSeleccionado.telefono
                    ? clienteSeleccionado.telefono.replace(/\D/g, "")
                    : "";
                  window.open(
                    `https://wa.me/${tlf}?text=${encodeURIComponent(mensaje)}`,
                    "_blank",
                  );
                }}
                className="w-full btn bg-emerald-600 hover:bg-emerald-700 text-white border-none py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-5 h-5" /> Enviar Comprobante por
                WhatsApp
              </button>
            )}

            {/* 📌 BOTONES DE ACCIÓN INFERIORES */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200 mb-2">
              {editandoPagoId === reciboPagoModal._id ? (
                <>
                  <button
                    onClick={async () => {
                      try {
                        await api.put(`/api/pagos/${reciboPagoModal._id}`, {
                          montoAbonado: Number(formEdicion.montoAbonado),
                          referenciaPago: formEdicion.referenciaPago,
                          montoBs: Number(formEdicion.montoBs),
                        });

                        await cargarDatosGenerales();
                        const clienteActualizado = clientes.find(
                          (c) => c._id === clienteSeleccionado._id,
                        );
                        if (clienteActualizado) {
                          setClienteSeleccionado(clienteActualizado);
                          verHistorialCliente(clienteActualizado);
                        }

                        setEditandoPagoId(null);
                        setReciboPagoModal(null);
                        mostrarToast("Comprobante actualizado con éxito");
                      } catch (err) {
                        console.error(err);
                        alert("Error al actualizar el pago.");
                      }
                    }}
                    className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1 py-2.5 h-auto text-xs shadow-sm col-span-2"
                  >
                    💾 Guardar Cambios
                  </button>
                  <button
                    onClick={() => setEditandoPagoId(null)}
                    className="btn btn-sm bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold flex items-center justify-center py-2.5 h-auto text-xs shadow-sm"
                  >
                    ❌ Cancelar
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
                      });
                    }}
                    className="btn btn-sm btn-ghost bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center gap-1 py-2.5 h-auto text-xs shadow-sm"
                    title="Actualizar Pago"
                  >
                    ✏️ Actualizar
                  </button>

                  <button
                    onClick={() => {
                      const pagoId = reciboPagoModal._id;
                      const clienteActual = clienteSeleccionado;
                      setReciboPagoModal(null);
                      setConfirmarModal({
                        titulo: "Eliminar Comprobante",
                        mensaje:
                          "¿Estás seguro de eliminar este pago? Esto afectará los saldos y deudas del cliente.",
                        onConfirm: async () => {
                          try {
                            await api.delete(`/api/pagos/${pagoId}`);

                            // Descargamos los datos frescos de la API
                            const [resEntregas, resPagos] = await Promise.all([
                              api.get("/api/entregas"),
                              api.get("/api/pagos"),
                            ]);

                            setTodasEntregas(resEntregas.data);
                            setTodosPagos(resPagos.data);

                            // Actualizamos el historial pasándole los datos recién bajados
                            await verHistorialCliente(
                              clienteActual,
                              resEntregas.data,
                              resPagos.data,
                            );

                            mostrarToast("Comprobante eliminado con éxito");
                          } catch (error) {
                            console.error("Error al eliminar pago:", error);
                            alert("No se pudo eliminar el pago.");
                          }
                        },
                      });
                    }}
                    className="btn btn-sm btn-ghost bg-red-50 hover:bg-red-100 text-red-600 font-bold flex items-center justify-center gap-1 py-2.5 h-auto text-xs shadow-sm"
                    title="Eliminar Pago"
                  >
                    🗑️ Eliminar
                  </button>

                  <button
                    onClick={() => {
                      setEditandoPagoId(null);
                      setReciboPagoModal(null);
                    }}
                    className="btn btn-sm bg-gray-800 hover:bg-gray-900 text-white font-bold flex items-center justify-center py-2.5 h-auto text-xs shadow-sm"
                  >
                    ✖️ Cerrar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📌 NOTIFICACIÓN FLOTANTE (TOAST) INFERIOR */}
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
    </div>
  );
}
