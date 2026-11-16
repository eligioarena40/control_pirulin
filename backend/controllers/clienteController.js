import Cliente from '../models/Cliente.js';
import Entrega from '../models/Entrega.js';
import Pago from '../models/Pago.js';
import { getIo } from '../socket.js';

// Obtener clientes con su deuda real calculada (Entregas - Pagos)
export const obtenerClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find().sort({ departamento: 1, nombre: 1 }).lean();
    
    // Recorremos cada cliente para calcular su deuda real de forma dinámica
    const clientesConDeuda = await Promise.all(clientes.map(async (cliente) => {
      // 1. Buscamos todas las entregas (compras) de este cliente
      const entregasCliente = await Entrega.find({ cliente: cliente._id });
      
      // 2. Buscamos todos los pagos (abonos) independientes de este cliente
      const pagosCliente = await Pago.find({ cliente: cliente._id });

      // 3. Aplicamos la lógica de cálculo
      const totalEntregas = entregasCliente.reduce((acc, curr) => acc + (curr.montoTotal || 0), 0);
      const totalPagos = pagosCliente.reduce((acc, curr) => acc + (curr.montoAbonado || 0), 0);
      const deudaReal = Math.max(0, totalEntregas - totalPagos);

      return {
        ...cliente,
        deudaTotal: deudaReal // Enviamos la deuda real calculada al frontend
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
    io.emit('cliente-actualizado', { accion: 'crear', cliente: nuevoCliente });

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
    io.emit('cliente-actualizado', { accion: 'actualizar', cliente: clienteActualizado });

    res.json(clienteActualizado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar cliente', error: error.message });
  }
};

// Eliminar un cliente del sistema
export const eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    await Cliente.findByIdAndDelete(id);

    const io = getIo();
    io.emit('cliente-actualizado', { accion: 'eliminar', id });

    res.json({ mensaje: 'Cliente eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar cliente', error: error.message });
  }
};