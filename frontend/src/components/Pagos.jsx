import React, { useState, useEffect } from 'react';
import {
  Search,
  DollarSign,
  CheckCircle2,
  ArrowLeft,
  MessageCircle,
  FileText,
  Upload,
  X
} from 'lucide-react';
import api from '../services/api';

const obtenerFechaHoyInput = () => {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

export default function Pagos() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  // Pasos del flujo de pago
  const [paso, setPaso] = useState(1); // 1: Seleccionar cliente, 2: Formulario de pago, 3: Éxito / Comprobante
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  // Campos del formulario de pago
  const [montoAbonado, setMontoAbonado] = useState('');
  const [montoBs, setMontoBs] = useState('');
  const [metodoPago, setMetodoPago] = useState('pago_movil');
  const [referenciaPago, setReferenciaPago] = useState('');
  const [fechaPago, setFechaPago] = useState(obtenerFechaHoyInput());
  const [archivoComprobante, setArchivoComprobante] = useState(null);
  const [cargando, setCargando] = useState(false);

  // Datos del pago exitoso para el ticket final
  const [pagoExitoso, setPagoExitoso] = useState(null);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const res = await api.get('/api/clientes');
      setClientes(res.data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setPaso(2);
    setMontoAbonado('');
    setMontoBs('');
    setMetodoPago('pago_movil');
    setReferenciaPago('');
    setFechaPago(obtenerFechaHoyInput());
    setArchivoComprobante(null);
  };

  const registrarPago = async (e) => {
    e.preventDefault();
    if (!montoAbonado || isNaN(montoAbonado) || Number(montoAbonado) <= 0) {
      alert('Por favor ingresa un monto válido.');
      return;
    }

    setCargando(true);
    try {
      const fechaEnviar = fechaPago ? `${fechaPago}T12:00:00` : new Date().toISOString();
      const formData = new FormData();
      formData.append('cliente', clienteSeleccionado._id);
      formData.append('montoAbonado', montoAbonado);
      formData.append('montoBs', montoBs || 0);
      formData.append('metodoPago', metodoPago);
      formData.append('referenciaPago', referenciaPago || 'S/R');
      formData.append('fechaPago', fechaEnviar);

      if (archivoComprobante) {
        formData.append('comprobante', archivoComprobante);
      }

      const res = await api.post('/api/pagos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const fechaGuardada = res.data.fechaPago || fechaEnviar;

      setPagoExitoso({
        ...res.data,
        cliente: clienteSeleccionado,
        monto: Number(montoAbonado),
        montoBs: Number(montoBs || 0),
        metodo: metodoPago,
        referencia: referenciaPago || 'S/R',
        fechaPago: fechaGuardada,
        tieneCapture: !!archivoComprobante,
        comprobanteUrl: res.data.comprobanteUrl
      });

      // Refrescamos deudas de clientes en segundo plano
      fetchClientes();
      setPaso(3);
    } catch (error) {
      console.error('Error al registrar pago:', error);
      alert('Hubo un error al registrar el pago.');
    } finally {
      setCargando(false);
    }
  };

  const volverAlInicio = () => {
    setPagoExitoso(null);
    setPaso(1);
  };

  // --- PASO 3: TICKET DE PAGO EXITOSO ---
  if (paso === 3 && pagoExitoso) {
    const fechaFormateadaTicket = new Date(
      pagoExitoso.fechaPago || pagoExitoso.createdAt || Date.now()
    ).toLocaleDateString();

    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto pb-32 animate-fadeIn">
        <button
          onClick={volverAlInicio}
          className="inline-flex items-center gap-2 mb-4 font-bold text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl px-3 py-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" /> Registrar otro pago
        </button>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-center">
          <div>
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Comprobante de Pago</h2>
            <p className="text-xs font-medium text-gray-400 mt-1">
              Fecha del pago: {fechaFormateadaTicket}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-5 text-left border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Personal / Cliente</p>
                <p className="font-bold text-gray-900 dark:text-white text-base capitalize">{pagoExitoso.cliente.nombre}</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                  Dpto: {pagoExitoso.cliente.departamento || 'General'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Método</p>
                <p className="font-bold text-gray-800 dark:text-gray-200 capitalize text-sm">
                  {pagoExitoso.metodo.replace('_', ' ')}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3.5 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Referencia</p>
                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{pagoExitoso.referencia}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Monto Bs</p>
                <p className="font-bold text-amber-600 text-sm">Bs. {pagoExitoso.montoBs.toFixed(2)}</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Fecha del Pago</span>
                <span className="font-extrabold text-gray-800 dark:text-gray-200 text-xs">
                  {fechaFormateadaTicket}
                </span>
              </div>
            </div>

            {pagoExitoso.comprobanteUrl && (
              <div className="pt-1">
                <a
                  href={pagoExitoso.comprobanteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 bg-emerald-50/70 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-2 rounded-xl font-extrabold text-sm transition-all shadow-2xs"
                >
                  <FileText className="w-4 h-4 stroke-[2.5]" /> Ver Comprobante
                </a>
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3.5 flex justify-between items-center">
              <span className="font-bold text-gray-700 dark:text-gray-300 text-base">Monto Abonado:</span>
              <span className="font-black text-emerald-600 text-xl">US$ {pagoExitoso.monto.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => {
              const mensaje = `📦 *COMPROBANTE DE PAGO - PIRULÍN*\n👤 Cliente: ${pagoExitoso.cliente.nombre}\n🏢 Dpto: ${pagoExitoso.cliente.departamento || 'General'}\n📅 Fecha Pago: ${fechaFormateadaTicket}\n💳 Método: ${pagoExitoso.metodo.replace('_', ' ').toUpperCase()}\n📌 Referencia: ${pagoExitoso.referencia}\n🇻🇪 Monto Bs: Bs. ${pagoExitoso.montoBs.toFixed(2)}\n💰 Abonado: US$ ${pagoExitoso.monto.toFixed(2)}`;
              const tlf = pagoExitoso.cliente.telefono ? pagoExitoso.cliente.telefono.replace(/\D/g, '') : '';
              window.open(`https://wa.me/${tlf}?text=${encodeURIComponent(mensaje)}`, '_blank');
            }}
            className="w-full btn h-12 bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-2xl flex items-center justify-center gap-2 font-extrabold text-sm shadow-md"
          >
            <MessageCircle className="w-5 h-5" /> Compartir por WhatsApp
          </button>
        </div>
      </div>
    );
  }

  // --- PASO 2: FORMULARIO DE REGISTRO DE PAGO (MEJORADO) ---
  if (paso === 2 && clienteSeleccionado) {
    const deudaActual = Number(clienteSeleccionado.deudaTotal || 0);

    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto pb-32 animate-fadeIn">
        {/* Botón regresar bien alineado en una sola línea */}
        <button
          type="button"
          onClick={() => setPaso(1)}
          className="inline-flex items-center gap-2 mb-4 font-bold text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl px-3 py-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" /> Cambiar cliente
        </button>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5">
          {/* Cabecera del cliente con avatar y tarjeta de deuda */}
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center font-black text-lg">
                {clienteSeleccionado.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider bg-amber-100/80 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-md mb-0.5">
                  Registrar Abono
                </span>
                <h2 className="text-xl font-black text-gray-900 dark:text-white capitalize truncate">
                  {clienteSeleccionado.nombre}
                </h2>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Dpto: {clienteSeleccionado.departamento || 'General'}
                </p>
              </div>
            </div>

            {/* Indicador de deuda pendiente */}
            <div className="text-right shrink-0 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 px-3 py-2 rounded-2xl">
              <p className="text-[10px] font-extrabold uppercase text-red-500">Deuda</p>
              <p className="text-sm font-black text-red-600 dark:text-red-400">
                US$ {deudaActual.toFixed(2)}
              </p>
            </div>
          </div>

          <form onSubmit={registrarPago} className="space-y-4">
            {/* Monto a abonar con botón rápido "Saldar Todo" */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Monto a Abonar (US$)
                </label>
                {deudaActual > 0 && (
                  <button
                    type="button"
                    onClick={() => setMontoAbonado(deudaActual.toFixed(2))}
                    className="text-xs font-extrabold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    Saldar todo (${deudaActual.toFixed(2)})
                  </button>
                )}
              </div>

              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 pointer-events-none stroke-[2.5]" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={montoAbonado}
                  onChange={(e) => setMontoAbonado(e.target.value)}
                  className="w-full h-14 pl-11 pr-4 bg-emerald-50/30 dark:bg-gray-800 border-2 border-emerald-500/70 focus:border-emerald-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none font-black text-2xl text-emerald-600 rounded-2xl transition-all"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Método de pago y Referencia */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Método de Pago
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full h-12 px-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none text-sm font-bold text-gray-900 dark:text-white rounded-xl transition-all"
                >
                  <option value="pago_movil">Pago Móvil</option>
                  <option value="efectivo">Efectivo USD</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="zelle">Zelle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Nro. Referencia
                </label>
                <input
                  type="text"
                  placeholder="Ej. 1425"
                  value={referenciaPago}
                  onChange={(e) => setReferenciaPago(e.target.value)}
                  className="w-full h-12 px-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none text-sm font-bold text-gray-900 dark:text-white rounded-xl transition-all"
                />
              </div>
            </div>

            {/* Monto en Bolívares y Fecha del Pago */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Monto Bs <span className="text-gray-400 font-semibold">(Opc.)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-amber-600 pointer-events-none">
                    Bs.
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={montoBs}
                    onChange={(e) => setMontoBs(e.target.value)}
                    className="w-full h-12 pl-10 pr-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-amber-500 focus:bg-white dark:focus:bg-gray-900 focus:outline-none font-bold text-sm text-amber-600 rounded-xl transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Fecha del Pago
                </label>
                <input
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                  className="w-full h-12 px-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none font-bold text-xs text-gray-900 dark:text-white rounded-xl transition-all"
                  required
                />
              </div>
            </div>

            {/* Selector personalizado de Comprobante / Capture */}
            <div>
              <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                Comprobante / Capture <span className="text-gray-400 font-semibold">(Opcional)</span>
              </label>

              {!archivoComprobante ? (
                <label className="flex items-center justify-center gap-2.5 w-full h-14 px-4 bg-gray-50 dark:bg-gray-800/80 hover:bg-emerald-50/50 dark:hover:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-emerald-500 rounded-2xl cursor-pointer transition-all">
                  <Upload className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                    Subir capture o comprobante
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setArchivoComprobante(e.target.files[0] || null)}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between gap-2 w-full h-14 px-4 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-2xl">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 truncate">
                      {archivoComprobante.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setArchivoComprobante(null)}
                    className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-200/60 dark:text-emerald-300 transition-colors"
                    title="Quitar imagen"
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full btn h-13 bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-2xl flex items-center justify-center gap-2 font-extrabold text-base shadow-lg shadow-emerald-600/20 mt-2"
            >
              {cargando ? 'Registrando pago...' : 'Confirmar y Guardar Pago'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- PASO 1: SELECCIONAR CLIENTE ---
  const clientesFiltrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.departamento && c.departamento.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-32 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Módulo de Pagos y Abonos</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Selecciona un cliente para registrarle un pago independiente</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="search"
          autoComplete="off"
          placeholder="Buscar cliente por nombre o departamento..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full h-14 pl-12 pr-4 bg-white dark:bg-gray-900 shadow-sm rounded-2xl border-2 border-gray-200 dark:border-gray-800 focus:border-emerald-600 focus:outline-none text-base font-semibold text-gray-800 dark:text-white transition-all"
        />
      </div>

      <div className="space-y-3.5">
        {clientesFiltrados.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-800 p-6">
            <p className="text-gray-500 text-sm font-medium">No se encontraron clientes.</p>
          </div>
        ) : (
          clientesFiltrados.map((cliente) => (
            <div
              key={cliente._id}
              onClick={() => seleccionarCliente(cliente)}
              className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-emerald-500 cursor-pointer flex justify-between items-center transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-black text-lg shadow-inner">
                  {cliente.nombre.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg capitalize">{cliente.nombre}</h4>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Dpto: {cliente.departamento || 'General'}</p>
                  <p className="text-xs text-gray-400">{cliente.telefono || 'Sin teléfono'}</p>
                </div>
              </div>
              <button className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white border-none font-bold rounded-xl px-4 py-2.5 shadow-xs">
                Abonar Pago
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}