import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FileText, Download, MessageCircle, Mail, Calendar, Search, X, Send } from 'lucide-react';
import { crearLibroExcelHistorial, descargarBlob } from '../utils/exportarHistorialExcel';

export default function Historial() {
  const [transacciones, setTransacciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [toastMensaje, setToastMensaje] = useState(null);

  // Estado para envío de correo con Excel adjunto
  const [modalCorreoAbierto, setModalCorreoAbierto] = useState(false);
  const [correoDestino, setCorreoDestino] = useState('');
  const [notaCorreo, setNotaCorreo] = useState('');
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);

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

      const entregas = resEntregas.data.map((e) => {
        const montoVenta = Number(e.total ?? e.montoTotal ?? 0);
        const estaPagada =
          Boolean(e.pagado) ||
          ['pagado', 'cancelado', 'completado'].includes(
            String(e.estado || '').toLowerCase()
          );
        const saldoPendienteCalculado = estaPagada
          ? 0
          : Number(e.saldoPendiente ?? montoVenta);

        return {
          id: e._id,
          clienteId: e.cliente?._id || e.cliente,
          tipo: 'venta',
          fecha: e.createdAt,
          cliente: e.cliente?.nombre || 'Cliente General',
          departamento: e.cliente?.departamento || 'General',
          descripcion: `${e.producto?.nombre || 'Producto'} (Cant: ${e.cantidad || 1})`,
          cantidad: e.cantidad || 1,
          monto: montoVenta,
          saldoPendiente: saldoPendienteCalculado,
          estado: estaPagada ? 'Pagado' : 'Pendiente',
        };
      });

      const pagos = resPagos.data.map((p) => ({
        id: p._id,
        clienteId: p.cliente?._id || p.cliente,
        tipo: 'pago',
        fecha: p.fechaPago || p.createdAt,
        cliente: p.cliente?.nombre || 'Cliente General',
        departamento: p.cliente?.departamento || 'General',
        metodoPago: p.metodoPago || 'pago_movil',
        referenciaPago: p.referenciaPago || 'S/R',
        montoBs: Number(p.montoBs || 0),
        descripcion: `Abono (${(p.metodoPago || 'pago_movil').replace('_', ' ')}) - Ref: ${p.referenciaPago || 'S/R'}`,
        monto: Number(p.montoAbonado || 0),
        estado: 'Abono',
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

  const exportarExcel = async () => {
    if (transaccionesFiltradas.length === 0) {
      mostrarToast('No hay registros para exportar.');
      return;
    }
    const { blob, nombreArchivo } = await crearLibroExcelHistorial(transaccionesFiltradas);
    descargarBlob(blob, nombreArchivo);
    mostrarToast(`Excel descargado: ${nombreArchivo}`);
  };

  const exportarPDF = () => {
    mostrarToast('Generando reporte PDF profesional...');
  };

  const enviarWhatsApp = async () => {
    if (transaccionesFiltradas.length === 0) {
      mostrarToast('No hay registros para enviar.');
      return;
    }

    const { blob, file, nombreArchivo, totalVentas, totalPagos, totalPendiente } =
      await crearLibroExcelHistorial(transaccionesFiltradas);

    const detalleCorto = transaccionesFiltradas
      .slice(0, 25)
      .map(
        (t) =>
          `• ${new Date(t.fecha).toLocaleDateString('es-VE')} | ${t.cliente} (${t.departamento}): ${
            t.tipo === 'venta' ? 'Venta' : 'Pago'
          } US$ ${Number(t.monto || 0).toFixed(2)} [${t.estado}]`
      )
      .join('\n');

    const mensaje = `📊 *REPORTE DE HISTORIAL - CONTROL PIRULÍN*\nRegistros: ${transaccionesFiltradas.length}\n🛒 Ventas: US$ ${totalVentas.toFixed(2)}\n💵 Abonos: US$ ${totalPagos.toFixed(2)}\n⏳ Pendiente: US$ ${totalPendiente.toFixed(2)}\n\n${detalleCorto}${
      transaccionesFiltradas.length > 25 ? '\n... (ver detalle completo en el Excel)' : ''
    }`;

    if (navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: nombreArchivo,
          text: mensaje,
          files: [file],
        });
        mostrarToast('Reporte Excel compartido por WhatsApp');
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }

    descargarBlob(blob, nombreArchivo);
    mostrarToast('Excel descargado. Adjúntalo en WhatsApp.');
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const confirmarEnvioCorreo = async (e) => {
    e.preventDefault();
    if (!correoDestino.trim()) {
      mostrarToast('Ingresa un correo electrónico válido.');
      return;
    }

    const { blob, file, nombreArchivo, totalVentas, totalPagos, totalPendiente } =
      await crearLibroExcelHistorial(transaccionesFiltradas);

    setEnviandoCorreo(true);
    try {
      const formData = new FormData();
      formData.append('correoDestino', correoDestino.trim());
      formData.append('asunto', `Reporte de Historial - Control Pirulín (${nombreArchivo})`);
      formData.append(
        'mensaje',
        `${notaCorreo ? `${notaCorreo}\n\n` : ''}Resumen:\n- Total Ventas: US$ ${totalVentas.toFixed(2)}\n- Total Abonos: US$ ${totalPagos.toFixed(2)}\n- Saldo Pendiente: US$ ${totalPendiente.toFixed(2)}`
      );
      formData.append('archivoExcel', file);

      await api.post('/api/reportes/enviar-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      mostrarToast(`Excel enviado por correo a ${correoDestino.trim()}`);
      setModalCorreoAbierto(false);
      setCorreoDestino('');
      setNotaCorreo('');
    } catch (error) {
      descargarBlob(blob, nombreArchivo);
      const asunto = encodeURIComponent(`Reporte de Historial - Control Pirulín`);
      const cuerpo = encodeURIComponent(
        `${notaCorreo ? `${notaCorreo}\n\n` : ''}Adjunto el archivo ${nombreArchivo} con el historial.\nTotal Ventas: US$ ${totalVentas.toFixed(2)} | Abonos: US$ ${totalPagos.toFixed(2)} | Pendiente: US$ ${totalPendiente.toFixed(2)}`
      );
      window.open(`mailto:${encodeURIComponent(correoDestino.trim())}?subject=${asunto}&body=${cuerpo}`);
      mostrarToast('Excel descargado. Se abrió tu correo para enviarlo.');
      setModalCorreoAbierto(false);
    } finally {
      setEnviandoCorreo(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-24">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Historial y Reportes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Auditoría general de ventas, entregas y pagos con filtros y exportación
          </p>
        </div>

        {/* Botones de Exportación y Compartir Estilizados */}
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button
            onClick={exportarExcel}
            className="btn btn-sm sm:btn-md bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold gap-2 rounded-2xl border-none shadow-sm whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4 stroke-[2.5] shrink-0" /> Excel
          </button>
          <button
            onClick={exportarPDF}
            className="btn btn-sm sm:btn-md bg-rose-600 hover:bg-rose-700 text-white font-extrabold gap-2 rounded-2xl border-none shadow-sm whitespace-nowrap shrink-0"
          >
            <FileText className="w-4 h-4 stroke-[2.5] shrink-0" /> PDF
          </button>
          <button
            onClick={enviarWhatsApp}
            className="btn btn-sm sm:btn-md bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold gap-2 rounded-2xl border-none shadow-sm whitespace-nowrap shrink-0"
          >
            <MessageCircle className="w-4 h-4 stroke-[2.5] shrink-0" /> WhatsApp
          </button>
          <button
            onClick={() => setModalCorreoAbierto(true)}
            className="btn btn-sm sm:btn-md bg-blue-600 hover:bg-blue-700 text-white font-extrabold gap-2 rounded-2xl border-none shadow-sm whitespace-nowrap shrink-0"
          >
            <Mail className="w-4 h-4 stroke-[2.5] shrink-0" /> Correo
          </button>
        </div>
      </div>

      {/* 📌 FILTROS DE BÚSQUEDA Y RANGO DE FECHAS */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            autoComplete="off"
            placeholder="Buscar por cliente, dpto o concepto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-amber-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none text-sm font-semibold text-gray-900 dark:text-white rounded-2xl shadow-2xs transition-all"
          />
        </div>

        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/60 px-4 py-2.5 rounded-2xl border-2 border-gray-200 dark:border-gray-700">
          <Calendar className="w-5 h-5 text-amber-600 shrink-0" />
          <span className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Desde:</span>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/60 px-4 py-2.5 rounded-2xl border-2 border-gray-200 dark:border-gray-700">
          <Calendar className="w-5 h-5 text-amber-600 shrink-0" />
          <span className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hasta:</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 focus:outline-none"
          />
        </div>
      </div>

      {/* 📌 TABLA DE TRANSACCIONES */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase text-xs font-extrabold tracking-wider border-b border-gray-200 dark:border-gray-700">
                <th className="py-4 pl-6">Fecha</th>
                <th>Tipo</th>
                <th>Cliente / Dpto</th>
                <th>Descripción</th>
                <th className="text-right">Monto</th>
                <th className="text-center pr-6">Estado</th>
              </tr>
            </thead>
            <tbody>
              {transaccionesFiltradas.length > 0 ? (
                transaccionesFiltradas.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition border-b border-gray-100 dark:border-gray-800">
                    <td className="text-xs font-semibold text-gray-500 dark:text-gray-400 py-4 pl-6">
                      {new Date(t.fecha).toLocaleDateString()}
                    </td>
                    <td>
                      <span
                        className={`badge font-extrabold text-xs px-3 py-2 rounded-xl border ${
                          t.tipo === 'venta'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
                        }`}
                      >
                        {t.tipo === 'venta' ? '🛒 Venta' : '💵 Pago'}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p className="font-extrabold text-gray-900 dark:text-white text-sm capitalize">{t.cliente}</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">Dpto: {t.departamento}</p>
                      </div>
                    </td>
                    <td className="text-sm font-medium text-gray-600 dark:text-gray-300">{t.descripcion}</td>
                    <td className="text-right font-black text-gray-900 dark:text-white text-base">
                      US$ {t.monto.toFixed(2)}
                    </td>
                    <td className="text-center pr-6">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                        t.estado === 'Abono' || t.estado === 'Pagado'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50'
                      }`}>
                        {t.estado}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-16 text-gray-400 font-medium">
                    No se encontraron transacciones en este rango de fechas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📌 MODAL PARA ENVIAR EXCEL POR CORREO */}
      {modalCorreoAbierto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" /> Enviar Historial en Excel
              </h3>
              <button
                onClick={() => setModalCorreoAbierto(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={confirmarEnvioCorreo} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">
                  Correo Destino
                </label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={correoDestino}
                  onChange={(e) => setCorreoDestino(e.target.value)}
                  className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-600 focus:outline-none rounded-xl text-sm font-semibold text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">
                  Nota adicional (opcional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Ej. Reporte de deudas y abonos de la semana..."
                  value={notaCorreo}
                  onChange={(e) => setNotaCorreo(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-600 focus:outline-none rounded-xl text-sm font-medium text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalCorreoAbierto(false)}
                  className="btn h-11 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl border-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoCorreo}
                  className="btn h-11 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl border-none gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> {enviandoCorreo ? 'Enviando...' : 'Enviar Excel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📌 NOTIFICACIÓN FLOTANTE (TOAST) */}
      {toastMensaje && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-fadeIn">
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