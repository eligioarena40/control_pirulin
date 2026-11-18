import React, { useState, useEffect } from 'react';
import { Search, DollarSign, CheckCircle2, ArrowLeft, MessageCircle, FileText } from 'lucide-react';
import api from '../services/api';

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
      const formData = new FormData();
      formData.append('cliente', clienteSeleccionado._id);
      formData.append('montoAbonado', montoAbonado);
      formData.append('montoBs', montoBs || 0);
      formData.append('metodoPago', metodoPago);
      formData.append('referenciaPago', referenciaPago || 'S/R');
      
      if (archivoComprobante) {
        formData.append('comprobante', archivoComprobante);
      }

      const res = await api.post('/api/pagos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setPagoExitoso({
        ...res.data,
        cliente: clienteSeleccionado,
        monto: Number(montoAbonado),
        montoBs: Number(montoBs || 0),
        metodo: metodoPago,
        referencia: referenciaPago || 'S/R',
        tieneCapture: !!archivoComprobante,
        comprobanteUrl: res.data.comprobanteUrl
      });

      setPaso(3);
    } catch (error) {
      console.error('Error al registrar pago:', error);
      alert('Hubo un error al registrar el pago.');
    } finally {
      setCargando(false);
    }
  };

  // --- PASO 3: TICKET DE PAGO EXITOSO ---
  if (paso === 3 && pagoExitoso) {
    return (
      <div className="p-4 sm:p-6 max-w-xl mx-auto pb-32 animate-fadeIn">
        <button
          onClick={() => setPaso(1)}
          className="btn btn-sm btn-ghost gap-2 mb-4 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl px-3 py-2"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" /> Registrar otro pago
        </button>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-center">
          <div>
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <span className="badge badge-lg font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 p-3 uppercase rounded-xl">
              ✅ PAGO REGISTRADO CON ÉXITO
            </span>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-3">Comprobante de Pago</h2>
            <p className="text-xs text-gray-400">{new Date().toLocaleString()}</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4 text-left border border-gray-100 dark:border-gray-800 space-y-3">
            <div>
              <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Personal / Cliente</p>
              <p className="font-bold text-gray-900 dark:text-white text-base">{pagoExitoso.cliente.nombre}</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">Dpto: {pagoExitoso.cliente.departamento || 'General'}</p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 grid grid-cols-3 gap-2 text-sm text-center">
              <div>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase">Método</p>
                <p className="font-bold text-gray-800 dark:text-gray-200 capitalize text-xs">{pagoExitoso.metodo.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase">Referencia</p>
                <p className="font-bold text-gray-800 dark:text-gray-200 text-xs">{pagoExitoso.referencia}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase">Monto Bs</p>
                <p className="font-bold text-amber-600 text-xs">Bs. {pagoExitoso.montoBs.toFixed(2)}</p>
              </div>
            </div>

            {pagoExitoso.comprobanteUrl && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <a
                  href={pagoExitoso.comprobanteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 w-full flex items-center justify-center gap-2 rounded-xl font-bold"
                >
                  <FileText className="w-4 h-4" /> Ver Comprobante en Cloudinary
                </a>
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-center text-base">
              <span className="font-bold text-gray-700 dark:text-gray-300">Monto Abonado</span>
              <span className="font-black text-emerald-600 text-xl">US$ {pagoExitoso.monto.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => {
              const mensaje = `📦 *COMPROBANTE DE PAGO - PIRULÍN*\n👤 Cliente: ${pagoExitoso.cliente.nombre}\n🏢 Dpto: ${pagoExitoso.cliente.departamento || 'General'}\n💳 Método: ${pagoExitoso.metodo.replace('_', ' ').toUpperCase()}\n📌 Referencia: ${pagoExitoso.referencia}\n🇻🇪 Monto Bs: Bs. ${pagoExitoso.montoBs.toFixed(2)}\n💰 Abonado: US$ ${pagoExitoso.monto.toFixed(2)}`;
              const tlf = pagoExitoso.cliente.telefono ? pagoExitoso.cliente.telefono.replace(/\D/g, '') : '';
              window.open(`https://wa.me/${tlf}?text=${encodeURIComponent(mensaje)}`, '_blank');
            }}
            className="w-full btn h-12 bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-2xl flex items-center justify-center gap-2 font-bold shadow-md"
          >
            <MessageCircle className="w-5 h-5" /> Enviar Comprobante por WhatsApp
          </button>

          <button
            onClick={() => setPaso(1)}
            className="btn btn-sm btn-ghost text-gray-500 w-full font-bold"
          >
            Registrar Nuevo Pago
          </button>
        </div>
      </div>
    );
  }

  // --- PASO 2: FORMULARIO DE REGISTRO DE PAGO ---
  if (paso === 2 && clienteSeleccionado) {
    return (
      <div className="p-4 sm:p-6 max-w-xl mx-auto pb-32 animate-fadeIn">
        <button
          onClick={() => setPaso(1)}
          className="btn btn-sm btn-ghost gap-2 mb-4 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl px-3 py-2"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" /> Cambiar cliente
        </button>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
            <span className="badge font-extrabold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 p-3 uppercase mb-2 rounded-xl">
              💳 Registrar Abono
            </span>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white capitalize mt-1">{clienteSeleccionado.nombre}</h2>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Dpto: {clienteSeleccionado.departamento || 'General'}</p>
          </div>

          <form onSubmit={registrarPago} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Monto a Abonar (US$)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 pointer-events-none" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={montoAbonado}
                  onChange={(e) => setMontoAbonado(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none font-black text-xl text-emerald-600 rounded-2xl shadow-2xs transition-all"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Método de Pago</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none text-sm font-semibold text-gray-900 dark:text-white rounded-xl shadow-2xs transition-all"
                >
                  <option value="pago_movil">Pago Móvil</option>
                  <option value="efectivo">Efectivo USD</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="zelle">Zelle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Nro. de Referencia</label>
                <input
                  type="text"
                  placeholder="Ej. 1425"
                  value={referenciaPago}
                  onChange={(e) => setReferenciaPago(e.target.value)}
                  className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none text-sm font-semibold text-gray-900 dark:text-white rounded-xl shadow-2xs transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Monto en Bolívares (Opcional - Bs)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ej. 350.00"
                value={montoBs}
                onChange={(e) => setMontoBs(e.target.value)}
                className="w-full h-14 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none font-bold text-amber-600 rounded-2xl shadow-2xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Comprobante / Capture (Opcional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setArchivoComprobante(e.target.files[0])}
                className="file-input file-input-bordered w-full bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 h-14 text-sm font-medium pt-3.5"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full btn h-12 bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-2xl flex items-center justify-center gap-2 font-extrabold text-base shadow-md mt-4"
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

      {/* Barra de búsqueda engrosada y estilizada (h-14) */}
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