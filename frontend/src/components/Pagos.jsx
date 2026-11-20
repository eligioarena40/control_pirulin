import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { extraerDatosComprobante } from '../utils/ocrComprobante';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileImage,
  MessageCircle,
  Search,
  UserCheck,
  X,
} from 'lucide-react';

function formatearFechaPagoLocal(fechaStr) {
  if (!fechaStr) return new Date().toLocaleDateString('es-VE');
  const limpio = String(fechaStr).split('T')[0];
  const partes = limpio.split('-');
  if (partes.length === 3) {
    const [y, m, d] = partes;
    return `${d}/${m}/${y}`;
  }
  const dObj = new Date(fechaStr);
  return Number.isNaN(dObj.getTime()) ? String(fechaStr) : dObj.toLocaleDateString('es-VE');
}

function formatearFechaRegistro(fechaStr) {
  const fecha = fechaStr ? new Date(fechaStr) : new Date();
  if (Number.isNaN(fecha.getTime())) {
    return new Date().toLocaleString('es-VE');
  }
  return fecha.toLocaleString('es-VE');
}

function obtenerFechaHoyLocalISO() {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, '0');
  const d = String(hoy.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function Pagos() {
  const [clientes, setClientes] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  const [montoAbonado, setMontoAbonado] = useState('');
  const [montoBs, setMontoBs] = useState('');
  const [tasaCambio, setTasaCambio] = useState('');
  const [metodoPago, setMetodoPago] = useState('pago_movil');
  const [referenciaPago, setReferenciaPago] = useState('');
  const [fechaPago, setFechaPago] = useState(() => obtenerFechaHoyLocalISO());

  // Comprobante adjunto y vista previa
  const [archivoComprobante, setArchivoComprobante] = useState(null);
  const [vistaPreviaComprobante, setVistaPreviaComprobante] = useState(null);

  // Cuadro de advertencia por exceso de deuda o validación
  const [alertaDeuda, setAlertaDeuda] = useState('');

  // Estado OCR
  const [procesandoOcr, setProcesandoOcr] = useState(false);
  const [estadoOcr, setEstadoOcr] = useState('');

  // Estado de envío y comprobante
  const [guardando, setGuardando] = useState(false);
  const [comprobante, setComprobante] = useState(null);
  const [toastMensaje, setToastMensaje] = useState(null);

  const mostrarToast = (mensaje) => {
    setToastMensaje(mensaje);
    setTimeout(() => {
      setToastMensaje(null);
    }, 3500);
  };

  useEffect(() => {
    return () => {
      if (vistaPreviaComprobante && vistaPreviaComprobante.startsWith('blob:')) {
        URL.revokeObjectURL(vistaPreviaComprobante);
      }
    };
  }, [vistaPreviaComprobante]);

  const leerCampoDeudaDirecta = (cliente) => {
    if (!cliente) return null;
    const candidatos = [
      cliente.deuda,
      cliente.saldoPendiente,
      cliente.deudaAcumulada,
      cliente.deudaTotal,
      cliente.totalDeuda,
      cliente.saldo,
    ];

    for (const val of candidatos) {
      if (val !== undefined && val !== null && val !== '') {
        const num = Number(val);
        if (!Number.isNaN(num)) {
          return Math.max(0, num);
        }
      }
    }
    return null;
  };

  const calcularDeudaDesdeMovimientos = (clienteId, entregas = [], pagos = []) => {
    const idStr = String(clienteId || '');
    const totalEntregas = entregas
      .filter((e) => String(e.cliente?._id || e.cliente) === idStr)
      .reduce((acc, e) => {
        if (e.saldoPendiente !== undefined && e.saldoPendiente !== null) {
          return acc + Math.max(0, Number(e.saldoPendiente));
        }
        if (e.pagado) return acc;
        return acc + Math.max(0, Number(e.total ?? e.montoTotal ?? 0));
      }, 0);

    const totalPagos = pagos
      .filter((p) => String(p.cliente?._id || p.cliente) === idStr)
      .reduce((acc, p) => acc + Math.max(0, Number(p.montoAbonado ?? p.monto ?? 0)), 0);

    return Math.max(0, Number((totalEntregas - totalPagos).toFixed(2)));
  };

  const obtenerDeudaActual = (cliente) => {
    if (!cliente) return 0;
    if (cliente.deudaCalculada !== undefined && cliente.deudaCalculada !== null) {
      return Math.max(0, Number(cliente.deudaCalculada) || 0);
    }
    const directa = leerCampoDeudaDirecta(cliente);
    return directa !== null ? directa : 0;
  };

  const cargarClientes = async () => {
    try {
      const resClientes = await api.get('/api/clientes');
      const listaBase = Array.isArray(resClientes.data)
        ? resClientes.data
        : resClientes.data?.clientes || [];

      let entregasLista = [];
      let pagosLista = [];

      const tieneDeudaNoCero = listaBase.some((c) => (leerCampoDeudaDirecta(c) ?? 0) > 0);
      if (!tieneDeudaNoCero && listaBase.length > 0) {
        try {
          const [resEntregas, resPagos] = await Promise.all([
            api.get('/api/entregas'),
            api.get('/api/pagos'),
          ]);
          entregasLista = Array.isArray(resEntregas.data) ? resEntregas.data : [];
          pagosLista = Array.isArray(resPagos.data) ? resPagos.data : [];
        } catch (errMov) {
          console.error('Error al consultar entregas/pagos para calcular deuda:', errMov);
        }
      }

      const listaEnriquecida = listaBase.map((c) => {
        const directa = leerCampoDeudaDirecta(c);
        const calculadaMov =
          entregasLista.length > 0 || pagosLista.length > 0
            ? calcularDeudaDesdeMovimientos(c._id, entregasLista, pagosLista)
            : 0;

        const deudaFinal =
          directa !== null && directa > 0
            ? directa
            : calculadaMov > 0
            ? calculadaMov
            : directa ?? 0;

        return {
          ...c,
          deudaCalculada: Math.max(0, Number(deudaFinal.toFixed(2))),
        };
      });

      setClientes(listaEnriquecida);

      if (clienteSeleccionado?._id) {
        const actualizado = listaEnriquecida.find((c) => c._id === clienteSeleccionado._id);
        if (actualizado) {
          setClienteSeleccionado(actualizado);
        }
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const clientesFiltrados = clientes.filter((c) => {
    const texto = busquedaCliente.toLowerCase().trim();
    if (!texto) return true;
    return (
      String(c.nombre || '').toLowerCase().includes(texto) ||
      String(c.departamento || '').toLowerCase().includes(texto) ||
      String(c.telefono || '').toLowerCase().includes(texto)
    );
  });

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setAlertaDeuda('');
  };

  const manejarCambioMontoUsd = (valor) => {
    setMontoAbonado(valor);
    setAlertaDeuda('');

    const numUsd = Number(valor);
    const numTasa = Number(tasaCambio);
    if (!Number.isNaN(numUsd) && numUsd > 0 && !Number.isNaN(numTasa) && numTasa > 0 && !montoBs) {
      setMontoBs((numUsd * numTasa).toFixed(2));
    }
  };

  const manejarImagenComprobante = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setArchivoComprobante(archivo);
    setVistaPreviaComprobante((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return URL.createObjectURL(archivo);
    });

    setProcesandoOcr(true);
    setEstadoOcr('Analizando comprobante bancario...');

    try {
      const datos = await extraerDatosComprobante(archivo);

      const refCandidata =
        datos?.ultimos4Ref ??
        datos?.referencia ??
        datos?.referenciaPago ??
        datos?.ultimos4 ??
        datos?.numeroReferencia ??
        datos?.nroReferencia ??
        datos?.ref ??
        datos?.comprobante ??
        '';

      let refLimpia = String(refCandidata || '').replace(/\D/g, '');
      if (refLimpia.length > 4) {
        refLimpia = refLimpia.slice(-4);
      }

      const textoOcr = String(datos?.texto || datos?.rawText || datos?.text || '');

      if (!refLimpia && textoOcr) {
        const matchRef =
          textoOcr.match(
            /(?:ref(?:erencia)?|operaci[oó]n|comprobante|nro\.?|n[°º])\s*[:#-]?\s*(\d{4,12})/i
          ) || textoOcr.match(/\b(\d{4})\b(?!\s*(?:bs|usd|\$|\/|-))/i);
        if (matchRef?.[1]) {
          refLimpia = String(matchRef[1]).replace(/\D/g, '').slice(-4);
        }
      }

      if (refLimpia) {
        setReferenciaPago(refLimpia);
      }

      if (datos?.fechaISO) {
        setFechaPago(datos.fechaISO);
      }
      if (datos?.montoBs && Number(datos.montoBs) > 0 && (!montoBs || Number(montoBs) === 0)) {
        setMontoBs(String(datos.montoBs));
      }
      if (
        datos?.montoUsd &&
        Number(datos.montoUsd) > 0 &&
        (!montoAbonado || Number(montoAbonado) === 0)
      ) {
        setMontoAbonado(String(datos.montoUsd));
      }

      setEstadoOcr(
        refLimpia
          ? `Referencia detectada: ${refLimpia}`
          : 'Datos detectados (verifica la referencia).'
      );
    } catch (error) {
      console.error('Error en OCR:', error);
      setEstadoOcr('No se pudieron leer todos los campos automáticamente.');
    } finally {
      setProcesandoOcr(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlertaDeuda('');

    if (!clienteSeleccionado?._id) {
      setAlertaDeuda('Selecciona primero un cliente o personal para registrar el pago.');
      return;
    }

    const montoUsdNum = Number(montoAbonado);
    if (Number.isNaN(montoUsdNum) || montoUsdNum <= 0) {
      setAlertaDeuda('Ingresa un monto abonado en US$ mayor a 0.00.');
      return;
    }

    const deudaActual = obtenerDeudaActual(clienteSeleccionado);

    if (montoUsdNum > deudaActual + 0.0001) {
      setAlertaDeuda(
        `El pago de la deuda debe ser el monto total de la deuda o menor a ella (Deuda actual: US$ ${deudaActual.toFixed(
          2
        )}).`
      );
      return;
    }

    setGuardando(true);
    try {
      const montoAbonadoFormateado = Number(montoUsdNum.toFixed(2));
      const montoBsFormateado = Number(montoBs || 0);
      const tasaCambioFormateada = Number(tasaCambio || 0);
      const referenciaFormateada = referenciaPago.trim() || 'S/R';

      let res;
      if (archivoComprobante) {
        const formData = new FormData();
        formData.append('cliente', clienteSeleccionado._id);
        formData.append('montoAbonado', String(montoAbonadoFormateado));
        formData.append('montoBs', String(montoBsFormateado));
        formData.append('tasaCambio', String(tasaCambioFormateada));
        formData.append('metodoPago', metodoPago);
        formData.append('referenciaPago', referenciaFormateada);
        formData.append('fechaPago', fechaPago);
        formData.append('comprobante', archivoComprobante);

        res = await api.post('/api/pagos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await api.post('/api/pagos', {
          cliente: clienteSeleccionado._id,
          montoAbonado: montoAbonadoFormateado,
          montoBs: montoBsFormateado,
          tasaCambio: tasaCambioFormateada,
          metodoPago,
          referenciaPago: referenciaFormateada,
          fechaPago,
        });
      }

      const pagoRegistrado = res.data?.pago || res.data;
      const nuevaDeuda =
        res.data?.deudaRestante !== undefined
          ? Math.max(0, Number(res.data.deudaRestante))
          : Math.max(0, Number((deudaActual - montoUsdNum).toFixed(2)));

      const urlComprobanteFinal =
        pagoRegistrado?.comprobanteUrl ||
        pagoRegistrado?.comprobante ||
        pagoRegistrado?.urlComprobante ||
        pagoRegistrado?.imagenComprobante ||
        vistaPreviaComprobante ||
        null;

      setComprobante({
        id: pagoRegistrado?._id || Date.now(),
        clienteNombre: clienteSeleccionado.nombre,
        departamento: clienteSeleccionado.departamento || 'General',
        metodoPago,
        referenciaPago: referenciaFormateada,
        montoBs: montoBsFormateado,
        montoAbonado: montoAbonadoFormateado,
        fechaPago: pagoRegistrado?.fechaPago || fechaPago,
        registradoEn: pagoRegistrado?.createdAt || new Date().toISOString(),
        urlComprobante: urlComprobanteFinal,
        deudaRestante: nuevaDeuda,
      });

      setMontoAbonado('');
      setMontoBs('');
      setReferenciaPago('');
      setEstadoOcr('');
      setArchivoComprobante(null);
      await cargarClientes();
      mostrarToast('Pago registrado correctamente.');
    } catch (error) {
      const mensajeServidor =
        error?.response?.data?.message ||
        'No se pudo registrar el pago. Verifica el monto e inténtalo de nuevo.';
      setAlertaDeuda(mensajeServidor);
    } finally {
      setGuardando(false);
    }
  };

  const compartirComprobanteWhatsApp = () => {
    if (!comprobante) return;
    const metodoEtiqueta = String(comprobante.metodoPago || 'pago_movil')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    const texto = [
      '✅ *COMPROBANTE DE PAGO - CONTROL PIRULÍN*',
      `👤 Cliente: *${comprobante.clienteNombre}* (Dpto: ${comprobante.departamento})`,
      `💳 Método: ${metodoEtiqueta}`,
      `🔢 Referencia: ${comprobante.referenciaPago}`,
      comprobante.montoBs > 0 ? `🇻🇪 Monto Bs.: Bs. ${Number(comprobante.montoBs).toFixed(2)}` : null,
      `💵 Monto Abonado: *US$ ${Number(comprobante.montoAbonado).toFixed(2)}*`,
      `📅 Fecha: ${formatearFechaPagoLocal(comprobante.fechaPago)}`,
      `💰 Deuda restante: US$ ${Number(comprobante.deudaRestante).toFixed(2)}`,
    ]
      .filter(Boolean)
      .join('\n');

    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const deudaActualSeleccionado = obtenerDeudaActual(clienteSeleccionado);

  if (comprobante) {
    return (
      <div className="p-4 sm:p-6 max-w-xl mx-auto pb-24 space-y-5">
        <button
          type="button"
          onClick={() => {
            if (vistaPreviaComprobante && vistaPreviaComprobante.startsWith('blob:')) {
              URL.revokeObjectURL(vistaPreviaComprobante);
            }
            setVistaPreviaComprobante(null);
            setArchivoComprobante(null);
            setComprobante(null);
            setAlertaDeuda('');
          }}
          className="text-sm font-extrabold text-gray-600 dark:text-gray-300 hover:text-amber-600 inline-flex items-center gap-1.5"
        >
          ← Registrar otro pago
        </button>

        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-200 dark:border-gray-800 text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              Comprobante de Pago
            </h2>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">
              Registrado: {formatearFechaRegistro(comprobante.registradoEn)}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/70 rounded-2xl p-5 text-left space-y-4 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start gap-4 border-b border-gray-200/70 dark:border-gray-700 pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase text-gray-400">Personal / Cliente</p>
                <p className="font-black text-gray-900 dark:text-white text-base">
                  {comprobante.clienteNombre}
                </p>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Dpto: {comprobante.departamento}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold uppercase text-gray-400">Método</p>
                <p className="font-extrabold text-gray-800 dark:text-gray-200 text-sm capitalize">
                  {String(comprobante.metodoPago || 'pago_movil').replace(/_/g, ' ')}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center border-b border-gray-200/70 dark:border-gray-700 pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase text-gray-400">Referencia</p>
                <p className="font-extrabold text-gray-900 dark:text-white text-sm">
                  {comprobante.referenciaPago}
                </p>
              </div>
              {comprobante.montoBs > 0 && (
                <div className="text-right">
                  <p className="text-[11px] font-bold uppercase text-gray-400">Monto Bs</p>
                  <p className="font-extrabold text-amber-600 text-sm">
                    Bs. {Number(comprobante.montoBs).toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center border-b border-gray-200/70 dark:border-gray-700 pb-3">
              <span className="text-[11px] font-bold uppercase text-gray-400">Fecha del pago</span>
              <span className="font-extrabold text-gray-800 dark:text-gray-200 text-sm">
                {formatearFechaPagoLocal(comprobante.fechaPago)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-sm font-extrabold text-gray-700 dark:text-gray-300">
                Monto Abonado:
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                US$ {Number(comprobante.montoAbonado).toFixed(2)}
              </span>
            </div>
          </div>

          {comprobante.urlComprobante && (
            <a
              href={comprobante.urlComprobante}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-extrabold rounded-2xl flex items-center justify-center gap-2.5 whitespace-nowrap transition"
            >
              <FileImage className="w-5 h-5 shrink-0" />
              <span>Ver Comprobante</span>
            </a>
          )}

          <button
            type="button"
            onClick={compartirComprobanteWhatsApp}
            className="w-full py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-2.5 whitespace-nowrap transition cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 shrink-0" />
            <span>Compartir por WhatsApp</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 pb-24">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Registrar Pago / Abono</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Selecciona el cliente, carga un comprobante si deseas autocompletar y registra su abono
        </p>
      </div>

      {/* CUADRO DE ADVERTENCIA PRINCIPAL */}
      {alertaDeuda && (
        <div
          role="alert"
          className="bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-500 text-rose-900 dark:text-rose-100 rounded-2xl p-4 shadow-lg flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-black text-sm uppercase tracking-wide text-rose-700 dark:text-rose-300">
                Advertencia: Pago no permitido
              </p>
              <p className="text-sm font-bold leading-snug">{alertaDeuda}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAlertaDeuda('')}
            className="p-1.5 rounded-xl text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition"
            aria-label="Cerrar advertencia"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-7 shadow-sm border border-gray-200 dark:border-gray-800 space-y-6"
      >
        {/* 1. SELECCIÓN DE CLIENTE */}
        <div className="space-y-3">
          <label className="block text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-300">
            1. Seleccionar Cliente / Personal
          </label>

          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              placeholder="Buscar cliente por nombre o departamento..."
              value={busquedaCliente}
              onChange={(e) => setBusquedaCliente(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-amber-600 focus:outline-none rounded-2xl text-sm font-semibold text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
            {clientesFiltrados.map((c) => {
              const deudaC = obtenerDeudaActual(c);
              const activo = clienteSeleccionado?._id === c._id;
              return (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => seleccionarCliente(c)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition flex items-center justify-between gap-3 ${
                    activo
                      ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/30'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 hover:border-gray-300'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-extrabold text-sm text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                      {activo && <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />}
                      {c.nombre}
                    </p>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                      Dpto: {c.departamento || 'General'}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-xl shrink-0 ${
                      deudaC > 0
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    US$ {deudaC.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>

          {clienteSeleccionado && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase text-amber-800 dark:text-amber-300">
                  Cliente seleccionado
                </p>
                <p className="font-black text-gray-900 dark:text-white">
                  {clienteSeleccionado.nombre} ({clienteSeleccionado.departamento || 'General'})
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                  Deuda actual
                </p>
                <p className="text-xl font-black text-rose-600 dark:text-rose-400">
                  US$ {deudaActualSeleccionado.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 2. LECTURA OCR OPCIONAL DE COMPROBANTE */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-dashed border-gray-300 dark:border-gray-700 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 flex items-center gap-2 cursor-pointer">
              <FileImage className="w-4 h-4 text-amber-600" />
              Escanear comprobante bancario (OCR opcional)
              <input
                type="file"
                accept="image/*"
                onChange={manejarImagenComprobante}
                className="hidden"
              />
            </label>
            <span className="text-xs font-semibold text-gray-500">
              {procesandoOcr ? 'Leyendo imagen...' : estadoOcr}
            </span>
          </div>
          {archivoComprobante && (
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              Comprobante adjunto: {archivoComprobante.name}
            </p>
          )}
        </div>

        {/* 3. DATOS DEL PAGO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black uppercase text-gray-600 dark:text-gray-300 mb-1.5">
              Monto Abonado (US$) *
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={montoAbonado}
                onChange={(e) => manejarCambioMontoUsd(e.target.value)}
                className="w-full h-12 pl-10 pr-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-amber-600 focus:outline-none rounded-2xl text-sm font-black text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-600 dark:text-gray-300 mb-1.5">
              Método de Pago
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full h-12 pl-10 pr-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-amber-600 focus:outline-none rounded-2xl text-sm font-bold text-gray-900 dark:text-white"
              >
                <option value="pago_movil">Pago Móvil</option>
                <option value="transferencia">Transferencia</option>
                <option value="efectivo_usd">Efectivo USD</option>
                <option value="efectivo_bs">Efectivo Bs.</option>
                <option value="zelle">Zelle</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-600 dark:text-gray-300 mb-1.5">
              Referencia Bancaria
            </label>
            <input
              type="text"
              placeholder="Ej. 3435"
              value={referenciaPago}
              onChange={(e) => setReferenciaPago(e.target.value)}
              className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-amber-600 focus:outline-none rounded-2xl text-sm font-bold text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-600 dark:text-gray-300 mb-1.5">
              Monto en Bs. (opcional)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={montoBs}
              onChange={(e) => setMontoBs(e.target.value)}
              className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-amber-600 focus:outline-none rounded-2xl text-sm font-bold text-gray-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-black uppercase text-gray-600 dark:text-gray-300 mb-1.5">
              Fecha del Pago
            </label>
            <input
              type="date"
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
              className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-amber-600 focus:outline-none rounded-2xl text-sm font-bold text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl shadow-md text-sm flex items-center justify-center transition cursor-pointer disabled:opacity-60"
        >
          {guardando ? 'Registrando pago...' : 'Registrar Pago'}
        </button>
      </form>

      {toastMensaje && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold">
          ✓ {toastMensaje}
        </div>
      )}
    </div>
  );
}