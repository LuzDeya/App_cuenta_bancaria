// Script seed: limpia la BD y crea cuentas + movimientos de prueba
// Uso: npm run seed
import 'dotenv/config';
import mongoose from 'mongoose';
import Cuenta from '../src/models/Cuenta.js';
import Transaccion from '../src/models/Transaccion.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/banco_db';

const cuentas = [
  { numeroCuenta: '1001', titular: 'Hermiluz Reinaga', saldo: 2500 },
  { numeroCuenta: '1002', titular: 'Carlos Quispe', saldo: 1200.5 },
  { numeroCuenta: '1003', titular: 'María Huamán', saldo: 800 },
  { numeroCuenta: '1004', titular: 'José Rojas', saldo: 50 },
  { numeroCuenta: '1005', titular: 'Ana Torres', saldo: 0 },
];

const haceDias = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

const movimientos = [
  { tipo: 'DEPOSITO', monto: 3000, cuentaDestino: '1001', descripcion: 'Depósito inicial', fecha: haceDias(10) },
  { tipo: 'RETIRO', monto: 300, cuentaOrigen: '1001', descripcion: 'Retiro en efectivo', fecha: haceDias(7) },
  { tipo: 'TRANSFERENCIA', monto: 200, cuentaOrigen: '1001', cuentaDestino: '1002', descripcion: 'Pago de almuerzo', fecha: haceDias(3) },
  { tipo: 'DEPOSITO', monto: 1000.5, cuentaDestino: '1002', descripcion: 'Depósito inicial', fecha: haceDias(9) },
  { tipo: 'DEPOSITO', monto: 800, cuentaDestino: '1003', descripcion: 'Depósito inicial', fecha: haceDias(8) },
  { tipo: 'DEPOSITO', monto: 50, cuentaDestino: '1004', descripcion: 'Depósito inicial', fecha: haceDias(5) },
];

async function main() {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log(`Conectado a ${MONGO_URI}`);

  await Promise.all([Cuenta.deleteMany({}), Transaccion.deleteMany({})]);
  await Cuenta.syncIndexes();
  await Cuenta.insertMany(cuentas);
  await Transaccion.insertMany(movimientos);

  console.log(`✅ ${cuentas.length} cuentas y ${movimientos.length} movimientos de prueba creados:`);
  console.table(cuentas.map(({ numeroCuenta, titular, saldo }) => ({ numeroCuenta, titular, saldo })));
}

main()
  .catch((err) => {
    console.error('❌ Error en el seed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
