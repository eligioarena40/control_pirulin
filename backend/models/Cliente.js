import mongoose from 'mongoose';

const clienteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  departamento: { type: String, default: '' },
  telefono: { type: String, default: '' }, // <--- Nuevo campo para el teléfono
}, { timestamps: true });

export default mongoose.model('Cliente', clienteSchema);