import express from 'express';
import { obtenerPagos, crearPago, eliminarPago, actualizarPago } from '../controllers/pagoController.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

router.get('/', obtenerPagos);
router.post('/', upload.single('comprobante'), crearPago);
router.delete('/:id', eliminarPago);
router.put('/:id', upload.single('comprobante'), actualizarPago);

export default router;