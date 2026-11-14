import Cliente from '../models/Cliente.js';
import { getIo } from '../socket.js';

export const obtenerClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find().sort({ departamento: 1, nombre: 1 });
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener clientes', error: error.message });
  }
};

export const crearCliente = async (req, res) => {
  try {
    const { nombre, departamento, telefono } = req.body; // <--- Agregamos telefono aquí
    const nuevoCliente = new Cliente({ 
      nombre, 
      departamento, 
      telefono: telefono || '' // Guardará el número o vacío si no se llena
    }); 
    await nuevoCliente.save();

    const io = getIo();
    io.emit('cliente-actualizado', { accion: 'crear', cliente: nuevoCliente });

    res.status(201).json(nuevoCliente);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear cliente', error: error.message });
  }
};

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
      { new: true } // Retorna el documento ya actualizado
    );

    if (!clienteActualizado) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    // Notificamos a todos los clientes conectados mediante WebSockets
    const io = getIo();
    io.emit('cliente-actualizado', { accion: 'actualizar', cliente: clienteActualizado });

    res.json(clienteActualizado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar cliente', error: error.message });
  }
};

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