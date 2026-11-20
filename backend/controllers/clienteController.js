import { createRequire } from 'module';
import Cliente from '../models/Cliente.js';
import Entrega from '../models/Entrega.js';
import { getIo } from '../socket.js';
import { eliminarImagenCloudinary } from '../utils/cloudinaryHelper.js';

const require = createRequire(import.meta.url);
const Pago = require('../models/Pago.js');

// Obtener clientes con su deuda real calculada (Entregas - Pagos)
export const obtenerClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find().sort({ departamento: 1, nombre: 1 }).lean();

    const clientesConDeuda = await Promise.all(clientes.map(async (cliente) => {
      const entregasCliente = await Entrega.find({ cliente: cliente._id });
      const pagosCliente = await Pago.find({ cliente: cliente._id });

      const totalEntregas = entregasCliente.reduce((acc, curr) => acc + (curr.montoTotal || 0), 0);
      const totalPagos = pagosCliente.reduce((acc, curr) => acc + (curr.montoAbonado || 0), 0);
      const deudaReal = Math.max(0, totalEntregas - totalPagos);

      return {
        ...cliente,
        deudaTotal: deudaReal
      };
    }));

    res.json(clientesConDeuda);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener clientes', error: error.message });
  }
};

// Crear un nuevo cliente
export const crearCliente = async (req, res) => {
  try {
    const { nombre, departamento, telefono } = req.body;

    const nuevoCliente = new Cliente({
      nombre,
      departamento,
      telefono: telefono || ''
    });

    await nuevoCliente.save();

    const io = getIo();
    if (io) {
      io.emit('cliente-actualizado', { accion: 'crear', cliente: nuevoCliente });
    }

    res.status(201).json(nuevoCliente);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear cliente', error: error.message });
  }
};

// Actualizar los datos de un cliente
export const actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, departamento, telefono } = req.body;

    const clienteActualizado = await Cliente.findByIdAndUpdate(
      id,
      {
        nombre,
        departamento,
        telefono: telefono || ''
      },
      { new: true }
    );

    if (!clienteActualizado) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    const io = getIo();
    if (io) {
      io.emit('cliente-actualizado', { accion: 'actualizar', cliente: clienteActualizado });
    }

    res.json(clienteActualizado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar cliente', error: error.message });
  }
};

// Eliminar un cliente, limpiar entregas y pagos en cascada, y borrar comprobantes en Cloudinary
export const eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const clienteEncontrado = await Cliente.findById(id);
    if (!clienteEncontrado) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    // 1. Buscamos los pagos del cliente para borrar sus comprobantes en Cloudinary
    const pagosCliente = await Pago.find({ cliente: id }).lean();
    for (const pago of pagosCliente) {
      if (pago.comprobanteUrl) {
        await eliminarImagenCloudinary(pago.comprobanteUrl);
      }
    }

    // 2. Eliminamos entregas y pagos asociados en MongoDB
    await Entrega.deleteMany({ cliente: id });
    await Pago.deleteMany({ cliente: id });

    // 3. Eliminamos al cliente
    await Cliente.findByIdAndDelete(id);

    const io = getIo();
    if (io) {
      io.emit('cliente-actualizado', { accion: 'eliminar', id });
    }

    res.json({ mensaje: 'Cliente y todos sus registros asociados eliminados correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar cliente', error: error.message });
  }
};