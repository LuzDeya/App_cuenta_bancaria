import mongoose from 'mongoose';
import Cuenta from '../models/Cuenta.js';
import Transaccion from '../models/Transaccion.js';
import { HttpError } from '../middleware/errores.js';

/* ----------------------------- Utilidades ----------------------------- */

// Valida que el monto sea un número positivo con máximo 2 decimales
function validarMonto(valor) {
  const monto = Number(valor);
  if (valor === undefined || valor === null || valor === '' || !Number.isFinite(monto) || monto <= 0) {
    throw new HttpError(400, 'El monto debe ser un número mayor a 0');
  }
  if (Math.round(monto * 100) !== monto * 100) {
    throw new HttpError(400, 'El monto admite como máximo 2 decimales');
  }
  return Math.round(monto * 100) / 100;
}

function validarNumeroCuenta(valor, campo = 'numeroCuenta') {
  if (!valor || typeof valor !== 'string' || !valor.trim()) {
    throw new HttpError(400, `El campo "${campo}" es obligatorio`);
  }
  return valor.trim();
}

async function buscarCuenta(numeroCuenta, session) {
  const cuenta = await Cuenta.findOne({ numeroCuenta }).session(session ?? null);
  if (!cuenta) throw new HttpError(404, `La cuenta ${numeroCuenta} no existe`);
  return cuenta;
}

// Respuesta estándar con la cuenta actualizada
const resumen = (c) => ({
  numeroCuenta: c.numeroCuenta,
  titular: c.titular,
  saldo: c.saldo,
  moneda: c.moneda,
});

/**
 * Ejecuta una operación dentro de una transacción de MongoDB si el servidor
 * lo permite (replica set). Si MongoDB corre como standalone (lo normal en
 * local), se ejecuta sin sesión: la seguridad la dan las actualizaciones
 * condicionales atómicas ($inc + filtro de saldo) y la compensación.
 */
async function ejecutarAtomico(operacion) {
  const session = await mongoose.startSession();
  try {
    let resultado;
    await session.withTransaction(async () => {
      resultado = await operacion(session);
    });
    return resultado;
  } catch (err) {
    const sinReplicaSet =
      err?.code === 20 || /replica set|Transaction numbers/i.test(err?.message ?? '');
    if (sinReplicaSet) return operacion(null);
    throw err;
  } finally {
    await session.endSession();
  }
}

/* ---------------------------- Controladores --------------------------- */

// GET /api/cuenta/:id  -> saldo y datos de la cuenta
export async function obtenerCuenta(req, res) {
  const cuenta = await buscarCuenta(req.params.id);
  res.json({ ok: true, cuenta: resumen(cuenta) });
}

// GET /api/cuentas  -> lista de cuentas (para elegir en el frontend)
export async function listarCuentas(req, res) {
  const cuentas = await Cuenta.find().sort({ numeroCuenta: 1 });
  res.json({ ok: true, cuentas: cuentas.map(resumen) });
}

// POST /api/cuenta/deposito  { numeroCuenta, monto }
export async function depositar(req, res) {
  const numeroCuenta = validarNumeroCuenta(req.body.numeroCuenta);
  const monto = validarMonto(req.body.monto);

  const cuenta = await ejecutarAtomico(async (session) => {
    const actualizada = await Cuenta.findOneAndUpdate(
      { numeroCuenta },
      { $inc: { saldo: monto } },
      { new: true, session }
    );
    if (!actualizada) throw new HttpError(404, `La cuenta ${numeroCuenta} no existe`);

    await Transaccion.create(
      [{ tipo: 'DEPOSITO', monto, cuentaDestino: numeroCuenta, descripcion: 'Depósito en efectivo' }],
      { session }
    );
    return actualizada;
  });

  res.status(201).json({ ok: true, mensaje: 'Depósito realizado con éxito', cuenta: resumen(cuenta) });
}

