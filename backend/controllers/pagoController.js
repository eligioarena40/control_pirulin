import Pago from '../models/Pago.js';
import { getIo } from '../socket.js';

// Obtener todos los pagos
export const obtenerPagos = async (req, res) => {
  try {
    const pagos = await Pago.find()
      .populate('cliente', 'nombre departamento telefono')
      .sort({ createdAt: -1 });
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener pagos', error: error.message });
  }
};

// Registrar un abono o pago independiente
export const crearPago = async (req, res) => {
  try {
    // 📌 Extraemos montoBs de req.body
    const { cliente, montoAbonado, montoBs, metodoPago, referenciaPago } = req.body;
    
    // Si se adjuntó archivo mediante multer y Cloudinary
    const comprobanteUrl = req.file ? req.file.path : '';

    const nuevoPago = new Pago({
      cliente,
      montoAbonado: Number(montoAbonado),
      montoBs: Number(montoBs) || 0, // 📌 Guardamos los Bolívares (por defecto 0 si no se envían)
      metodoPago: metodoPago || 'pago_movil',
      referenciaPago: referenciaPago || 'S/R',
      comprobanteUrl
    });

    await nuevoPago.save();

    const pagoCompleto = await Pago.findById(nuevoPago._id)
      .populate('cliente', 'nombre departamento telefono');

    // Socket.IO para sincronización en tiempo real
    const io = getIo();
    io.emit('pago-actualizado', { accion: 'crear', pago: pagoCompleto });

    res.status(201).json(pagoCompleto);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar el pago', error: error.message });
  }
};

// Actualizar un pago existente
export const actualizarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { montoAbonado, montoBs, metodoPago, referenciaPago } = req.body;

    const pagoActualizado = await Pago.findByIdAndUpdate(
      id,
      {
        ...(montoAbonado !== undefined && { montoAbonado: Number(montoAbonado) }),
        ...(montoBs !== undefined && { montoBs: Number(montoBs) }),
        ...(metodoPago !== undefined && { metodoPago }),
        ...(referenciaPago !== undefined && { referenciaPago })
      },
      { new: true }
    ).populate('cliente', 'nombre departamento telefono');

    if (!pagoActualizado) {
      return res.status(404).json({ mensaje: 'Pago no encontrado' });
    }

    // Socket.IO para sincronización en tiempo real
    const io = getIo();
    io.emit('pago-actualizado', { accion: 'actualizar', pago: pagoActualizado });

    res.json(pagoActualizado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el pago', error: error.message });
  }
};

// Eliminar un pago
export const eliminarPago = async (req, res) => {
  try {
    const { id } = req.params;
    await Pago.findByIdAndDelete(id);

    const io = getIo();
    io.emit('pago-actualizado', { accion: 'eliminar', id });

    res.json({ mensaje: 'Pago eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar el pago', error: error.message });
  }
};