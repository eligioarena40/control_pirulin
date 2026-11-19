import Producto from '../models/Producto.js';
import { eliminarImagenCloudinary } from '../utils/cloudinaryHelper.js';

// Obtener todos los productos
export const obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.find().sort({ createdAt: -1 });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener productos', error: error.message });
  }
};

// Crear producto con imagen en Cloudinary
export const crearProducto = async (req, res) => {
  try {
    const { nombre, precio, stock } = req.body;

    // Si se subió una imagen, obtenemos su URL de Cloudinary; si no, dejamos una por defecto
    const imagenUrl = req.file ? req.file.path : 'https://example.com/default.jpg';

    const nuevoProducto = new Producto({
      nombre,
      precio,
      stock,
      imagenUrl
    });

    await nuevoProducto.save();
    res.status(201).json(nuevoProducto);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear producto', error: error.message });
  }
};

// Actualizar producto (y borrar imagen anterior en Cloudinary si suben una nueva)
export const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, stock } = req.body;

    const productoActual = await Producto.findById(id);
    if (!productoActual) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    const datosActualizacion = { nombre, precio, stock };

    // Si suben una nueva imagen al editar, borramos la anterior y guardamos la nueva
    if (req.file) {
      if (productoActual.imagenUrl) {
        await eliminarImagenCloudinary(productoActual.imagenUrl);
      }
      datosActualizacion.imagenUrl = req.file.path;
    }

    const productoActualizado = await Producto.findByIdAndUpdate(
      id,
      datosActualizacion,
      { new: true }
    );

    res.json(productoActualizado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar producto', error: error.message });
  }
};

// Eliminar producto y su imagen en Cloudinary
export const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const productoEliminado = await Producto.findByIdAndDelete(id);

    if (!productoEliminado) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    if (productoEliminado.imagenUrl) {
      await eliminarImagenCloudinary(productoEliminado.imagenUrl);
    }

    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar producto', error: error.message });
  }
};