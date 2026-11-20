import Entrega from '../models/Entrega.js';
import Pago from '../models/Pago.js';
import { getIo } from '../socket.js';

// Obtener todas las entregas/deudas
export const obtenerEntregas = async (req, res) => {
  try {
    const entregas = await Entrega.find()
      .populate('cliente', 'nombre departamento telefono')
      .populate('producto', 'nombre precio imagenUrl')
      .sort({ createdAt: -1 });
    res.json(entregas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener entregas', error: error.message });
  }
};

// Registrar nueva entrega (fiado o pagado al momento)
export const crearEntrega = async (req, res) => {
  try {
    const { cliente, producto, cantidad, montoTotal, estadoPago, metodoPago, referenciaPago } = req.body;

    const nuevaEntrega = new Entrega({
      cliente,
      producto,
      cantidad,
      montoTotal,
      estadoPago: estadoPago || 'pendiente',
      metodoPago: metodoPago || 'por_definir',
      referenciaPago: referenciaPago || '',
    });

    await nuevaEntrega.save();

    const entregaCompleta = await Entrega.findById(nuevaEntrega._id)
      .populate('cliente', 'nombre departamento telefono')
      .populate('producto', 'nombre precio imagenUrl');

    const io = getIo();
    if (io) {
      io.emit('entrega-actualizada', { accion: 'crear', entrega: entregaCompleta });
    }

    res.status(201).json(entregaCompleta);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar entrega', error: error.message });
  }
};

// Actualizar entrega (con soporte para cambiar producto, cantidad y precio total)
export const actualizarEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    const { producto, cantidad, total, montoTotal } = req.body;

    const valorCalculado = total !== undefined ? total : montoTotal;

    const datosParaActualizar = {
      ...(producto && { producto }),
      ...(cantidad !== undefined && { cantidad }),
      ...(valorCalculado !== undefined && { montoTotal: valorCalculado }),
    };

    const entregaActualizada = await Entrega.findByIdAndUpdate(
      id,
      datosParaActualizar,
      { new: true }
    )
      .populate('cliente', 'nombre departamento telefono')
      .populate('producto', 'nombre precio imagenUrl');

    if (!entregaActualizada) {
      return res.status(404).json({ mensaje: 'Entrega no encontrada' });
    }

    const io = getIo();
    if (io) {
      io.emit('entrega-actualizada', { accion: 'actualizar', entrega: entregaActualizada });
    }

    res.json(entregaActualizada);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar la entrega', error: error.message });
  }
};

// Actualizar pago (soporta abonos parciales y pagos totales correctamente)
export const actualizarPagoEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    const { metodoPago, referenciaPago, montoAbonado } = req.body;

    const entregaActual = await Entrega.findById(id);
    if (!entregaActual) {
      return res.status(404).json({ mensaje: 'Entrega no encontrada' });
    }

    const comprobanteUrl = req.file ? req.file.path : entregaActual.comprobanteUrl;

    const montoNum = Number(montoAbonado) || entregaActual.montoTotal;
    let nuevoMontoTotal = entregaActual.montoTotal;
    let nuevoEstadoPago = 'pagado';

    if (montoNum < entregaActual.montoTotal) {
      nuevoMontoTotal = Number((entregaActual.montoTotal - montoNum).toFixed(2));
      nuevoEstadoPago = 'pendiente';
    } else {
      nuevoMontoTotal = entregaActual.montoTotal;
      nuevoEstadoPago = 'pagado';
    }

    const datosActualizacion = {
      estadoPago: nuevoEstadoPago,
      montoTotal: nuevoMontoTotal,
      metodoPago: metodoPago || entregaActual.metodoPago,
      referenciaPago: referenciaPago || entregaActual.referenciaPago,
      comprobanteUrl,
    };

    const entregaActualizada = await Entrega.findByIdAndUpdate(
      id,
      datosActualizacion,
      { new: true }
    )
      .populate('cliente', 'nombre departamento telefono')
      .populate('producto', 'nombre precio imagenUrl');

    const io = getIo();
    if (io) {
      io.emit('entrega-actualizada', { accion: 'actualizar', entrega: entregaActualizada });
    }

    res.json(entregaActualizada);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el pago', error: error.message });
  }
};

// Eliminar registro de entrega solo si no tiene pagos vinculados
export const eliminarEntrega = async (req, res) => {
  try {
    const { id } = req.params;

    const entrega = await Entrega.findById(id);
    if (!entrega) {
      return res.status(404).json({ mensaje: 'Entrega no encontrada' });
    }

    // 1. Verificar pagos vinculados directamente a esta entrega
    const pagosDirectos = await Pago.countDocuments({ entrega: id });

    // 2. Verificar si el cliente tiene pagos que quedarían por encima del total de ventas sin esta entrega
    let pagosExcedentes = false;
    if (entrega.cliente) {
      const entregasCliente = await Entrega.find({ cliente: entrega.cliente });
      const totalEntregasActual = entregasCliente.reduce(
        (acc, e) => acc + Number(e.montoTotal || 0),
        0
      );
      const totalEntregasSinEsta = Math.max(
        0,
        Number((totalEntregasActual - Number(entrega.montoTotal || 0)).toFixed(2))
      );

      const pagosCliente = await Pago.find({ cliente: entrega.cliente });
      const totalPagosCliente = pagosCliente.reduce(
        (acc, p) => acc + Number(p.montoAbonado || 0),
        0
      );

      if (totalPagosCliente > totalEntregasSinEsta + 0.0001) {
        pagosExcedentes = true;
      }
    }

    if (pagosDirectos > 0 || pagosExcedentes) {
      return res.status(400).json({
        mensaje:
          'No se puede eliminar la venta debido a que tiene un pago vinculado. Elimina primero el pago vinculado.',
        bloqueadoPorPago: true,
      });
    }

    await Entrega.findByIdAndDelete(id);

    const io = getIo();
    if (io) {
      io.emit('entrega-actualizada', { accion: 'eliminar', id });
    }

    res.json({ mensaje: 'Entrega eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar entrega', error: error.message });
  }
};