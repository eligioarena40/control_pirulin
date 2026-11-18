import Entrega from '../models/Entrega.js';
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
      referenciaPago: referenciaPago || ''
    });

    await nuevaEntrega.save();
    
    // Traer la entrega con los datos poblados incluyendo el teléfono
    const entregaCompleta = await Entrega.findById(nuevaEntrega._id)
      .populate('cliente', 'nombre departamento telefono')
      .populate('producto', 'nombre precio imagenUrl');

    // ⚡ Socket.IO
    const io = getIo();
    io.emit('entrega-actualizada', { accion: 'crear', entrega: entregaCompleta });

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

    // Unificamos el valor total sin importar si el frontend mandó 'total' o 'montoTotal'
    const valorCalculado = total !== undefined ? total : montoTotal;

    const datosParaActualizar = {
      ...(producto && { producto }),
      ...(cantidad !== undefined && { cantidad }),
      ...(valorCalculado !== undefined && { montoTotal: valorCalculado })
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
    io.emit('entrega-actualizada', { accion: 'actualizar', entrega: entregaActualizada });

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

    // Si el abono es menor a la deuda actual, restamos y dejamos la entrega como pendiente con el saldo restante
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
      comprobanteUrl
    };

    const entregaActualizada = await Entrega.findByIdAndUpdate(
      id,
      datosActualizacion,
      { new: true }
    )
      .populate('cliente', 'nombre departamento telefono')
      .populate('producto', 'nombre precio imagenUrl');

    const io = getIo();
    io.emit('entrega-actualizada', { accion: 'actualizar', entrega: entregaActualizada });

    res.json(entregaActualizada);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el pago', error: error.message });
  }
};

// Eliminar registro de entrega
export const eliminarEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    await Entrega.findByIdAndDelete(id);

    // ⚡ Socket.IO
    const io = getIo();
    io.emit('entrega-actualizada', { accion: 'eliminar', id });

    res.json({ mensaje: 'Entrega eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar entrega', error: error.message });
  }
};