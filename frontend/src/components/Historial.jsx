import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FileText, Download, Share2, MessageCircle, Mail, Calendar, Search } from 'lucide-react';

export default function Historial() {
  const [transacciones, setTransacciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [toastMensaje, setToastMensaje] = useState(null);

  const mostrarToast = (mensaje) => {
    setToastMensaje(mensaje);
    setTimeout(() => {
      setToastMensaje(null);
    }, 3500);
  };

  useEffect(() => {
    cargarHistorialGlobal();
  }, []);

  const cargarHistorialGlobal = async () => {
    try {
      const [resEntregas, resPagos] = await Promise.all([
        api.get('/api/entregas'),
        api.get('/api/pagos'),
      ]);

      const entregas = resEntregas.data.map((e) => ({
        id: e._id,
        tipo: 'venta',
        fecha: e.createdAt,
        cliente: e.cliente?.nombre || 'Cliente General',
        departamento: e.cliente?.departamento || 'General',
        descripcion: `${e.producto?.nombre || 'Producto'} (Cant: ${e.cantidad || 1})`,
        monto: e.total || e.montoTotal || 0,
        estado: e.saldoPendiente > 0 ? 'Pendiente' : 'Pagado',
      }));

      const pagos = resPagos.data.map((p) => ({
        id: p._id,
        tipo: 'pago',
        fecha: p.createdAt,
        cliente: p.cliente?.nombre || 'Cliente General',
        departamento: p.cliente?.departamento || 'General',
        descripcion: `Abono (${(p.metodoPago || 'pago_movil').replace('_', ' ')}) - Ref: ${p.referenciaPago || 'S/R'}`,
        monto: p.montoAbonado || 0,
        estado: 'Completado',
      }));

      const combinado = [...entregas, ...pagos].sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );

      setTransacciones(combinado);
    } catch (error) {
      console.error('Error al cargar historial global:', error);
    }
  };

  // Filtrado por texto y rango de fechas
  const transaccionesFiltradas = transacciones.filter((t) => {
    const coincideTexto =
      t.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.departamento.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.descripcion.toLowerCase().includes(busqueda.toLowerCase());

    const fechaItem = new Date(t.fecha).toISOString().split('T')[0];
    const cumpleInicio = fechaInicio ? fechaItem >= fechaInicio : true;
    const cumpleFin = fechaFin ? fechaItem <= fechaFin : true;

    return coincideTexto && cumpleInicio && cumpleFin;
  });

  // Exportar o Simular Acciones
  const exportarExcel = () => {
    mostrarToast('Generando archivo Excel corporativo...');
    // Aquí puedes integrar tu librería de exportación si usas xlsx
  };

  const exportarPDF = () => {
    mostrarToast('Generando reporte PDF profesional...');
    // Aquí puedes integrar tu librería de exportación si usas jspdf
  };

  const enviarWhatsApp = () => {
    const resumen = transaccionesFiltradas.map(t => `• ${t.cliente} (${t.departamento}): ${t.tipo === 'venta' ? 'Venta' : 'Pago'} - US$ ${t.monto.toFixed(2)}`).join('\n');
    const mensaje = `📊 *REPORTE DE TRANSACCIONES - PIRULÍN*\n\n${resumen}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const enviarCorreo = () => {
    const asunto = encodeURIComponent('Reporte de Transacciones - Control Pirulín');
    const cuerpo = encodeURIComponent('Adjunto el reporte general de transacciones filtradas.');
    window.open(`mailto:?subject=${asunto}&body=${cuerpo}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800">Historial y Reportes</h1>
          <p className="text-sm text-gray-500">
            Auditoría general de ventas, entregas y pagos con filtros y exportación
          </p>
        </div>

        {/* Botones de Exportación y Compartir */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportarExcel}
            className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 rounded-xl border-none shadow-sm"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
          <button
            onClick={exportarPDF}
            className="btn btn-sm bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2 rounded-xl border-none shadow-sm"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button
            onClick={enviarWhatsApp}
            className="btn btn-sm bg-green-500 hover:bg-green-600 text-white font-bold gap-2 rounded-xl border-none shadow-sm"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
          <button
            onClick={enviarCorreo}
            className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 rounded-xl border-none shadow-sm"
          >
            <Mail className="w-4 h-4" /> Correo
          </button>
        </div>
      </div>

      {/* 📌 FILTROS DE BÚSQUEDA Y RANGO DE FECHAS */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por cliente, dpto o concepto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full input input-bordered bg-gray-50 rounded-2xl pl-10 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <span className="text-xs font-bold text-gray-500 uppercase">Desde:</span>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full input input-bordered input-sm bg-gray-50 rounded-xl"
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <span className="text-xs font-bold text-gray-500 uppercase">Hasta:</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full input input-bordered input-sm bg-gray-50 rounded-xl"
          />
        </div>
      </div>

      {/* 📌 TABLA DE TRANSACCIONES */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-xs">
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Cliente / Dpto</th>
                <th>Descripción</th>
                <th className="text-right">Monto</th>
                <th className="text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {transaccionesFiltradas.length > 0 ? (
                transaccionesFiltradas.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition border-b border-gray-100">
                    <td className="text-xs text-gray-500 font-medium">
                      {new Date(t.fecha).toLocaleDateString()}
                    </td>
                    <td>
                      <span
                        className={`badge font-bold text-xs uppercase ${
                          t.tipo === 'venta'
                            ? 'badge-warning bg-amber-100 text-amber-800 border-amber-200'
                            : 'badge-success bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {t.tipo === 'venta' ? 'Venta' : 'Pago'}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{t.cliente}</p>
                        <p className="text-xs text-gray-400">Dpto: {t.departamento}</p>
                      </div>
                    </td>
                    <td className="text-sm text-gray-600">{t.descripcion}</td>
                    <td className="text-right font-black text-gray-800">
                      US$ {t.monto.toFixed(2)}
                    </td>
                    <td className="text-center">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                        {t.estado}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-400 font-medium">
                    No se encontraron transacciones en este rango de fechas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📌 NOTIFICACIÓN FLOTANTE (TOAST) */}
      {toastMensaje && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex flex-col gap-1.5 min-w-[300px] border border-gray-800 relative overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  ✓
                </div>
                <span className="text-sm font-medium tracking-wide">{toastMensaje}</span>
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