import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  precio: { type: Number, required: true }, // Lo manejaremos como número para calcular deudas
  imagenUrl: { type: String, default: '' } // Aquí guardaremos la ruta de la foto que pediste
}, { timestamps: true });

export default mongoose.model('Producto', productoSchema);