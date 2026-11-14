import mongoose from 'mongoose';

const entregaSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
  cantidad: { type: Number, required: true, default: 1 },
  montoTotal: { type: Number, required: true }, // Se guarda el precio histórico por si luego cambias el precio del Pirulin
  estadoPago: { type: String, enum: ['pendiente', 'pagado'], default: 'pendiente' },
  metodoPago: { type: String, enum: ['efectivo', 'pago_movil', 'por_definir'], default: 'por_definir' },
  referenciaPago: { type: String, default: '' }, // Para anotar los últimos dígitos del capture
  comprobanteUrl: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Entrega', entregaSchema);