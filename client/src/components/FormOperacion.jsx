import { useState } from 'react';
import { formatoMoneda } from '../services/api';

const PESTANAS = [
  { id: 'deposito', label: 'Depósito', boton: 'Depositar', color: 'bg-emerald-600 hover:bg-emerald-700' },
  { id: 'retiro', label: 'Retiro', boton: 'Retirar', color: 'bg-amber-600 hover:bg-amber-700' },
  { id: 'transferencia', label: 'Transferencia', boton: 'Transferir', color: 'bg-teal-600 hover:bg-teal-700' },
];

export default function FormOperacion({ cuenta, cuentas, procesando, onOperar }) {
  const [tipo, setTipo] = useState('deposito');
  const [monto, setMonto] = useState('');
  const [destino, setDestino] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [errorLocal, setErrorLocal] = useState('');

  const pestana = PESTANAS.find((p) => p.id === tipo);
  const otrasCuentas = cuentas.filter((c) => c.numeroCuenta !== cuenta?.numeroCuenta);

  const cambiarTipo = (nuevo) => {
    setTipo(nuevo);
    setErrorLocal('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorLocal('');
    const valor = Number(monto);

    // Validaciones en el cliente (el backend vuelve a validar)
    if (!monto || !Number.isFinite(valor) || valor <= 0) return setErrorLocal('Ingresa un monto mayor a 0.');
    if (tipo !== 'deposito' && valor > (cuenta?.saldo ?? 0)) return setErrorLocal('El monto supera el saldo disponible.');
    if (tipo === 'transferencia' && !destino.trim()) return setErrorLocal('Indica la cuenta destino.');

    const ok = await onOperar({ tipo, monto: valor, destino: destino.trim(), descripcion: descripcion.trim() });
    if (ok) {
      setMonto('');
      setDestino('');
      setDescripcion('');
    }
  };

  const inputCls =
    'w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 disabled:bg-gray-100';

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <h2 className="mb-4 text-lg font-bold text-gray-800">Nueva operación</h2>

      <div className="mb-5 grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1 text-sm font-medium">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => cambiarTipo(p.id)}
            className={`rounded-lg px-2 py-2 transition ${tipo === p.id ? 'bg-white text-teal-700 shadow' : 'text-gray-500 hover:text-gray-800'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {tipo === 'transferencia' && (
          <div>
            <label htmlFor="destino" className="mb-1 block text-sm font-medium text-gray-700">Cuenta destino</label>
            <input
              id="destino"
              list="lista-cuentas"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              placeholder="Ej. 1002"
              disabled={procesando}
              className={inputCls}
            />
            <datalist id="lista-cuentas">
              {otrasCuentas.map((c) => (
                <option key={c.numeroCuenta} value={c.numeroCuenta}>{c.titular}</option>
              ))}
            </datalist>
          </div>
        )}

        <div>
          <label htmlFor="monto" className="mb-1 block text-sm font-medium text-gray-700">Monto (S/)</label>
          <input
            id="monto"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0.00"
            disabled={procesando}
            className={inputCls}
          />
          {tipo !== 'deposito' && cuenta && (
            <p className="mt-1 text-xs text-gray-500">Disponible: {formatoMoneda(cuenta.saldo, cuenta.moneda)}</p>
          )}
        </div>

        {tipo === 'transferencia' && (
          <div>
            <label htmlFor="desc" className="mb-1 block text-sm font-medium text-gray-700">Descripción (opcional)</label>
            <input
              id="desc"
              maxLength={100}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Pago de alquiler"
              disabled={procesando}
              className={inputCls}
            />
          </div>
        )}

        {errorLocal && <p className="text-sm font-medium text-red-600">{errorLocal}</p>}

        <button
          type="submit"
          disabled={procesando || !cuenta}
          className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${pestana.color}`}
        >
          {procesando && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          {procesando ? 'Procesando…' : pestana.boton}
        </button>
      </form>
    </section>
  );
}
