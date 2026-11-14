import express from 'express';
import { 
  obtenerProductos, 
  crearProducto, 
  actualizarProducto, 
  eliminarProducto 
} from '../controllers/productoController.js';
import { upload } from '../middlewares/upload.js'; // <--- Importamos multer/cloudinary

const router = express.Router();

router.get('/', obtenerProductos);
router.post('/', upload.single('imagen'), crearProducto); // <--- Agregamos upload.single('imagen')
router.put('/:id', upload.single('imagen'), actualizarProducto); // <--- Opcional para actualizar foto
router.delete('/:id', eliminarProducto);

export default router;