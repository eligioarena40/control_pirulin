import ExcelJS from 'exceljs';

function formatearMetodo(metodo = 'pago_movil') {
  const limpio = String(metodo || 'pago_movil')
    .replace(/_/g, ' ')
    .trim()
    .toLowerCase();
  if (!limpio) return 'Pago movil';
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

function formatearFechaCorta(fecha) {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-VE');
}

function obtenerFechaLocalISO() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function formatearNumeroSinCerosInnecesarios(num) {
  const n = Number(num || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/**
 * Construye el libro Excel (.xlsx) con:
 * - Sin columna Tipo ni columna Monto_Bs
 * - Columna "Producto en Venta"
 * - Abonos en columnas posteriores al "Estado" (uno por columna hasta cancelar)
 * - Estado "Cancelado" (verde) o "Pendiente (Abono X$ resta Y$)" / "Pendiente" (rojo)
 * - Cálculo correcto de Saldo Pendiente
 * - Nombre con fecha local correcta
 */
export async function crearLibroExcelHistorial(transacciones = []) {
  const ventas = transacciones
    .filter((t) => t.tipo === 'venta')
    .map((v, idx) => ({
      ...v,
      _ordenOriginal: idx,
      montoVenta: Number(v.monto ?? v.total ?? v.montoTotal ?? 0),
      abonosAsignados: [],
      saldoRestante: Number(v.monto ?? v.total ?? v.montoTotal ?? 0),
    }))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  const pagos = transacciones
    .filter((t) => t.tipo === 'pago')
    .map((p) => ({
      ...p,
      montoPago: Number(p.monto ?? p.montoAbonado ?? 0),
    }))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  const normalizarNombre = (s) => String(s || '').trim().toLowerCase();

  for (const pago of pagos) {
    let restantePago = pago.montoPago;
    if (restantePago <= 0) continue;

    const claveCliente = pago.clienteId
      ? String(pago.clienteId)
      : `${normalizarNombre(pago.cliente)}|${normalizarNombre(pago.departamento)}`;

    const ventasCliente = ventas.filter((v) => {
      const claveVenta = v.clienteId
        ? String(v.clienteId)
        : `${normalizarNombre(v.cliente)}|${normalizarNombre(v.departamento)}`;
      return claveVenta === claveCliente && v.saldoRestante > 0.0001;
    });

    for (const venta of ventasCliente) {
      if (restantePago <= 0.0001) break;
      const aplicado = Math.min(venta.saldoRestante, restantePago);
      venta.saldoRestante = Math.max(0, Number((venta.saldoRestante - aplicado).toFixed(2)));
      restantePago = Math.max(0, Number((restantePago - aplicado).toFixed(2)));

      venta.abonosAsignados.push({
        montoAplicado: aplicado,
        restaVenta: venta.saldoRestante,
        metodoTexto: formatearMetodo(pago.metodoPago),
        montoBs: Number(pago.montoBs || 0),
        fechaTexto: formatearFechaCorta(pago.fecha),
        referencia: pago.referenciaPago || 'S/R',
      });
    }
  }

  const ventasParaMostrar = [...ventas].sort(
    (a, b) => new Date(b.fecha) - new Date(a.fecha)
  );

  const maxAbonosEnFila = Math.max(
    1,
    ...ventasParaMostrar.map((v) => v.abonosAsignados.length)
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Control Pirulín';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Historial');

  const columnasBase = [
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Nombre', key: 'nombre', width: 22 },
    { header: 'Gerencia', key: 'gerencia', width: 16 },
    { header: 'Producto en Venta', key: 'producto', width: 32 },
    { header: 'Cantidad', key: 'cantidad', width: 12 },
    { header: 'Monto_USD', key: 'montoUsd', width: 14 },
    { header: 'Estado', key: 'estado', width: 34 },
  ];

  const columnasAbonos = Array.from({ length: maxAbonosEnFila }, (_, i) => ({
    header: `Abono ${i + 1}`,
    key: `abono_${i + 1}`,
    width: 48,
  }));

  sheet.columns = [...columnasBase, ...columnasAbonos];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
  });

  const fillVerde = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFDCFCE7' },
  };
  const fontVerde = { bold: true, color: { argb: 'FF166534' } };

  const fillRojo = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFEE2E2' },
  };
  const fontRojo = { bold: true, color: { argb: 'FF991B1B' } };

  ventasParaMostrar.forEach((v) => {
    const yaCancelada =
      v.saldoRestante <= 0.0001 ||
      (v.abonosAsignados.length === 0 && String(v.estado || '').toLowerCase() === 'pagado');

    let textoEstado = 'Pendiente';
    let esCancelado = false;

    if (yaCancelada) {
      textoEstado = 'Cancelado';
      esCancelado = true;
    } else if (v.abonosAsignados.length > 0) {
      const totalAbonadoVenta = v.abonosAsignados.reduce(
        (acc, ab) => acc + ab.montoAplicado,
        0
      );
      textoEstado = `Pendiente (Abono ${formatearNumeroSinCerosInnecesarios(
        totalAbonadoVenta
      )}$ resta ${formatearNumeroSinCerosInnecesarios(v.saldoRestante)}$)`;
    }

    const rowData = {
      fecha: formatearFechaCorta(v.fecha),
      nombre: v.cliente || 'Cliente General',
      gerencia: v.departamento || 'General',
      producto: v.descripcion || '',
      cantidad: Number(v.cantidad || 1),
      montoUsd: v.montoVenta,
      estado: textoEstado,
    };

    v.abonosAsignados.forEach((ab, idx) => {
      const montoStr = formatearNumeroSinCerosInnecesarios(ab.montoAplicado);
      const bsStr = formatearNumeroSinCerosInnecesarios(ab.montoBs);
      rowData[`abono_${idx + 1}`] = `${montoStr}$, ${ab.metodoTexto}, Bs. ${bsStr}, de fecha ${ab.fechaTexto}, referencia ${ab.referencia}`;
    });

    const row = sheet.addRow(rowData);
    row.getCell('montoUsd').numFmt = '#,##0.00';

    const celdaEstado = row.getCell('estado');
    celdaEstado.fill = esCancelado ? fillVerde : fillRojo;
    celdaEstado.font = esCancelado ? fontVerde : fontRojo;
  });

  const totalVentas = ventas.reduce((acc, v) => acc + v.montoVenta, 0);
  const totalPagos = pagos.reduce((acc, p) => acc + p.montoPago, 0);
  const totalPendiente = Math.max(0, Number((totalVentas - totalPagos).toFixed(2)));

  sheet.addRow({});

  const agregarFilaResumen = (etiqueta, valor) => {
    const r = sheet.addRow({
      fecha: 'RESUMEN',
      nombre: etiqueta,
      montoUsd: Number(valor.toFixed(2)),
    });
    r.font = { bold: true };
    r.getCell('montoUsd').numFmt = '#,##0.00';
  };

  agregarFilaResumen('TOTAL VENTAS', totalVentas);
  agregarFilaResumen('TOTAL ABONOS', totalPagos);
  agregarFilaResumen('SALDO PENDIENTE', totalPendiente);

  const fechaHoy = obtenerFechaLocalISO();
  const nombreArchivo = `Historial_Pirulin_${fechaHoy}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const file = new File([blob], nombreArchivo, { type: blob.type });

  return {
    blob,
    file,
    nombreArchivo,
    totalVentas,
    totalPagos,
    totalPendiente,
  };
}

export function descargarBlob(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function compartirExcelWhatsApp({ blob, file, nombreArchivo, resumenTexto }) {
  if (navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: nombreArchivo,
        text: resumenTexto,
        files: [file],
      });
      return { compartidoDirecto: true };
    } catch (error) {
      if (error?.name === 'AbortError') {
        return { cancelado: true };
      }
    }
  }

  descargarBlob(blob, nombreArchivo);
  window.open(`https://wa.me/?text=${encodeURIComponent(resumenTexto)}`, '_blank');
  return { compartidoDirecto: false };
}

export function prepararCorreoConDescarga({
  blob,
  nombreArchivo,
  correoDestino = '',
  asunto,
  cuerpo,
}) {
  descargarBlob(blob, nombreArchivo);
  const mailto = `mailto:${encodeURIComponent(correoDestino)}?subject=${encodeURIComponent(
    asunto
  )}&body=${encodeURIComponent(cuerpo)}`;
  window.open(mailto, '_blank');
}