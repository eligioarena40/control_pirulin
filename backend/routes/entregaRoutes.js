import express from 'express';
import { upload } from '../middlewares/upload.js';
import { 
  obtenerEntregas, 
  crearEntrega, 
  actualizarEntrega,
  actualizarPagoEntrega, 
  eliminarEntrega 
} from '../controllers/entregaController.js';

const router = express.Router();

router.get('/', obtenerEntregas);
router.post('/', crearEntrega);
router.put('/:id', actualizarEntrega);
router.put('/:id/pago', upload.single('comprobante'), actualizarPagoEntrega);
router.delete('/:id', eliminarEntrega);

export default router;