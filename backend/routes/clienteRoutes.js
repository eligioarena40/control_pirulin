import express from 'express';
import { obtenerClientes, crearCliente, eliminarCliente } from '../controllers/clienteController.js';

const router = express.Router();

router.get('/', obtenerClientes);
router.post('/', crearCliente);
router.delete('/:id', eliminarCliente);

export default router;