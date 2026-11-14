import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true }); // timestamps crea automáticamente fecha de creación y actualización

export default mongoose.model('Usuario', usuarioSchema);