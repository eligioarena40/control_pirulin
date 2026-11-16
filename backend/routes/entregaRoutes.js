import express from 'express';
import { 
  obtenerEntregas, 
  crearEntrega, 
  actualizarEntrega, 
  actualizarPagoEntrega, 
  eliminarEntrega 
} from '../controllers/entregaController.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

router.get('/', obtenerEntregas);
router.post('/', crearEntrega);
router.put('/:id', actualizarEntrega);
router.put('/:id/pago', upload.single('comprobante'), actualizarPagoEntrega); // 📌 Ruta clave para los pagos con capture
router.delete('/:id', eliminarEntrega);

export default router;