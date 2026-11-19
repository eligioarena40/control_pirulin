import Tesseract from 'tesseract.js';

function corregirCaracteresNumericos(texto) {
  return texto
    .replace(/[oO]/g, '0')
    .replace(/[lI|]/g, '1')
    .replace(/[sS]/g, '5');
}

function limpiarNumeroDecimal(raw) {
  if (!raw) return '';
  let str = corregirCaracteresNumericos(raw).replace(/\s+/g, '');

  // Quitar caracteres no numéricos excepto punto y coma
  str = str.replace(/[^\d.,]/g, '');
  if (!str) return '';

  // Si tiene coma y punto: el último separador suele ser el decimal
  if (str.includes(',') && str.includes('.')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    const partesComa = str.split(',');
    // Si después de la coma hay exactamente 2 dígitos, es decimal (ej. 1250,50)
    if (partesComa.length === 2 && partesComa[1].length === 2) {
      str = partesComa[0].replace(/\./g, '') + '.' + partesComa[1];
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes('.')) {
    const partesPunto = str.split('.');
    // Si hay más de un punto (ej. 1.250.000) o el último grupo no tiene 2 decimales, son miles
    if (partesPunto.length > 2 || partesPunto[1].length !== 2) {
      str = str.replace(/\./g, '');
    }
  }

  const num = Number(str);
  if (Number.isNaN(num) || num <= 0) return '';
  return num.toFixed(2);
}

function pareceTelefonoOFecHaODni(candidatoCrudo, lineaCompleta) {
  const limpio = candidatoCrudo.replace(/\D/g, '');
  // Evitar números de teléfono venezolanos típicos (10-11 dígitos iniciando en 04xx o 4xx)
  if (/^(0?4\d{9})$/.test(limpio)) return true;
  // Evitar fechas pegadas como 08112026
  if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(candidatoCrudo.trim())) return true;
  // Evitar cédulas/RIF si la línea habla de CI/RIF/V-/J-/E-
  if (/\b(?:ci|c\.i|rif|v-|j-|e-|cedula)\b/i.test(lineaCompleta) && !/\b(?:monto|bs|bolivares|importe|total)\b/i.test(lineaCompleta)) {
    return true;
  }
  return false;
}

/**
 * Extrae los últimos 4 dígitos de la referencia/operación, fecha y monto
 * desde una imagen de comprobante de pago móvil de distintos bancos.
 */
export async function extraerDatosComprobante(archivo) {
  if (!archivo || !archivo.type.startsWith('image/')) {
    return { ultimos4Ref: '', fechaISO: '', montoBs: '', montoUsd: '', textoCrudo: '' };
  }

  const { data } = await Tesseract.recognize(archivo, 'spa');
  const texto = data.text || '';

  const textoLimpio = texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\r/g, '\n');

  // 1. Últimos 4 dígitos de referencia / operación / secuencia / autorización
  const regexEtiquetas = [
    /(?:nro\.?\s*de\s*operacion|operacion|ref\.?|referencia|comprobante|secuencia|autorizacion|trace|id\s*transaccion)\s*[:.#\-no]*\s*\n?\s*(\d{6,12})/gi,
  ];

  let candidatoRef = '';
  for (const regex of regexEtiquetas) {
    let match;
    while ((match = regex.exec(textoLimpio)) !== null) {
      if (match[1]) {
        candidatoRef = match[1];
        break;
      }
    }
    if (candidatoRef) break;
  }

  if (!candidatoRef) {
    const fallback = textoLimpio.match(/\b\d{6,12}\b/);
    if (fallback) {
      candidatoRef = fallback[0];
    }
  }

  const ultimos4Ref = candidatoRef ? candidatoRef.slice(-4) : '';

  // 2. Fecha (DD/MM/YYYY o DD-MM-YYYY)
  let fechaISO = '';
  const matchFecha = textoLimpio.match(/\b(\d{2})[/-](\d{2})[/-](\d{4})\b/);
  if (matchFecha) {
    const [, dia, mes, anio] = matchFecha;
    const diaNum = Number(dia);
    const mesNum = Number(mes);
    if (mesNum >= 1 && mesNum <= 12 && diaNum >= 1 && diaNum <= 31) {
      fechaISO = `${anio}-${mes}-${dia}`;
    }
  }

  // 3. Monto en Bolívares (cubre múltiples bancos, etiquetas y formatos)
  let montoBs = '';
  const lineas = textoLimpio.split('\n');

  const patronesBs = [
    // Etiqueta de monto seguida de Bs / VES o número directo (ej. "Monto: Bs. 1.250,00", "Importe: 450,00")
    /(?:monto\s*(?:en\s*)?(?:bs\.?|bss\.?|bolivares|ves)?|importe|total\s*(?:a\s*pagar)?)\s*[:.\-=]*\s*\n?\s*(?:bs\.?|bss\.?|ves)?\s*([\d.,\s]{1,18})/gi,
    // Moneda antes del número (ej. "Bs. 1.250,00", "Bs1250,00", "VES 890.50")
    /(?:^|[\s:(])(?:bs\.?|bss\.?|bolivares|ves)\s*[:.\-=]*\s*\n?\s*([\d.,\s]{1,18})/gim,
    // Número seguido de moneda (ej. "1.250,00 Bs.", "450,00 VES")
    /([\d.,\s]{1,18})\s*(?:bs\.?|bss\.?|bolivares|ves)(?=$|[\s.,;)])/gim,
  ];

  for (const patron of patronesBs) {
    let match;
    while ((match = patron.exec(textoLimpio)) !== null) {
      const crudo = match[1] || '';
      const indiceMatch = match.index;
      const lineaAsociada =
        lineas.find((l) => textoLimpio.indexOf(l) !== -1 && textoLimpio.includes(crudo.trim())) ||
        match[0];

      if (pareceTelefonoOFecHaODni(crudo, lineaAsociada)) {
        continue;
      }

      // Evitar capturar solo 1 o 2 dígitos sueltos sin decimales si no es un monto válido
      const soloDigitos = crudo.replace(/\D/g, '');
      if (soloDigitos.length < 2) {
        continue;
      }

      const convertido = limpiarNumeroDecimal(crudo);
      if (convertido && Number(convertido) >= 1) {
        montoBs = convertido;
        break;
      }
    }
    if (montoBs) break;
  }

  // Respaldo adicional: buscar un número con formato decimal claro (ej. 1.250,00 o 450.50) en líneas con palabras clave de pago
  if (!montoBs) {
    for (const linea of lineas) {
      if (/(?:monto|importe|total|bs|pago|operacion|transferencia)/i.test(linea)) {
        const numDecimal = linea.match(/\b\d{1,3}(?:[.\s]?\d{3})*(?:,\d{2}|\.\d{2})\b/);
        if (numDecimal && !pareceTelefonoOFecHaODni(numDecimal[0], linea)) {
          const convertido = limpiarNumeroDecimal(numDecimal[0]);
          if (convertido) {
            montoBs = convertido;
            break;
          }
        }
      }
    }
  }

  // 4. Monto en USD si el comprobante indica US$ o $
  let montoUsd = '';
  const matchUsd = textoLimpio.match(/(?:us\$|usd|\$)\s*[:.]?\s*\n?\s*([\d.,]+)/i);
  if (matchUsd && matchUsd[1] && !pareceTelefonoOFecHaODni(matchUsd[1], matchUsd[0])) {
    montoUsd = limpiarNumeroDecimal(matchUsd[1]);
  }

  return {
    ultimos4Ref,
    fechaISO,
    montoBs,
    montoUsd,
    textoCrudo: texto,
  };
}