import React, { useState, useEffect } from 'react';
import { Search, DollarSign, CheckCircle2, Upload, ArrowLeft, MessageCircle, FileText } from 'lucide-react';
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
      const res = await api.get('/clientes');
      setClientes(res.data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setPaso(2);
    // Limpiar campos anteriores
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

      const res = await api.post('/pagos', formData, {
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
      <div className="p-6 max-w-xl mx-auto pb-32">
        <button
          onClick={() => setPaso(1)}
          className="btn btn-sm btn-ghost mb-4 flex items-center gap-1 text-gray-600"
        >
          <ArrowLeft className="w-4 h-4" /> Registrar otro pago
        </button>

        <div className="bg-white border border-gray-200 rounded-3xl shadow-xl p-8 space-y-6 text-center">
          <div>
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <span className="badge badge-lg font-bold bg-emerald-100 text-emerald-700 p-3 uppercase">
              ✅ PAGO REGISTRADO CON ÉXITO
            </span>
            <h2 className="text-2xl font-black text-gray-800 mt-3">Comprobante de Pago</h2>
            <p className="text-xs text-gray-400">{new Date().toLocaleString()}</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 text-left border border-gray-100 space-y-3">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Personal / Cliente</p>
              <p className="font-bold text-gray-800">{pagoExitoso.cliente.nombre}</p>
              <p className="text-xs text-amber-700 font-semibold">Dpto: {pagoExitoso.cliente.departamento || 'General'}</p>
            </div>

            <div className="border-t border-gray-200 pt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Método</p>
                <p className="font-bold text-gray-800 capitalize">{pagoExitoso.metodo.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Referencia</p>
                <p className="font-bold text-gray-800">{pagoExitoso.referencia}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Monto Bs</p>
                <p className="font-bold text-amber-700">Bs. {pagoExitoso.montoBs.toFixed(2)}</p>
              </div>
            </div>

            {pagoExitoso.comprobanteUrl && (
              <div className="border-t border-gray-200 pt-3">
                <a
                  href={pagoExitoso.comprobanteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 w-full flex items-center justify-center gap-2 shadow-sm"
                >
                  📄 Ver Comprobante / Capture en Cloudinary
                </a>
              </div>
            )}

            <div className="border-t border-gray-200 pt-3 flex justify-between items-center text-lg">
              <span className="font-bold text-gray-700">Monto Abonado</span>
              <span className="font-extrabold text-emerald-600">US$ {pagoExitoso.monto.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => {
              const mensaje = `📦 *COMPROBANTE DE PAGO - PIRULÍN*\n👤 Cliente: ${pagoExitoso.cliente.nombre}\n🏢 Dpto: ${pagoExitoso.cliente.departamento || 'General'}\n💳 Método: ${pagoExitoso.metodo.replace('_', ' ').toUpperCase()}\n📌 Referencia: ${pagoExitoso.referencia}\n🇻🇪 Monto Bs: Bs. ${pagoExitoso.montoBs.toFixed(2)}\n💰 Abonado: US$ ${pagoExitoso.monto.toFixed(2)}`;
              const tlf = pagoExitoso.cliente.telefono ? pagoExitoso.cliente.telefono.replace(/\D/g, '') : '';
              window.open(`https://wa.me/${tlf}?text=${encodeURIComponent(mensaje)}`, '_blank');
            }}
            className="w-full btn bg-emerald-600 hover:bg-emerald-700 text-white border-none py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" /> Enviar Comprobante por WhatsApp
          </button>

          <button
            onClick={() => setPaso(1)}
            className="btn btn-sm btn-ghost text-gray-500 w-full"
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
      <div className="p-6 max-w-xl mx-auto pb-32">
        <button
          onClick={() => setPaso(1)}
          className="btn btn-sm btn-ghost mb-4 flex items-center gap-1 text-gray-600"
        >
          <ArrowLeft className="w-4 h-4" /> Cambiar cliente
        </button>

        <div className="bg-white border border-gray-200 rounded-3xl shadow-xl p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-black text-gray-800">Registrar Abono / Pago</h2>
            <p className="text-sm font-semibold text-amber-700 mt-1">Cliente: {clienteSeleccionado.nombre}</p>
            <p className="text-xs text-gray-500">Dpto: {clienteSeleccionado.departamento || 'General'}</p>
          </div>

          <form onSubmit={registrarPago} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Monto a Abonar (US$)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={montoAbonado}
                  onChange={(e) => setMontoAbonado(e.target.value)}
                  className="input input-bordered w-full pl-10 bg-gray-50 font-bold text-lg text-emerald-600"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Método de Pago</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="select select-bordered w-full bg-gray-50 text-sm"
                >
                  <option value="pago_movil">Pago Móvil</option>
                  <option value="efectivo">Efectivo USD</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="zelle">Zelle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nro. de Referencia</label>
                <input
                  type="text"
                  placeholder="Ej. 1425"
                  value={referenciaPago}
                  onChange={(e) => setReferenciaPago(e.target.value)}
                  className="input input-bordered w-full bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Monto en Bolívares (Opcional - Bs)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ej. 350.00"
                value={montoBs}
                onChange={(e) => setMontoBs(e.target.value)}
                className="input input-bordered w-full bg-gray-50 font-bold text-amber-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Comprobante / Capture (Opcional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setArchivoComprobante(e.target.files[0])}
                className="file-input file-input-bordered file-input-sm w-full bg-gray-50"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full btn bg-emerald-600 hover:bg-emerald-700 text-white border-none py-3 rounded-xl flex items-center justify-center gap-2 mt-4"
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
    <div className="p-6 max-w-4xl mx-auto pb-32">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Módulo de Pagos y Abonos</h2>
        <p className="text-sm text-gray-500">Selecciona un cliente para registrarle un pago independiente</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar cliente por nombre o departamento..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input input-bordered w-full pl-10 bg-white shadow-sm"
        />
      </div>

      <div className="space-y-3">
        {clientesFiltrados.length === 0 ? (
          <p className="text-gray-500 text-center py-8 bg-white rounded-2xl border border-gray-200">No se encontraron clientes.</p>
        ) : (
          clientesFiltrados.map((cliente) => (
            <div
              key={cliente._id}
              onClick={() => seleccionarCliente(cliente)}
              className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:border-emerald-400 cursor-pointer flex justify-between items-center transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  {cliente.nombre.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">{cliente.nombre}</h4>
                  <p className="text-xs font-semibold text-amber-700">Dpto: {cliente.departamento || 'General'}</p>
                  <p className="text-xs text-gray-500">{cliente.telefono || 'Sin teléfono'}</p>
                </div>
              </div>
              <button className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white border-none">
                Abonar Pago
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}