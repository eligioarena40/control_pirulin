import Pago from '../models/Pago.js';
import { getIo } from '../socket.js';
import { eliminarImagenCloudinary } from '../utils/cloudinaryHelper.js';

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
    const { cliente, montoAbonado, montoBs, metodoPago, referenciaPago, fechaPago } = req.body;
    const comprobanteUrl = req.file ? req.file.path : '';

    const nuevoPago = new Pago({
      cliente,
      montoAbonado: Number(montoAbonado),
      montoBs: Number(montoBs) || 0,
      metodoPago: metodoPago || 'pago_movil',
      referenciaPago: referenciaPago || 'S/R',
      fechaPago: fechaPago ? new Date(fechaPago) : new Date(),
      comprobanteUrl,
    });

    await nuevoPago.save();

    const pagoCompleto = await Pago.findById(nuevoPago._id)
      .populate('cliente', 'nombre departamento telefono');

    const io = getIo();
    if (io) {
      io.emit('pago-actualizado', { accion: 'crear', pago: pagoCompleto });
    }

    res.status(201).json(pagoCompleto);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar el pago', error: error.message });
  }
};

// Actualizar un pago existente (incluye fechaPago y reemplazo de comprobante)
export const actualizarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { montoAbonado, montoBs, metodoPago, referenciaPago, fechaPago } = req.body;

    const pagoActual = await Pago.findById(id);
    if (!pagoActual) {
      return res.status(404).json({ mensaje: 'Pago no encontrado' });
    }

    const datosActualizacion = {
      ...(montoAbonado !== undefined && { montoAbonado: Number(montoAbonado) }),
      ...(montoBs !== undefined && { montoBs: Number(montoBs) }),
      ...(metodoPago !== undefined && { metodoPago }),
      ...(referenciaPago !== undefined && { referenciaPago }),
      ...(fechaPago !== undefined && { fechaPago: new Date(fechaPago) }),
    };

    if (req.file) {
      if (pagoActual.comprobanteUrl) {
        await eliminarImagenCloudinary(pagoActual.comprobanteUrl);
      }
      datosActualizacion.comprobanteUrl = req.file.path;
    }

    const pagoActualizado = await Pago.findByIdAndUpdate(
      id,
      datosActualizacion,
      { new: true }
    ).populate('cliente', 'nombre departamento telefono');

    const io = getIo();
    if (io) {
      io.emit('pago-actualizado', { accion: 'actualizar', pago: pagoActualizado });
    }

    res.json(pagoActualizado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el pago', error: error.message });
  }
};

// Eliminar un pago y su comprobante en Cloudinary
export const eliminarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const pagoEliminado = await Pago.findByIdAndDelete(id);

    if (!pagoEliminado) {
      return res.status(404).json({ mensaje: 'Pago no encontrado' });
    }

    if (pagoEliminado.comprobanteUrl) {
      await eliminarImagenCloudinary(pagoEliminado.comprobanteUrl);
    }

    const io = getIo();
    if (io) {
      io.emit('pago-actualizado', { accion: 'eliminar', id });
    }

    res.json({ mensaje: 'Pago eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar el pago', error: error.message });
  }
};