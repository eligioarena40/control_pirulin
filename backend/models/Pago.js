import mongoose from 'mongoose';

const pagoSchema = new mongoose.Schema({
  cliente: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Cliente', 
    required: true 
  },
  montoAbonado: { 
    type: Number, 
    required: true 
  },
  montoBs: { 
    type: Number, 
    default: 0 
  }, // 📌 Variable para llevar el control en Bolívares
  metodoPago: { 
    type: String, 
    required: true 
  },
  referenciaPago: { 
    type: String, 
    default: 'S/R' 
  },
  comprobanteUrl: { 
    type: String 
  }
}, { timestamps: true });

export default mongoose.model('Pago', pagoSchema);