// POST /api/cuenta/retiro  { numeroCuenta, monto }
export async function retirar(req, res) {
  const numeroCuenta = validarNumeroCuenta(req.body.numeroCuenta);
  const monto = validarMonto(req.body.monto);

  const cuenta = await ejecutarAtomico(async (session) => {
    // Solo descuenta si el saldo alcanza (operación atómica: evita saldos negativos)
    const actualizada = await Cuenta.findOneAndUpdate(
      { numeroCuenta, saldo: { $gte: monto } },
      { $inc: { saldo: -monto } },
      { new: true, session }
    );
    if (!actualizada) {
      await buscarCuenta(numeroCuenta, session); // lanza 404 si no existe
      throw new HttpError(400, 'Saldo insuficiente para realizar el retiro');
    }

    await Transaccion.create(
      [{ tipo: 'RETIRO', monto, cuentaOrigen: numeroCuenta, descripcion: 'Retiro en efectivo' }],
      { session }
    );
    return actualizada;
  });

  res.status(201).json({ ok: true, mensaje: 'Retiro realizado con éxito', cuenta: resumen(cuenta) });
}

// POST /api/cuenta/transferencia  { cuentaOrigen, cuentaDestino, monto }
export async function transferir(req, res) {
  const origen = validarNumeroCuenta(req.body.cuentaOrigen, 'cuentaOrigen');
  const destino = validarNumeroCuenta(req.body.cuentaDestino, 'cuentaDestino');
  const monto = validarMonto(req.body.monto);

  if (origen === destino) {
    throw new HttpError(400, 'La cuenta destino debe ser distinta a la cuenta origen');
  }

  const cuenta = await ejecutarAtomico(async (session) => {
    // 1. Validar existencia de ambas cuentas
    await buscarCuenta(origen, session);
    await buscarCuenta(destino, session);

    // 2. Debitar origen solo si tiene fondos suficientes (atómico)
    const cuentaOrigen = await Cuenta.findOneAndUpdate(
      { numeroCuenta: origen, saldo: { $gte: monto } },
      { $inc: { saldo: -monto } },
      { new: true, session }
    );
    if (!cuentaOrigen) throw new HttpError(400, 'Saldo insuficiente para realizar la transferencia');

    // 3. Acreditar destino
    let acreditado = false;
    try {
      const cuentaDestino = await Cuenta.findOneAndUpdate(
        { numeroCuenta: destino },
        { $inc: { saldo: monto } },
        { new: true, session }
      );
      if (!cuentaDestino) throw new HttpError(404, `La cuenta ${destino} no existe`);
      acreditado = true;

      // 4. Registrar movimiento
      await Transaccion.create(
        [{ tipo: 'TRANSFERENCIA', monto, cuentaOrigen: origen, cuentaDestino: destino, descripcion: req.body.descripcion?.toString().slice(0, 100) || 'Transferencia entre cuentas' }],
        { session }
      );
    } catch (err) {
      // Sin transacción real (MongoDB standalone): revertir manualmente
      // para que ningún saldo quede a medias. Con replica set, MongoDB hace el rollback.
      if (!session) {
        await Cuenta.updateOne({ numeroCuenta: origen }, { $inc: { saldo: monto } });
        if (acreditado) {
          await Cuenta.updateOne({ numeroCuenta: destino }, { $inc: { saldo: -monto } });
        }
      }
      throw err;
    }

    return cuentaOrigen;
  });

  res.status(201).json({ ok: true, mensaje: 'Transferencia realizada con éxito', cuenta: resumen(cuenta) });
}

// GET /api/cuenta/:id/historial?limite=20
export async function historial(req, res) {
  const numeroCuenta = req.params.id;
  await buscarCuenta(numeroCuenta);

  const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 20, 1), 100);
  const movimientos = await Transaccion.find({
    $or: [{ cuentaOrigen: numeroCuenta }, { cuentaDestino: numeroCuenta }],
  })
    .sort({ fecha: -1 })
    .limit(limite);

  res.json({ ok: true, movimientos });
}
