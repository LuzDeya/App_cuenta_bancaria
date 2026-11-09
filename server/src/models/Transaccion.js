import mongoose from 'mongoose';

const transaccionSchema = new mongoose.Schema(
  {
    tipo: { type: String, enum: ['DEPOSITO', 'RETIRO', 'TRANSFERENCIA'], required: true },
    monto: { type: Number, required: true, min: 0.01 },
    cuentaOrigen: { type: String, default: null },  // numeroCuenta (null en depósitos)
    cuentaDestino: { type: String, default: null }, // numeroCuenta (null en retiros)
    descripcion: { type: String, default: '' },
    fecha: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

transaccionSchema.index({ cuentaOrigen: 1, fecha: -1 });
transaccionSchema.index({ cuentaDestino: 1, fecha: -1 });

export default mongoose.model('Transaccion', transaccionSchema);
