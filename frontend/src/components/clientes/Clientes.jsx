import React, { useState, useEffect } from "react";
import api from "../../services/api";
import ListaClientes from "./ListaClientes";
import DetalleCliente from "./DetalleCliente";
import ModalesClientes from "./ModalesClientes";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [reciboPagoModal, setReciboPagoModal] = useState(null);
  const [entregaModal, setEntregaModal] = useState(null);
  const [clienteModal, setClienteModal] = useState(null);

  const [confirmarModal, setConfirmarModal] = useState(null);

  const [todasEntregas, setTodasEntregas] = useState([]);
  const [todosPagos, setTodosPagos] = useState([]);

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
      {!clienteSeleccionado ? (
        <ListaClientes
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          clientesFiltrados={clientesFiltrados}
          calcularDeudaCliente={calcularDeudaCliente}
          verHistorialCliente={verHistorialCliente}
          setClienteModal={setClienteModal}
          setFormEdicionCliente={setFormEdicionCliente}
          setConfirmarModal={setConfirmarModal}
          api={api}
          cargarDatosGenerales={cargarDatosGenerales}
          mostrarToast={mostrarToast}
        />
      ) : (
        <DetalleCliente
          clienteSeleccionado={clienteSeleccionado}
          setClienteSeleccionado={setClienteSeleccionado}
          setHistorial={setHistorial}
          historial={historial}
          setReciboPagoModal={setReciboPagoModal}
          setEntregaModal={setEntregaModal}
          setEditandoEntregaId={setEditandoEntregaId}
          setFormEdicionEntrega={setFormEdicionEntrega}
          setConfirmarModal={setConfirmarModal}
          api={api}
          todasEntregas={todasEntregas}
          todosPagos={todosPagos}
          verHistorialCliente={verHistorialCliente}
          mostrarToast={mostrarToast}
        />
      )}

      {/* Renderizado de todos los modales y toasts auxiliares */}
      <ModalesClientes
        confirmarModal={confirmarModal}
        setConfirmarModal={setConfirmarModal}
        clienteModal={clienteModal}
        setClienteModal={setClienteModal}
        formEdicionCliente={formEdicionCliente}
        setFormEdicionCliente={setFormEdicionCliente}
        api={api}
        cargarDatosGenerales={cargarDatosGenerales}
        mostrarToast={mostrarToast}
        entregaModal={entregaModal}
        setEntregaModal={setEntregaModal}
        setEditandoEntregaId={setEditandoEntregaId}
        formEdicionEntrega={formEdicionEntrega}
        setFormEdicionEntrega={setFormEdicionEntrega}
        clientes={clientes}
        clienteSeleccionado={clienteSeleccionado}
        setClienteSeleccionado={setClienteSeleccionado}
        verHistorialCliente={verHistorialCliente}
        reciboPagoModal={reciboPagoModal}
        setReciboPagoModal={setReciboPagoModal}
        editandoPagoId={editandoPagoId}
        setEditandoPagoId={setEditandoPagoId}
        formEdicion={formEdicion}
        setFormEdicion={setFormEdicion}
        toastMensaje={toastMensaje}
        setToastMensaje={setToastMensaje}
      />
    </div>
  );
}