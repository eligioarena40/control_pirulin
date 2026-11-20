const mongoose = require('mongoose');

const pagoSchema = new mongoose.Schema(
  {
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
      required: [true, 'El cliente es obligatorio'],
    },
    entrega: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Entrega',
      default: null,
    },
    montoAbonado: {
      type: Number,
      required: [true, 'El monto del abono es obligatorio'],
      min: [0.01, 'El monto del abono debe ser mayor a 0'],
    },
    montoBs: {
      type: Number,
      default: 0,
    },
    tasaCambio: {
      type: Number,
      default: 0,
    },
    metodoPago: {
      type: String,
      enum: ['pago_movil', 'transferencia', 'efectivo_usd', 'efectivo_bs', 'zelle', 'otro'],
      default: 'pago_movil',
    },
    referenciaPago: {
      type: String,
      trim: true,
      default: 'S/R',
    },
    bancoOrigen: {
      type: String,
      trim: true,
      default: '',
    },
    fechaPago: {
      type: Date,
      default: Date.now,
    },
    notas: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Pago', pagoSchema);