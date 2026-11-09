import mongoose from 'mongoose';

const cuentaSchema = new mongoose.Schema(
  {
    numeroCuenta: { type: String, required: true, unique: true, trim: true },
    titular: { type: String, required: true, trim: true },
    saldo: { type: Number, required: true, default: 0, min: [0, 'El saldo no puede ser negativo'] },
    moneda: { type: String, default: 'PEN' },
  },
  { timestamps: true }
);

export default mongoose.model('Cuenta', cuentaSchema);
