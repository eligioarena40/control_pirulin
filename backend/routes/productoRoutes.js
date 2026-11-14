import express from 'express';
import { obtenerProductos, crearProducto, eliminarProducto } from '../controllers/productoController.js';

const router = express.Router();

router.get('/', obtenerProductos);
router.post('/', crearProducto);
router.delete('/:id', eliminarProducto);

export default router;