import express from 'express';
import { 
  obtenerClientes, 
  crearCliente, 
  actualizarCliente, // <--- Asegúrate de importarla
  eliminarCliente 
} from '../controllers/clienteController.js';

const router = express.Router();

router.get('/', obtenerClientes);
router.post('/', crearCliente);
router.put('/:id', actualizarCliente); // <--- Esta es la ruta para actualizar
router.delete('/:id', eliminarCliente);

export default router;