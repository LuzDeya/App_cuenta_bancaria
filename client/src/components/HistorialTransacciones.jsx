import { formatoMoneda } from '../services/api';

// Determina si el movimiento suma o resta para la cuenta que se está viendo
function sentido(mov, numeroCuenta) {
  if (mov.tipo === 'DEPOSITO') return 'ingreso';
  if (mov.tipo === 'RETIRO') return 'egreso';
  return mov.cuentaDestino === numeroCuenta ? 'ingreso' : 'egreso';
}

const ETIQUETAS = { DEPOSITO: 'Depósito', RETIRO: 'Retiro', TRANSFERENCIA: 'Transferencia' };
const BADGES = {
  DEPOSITO: 'bg-emerald-100 text-emerald-700',
  RETIRO: 'bg-amber-100 text-amber-700',
  TRANSFERENCIA: 'bg-teal-100 text-teal-700',
};

const formatoFecha = (f) =>
  new Date(f).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

function FilaMovimiento({ mov, numeroCuenta }) {
  const esIngreso = sentido(mov, numeroCuenta) === 'ingreso';
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${BADGES[mov.tipo]}`}>{ETIQUETAS[mov.tipo]}</span>
          <span className="text-xs text-gray-500">{formatoFecha(mov.fecha)}</span>
        </div>
        <p className="mt-1 truncate text-sm text-gray-700">{mov.descripcion}</p>
        <p className="text-xs text-gray-500">
          Origen: <span className="font-mono">{mov.cuentaOrigen ?? '—'}</span> · Destino:{' '}
          <span className="font-mono">{mov.cuentaDestino ?? '—'}</span>
        </p>
      </div>
      <p className={`shrink-0 text-right text-base font-bold ${esIngreso ? 'text-emerald-600' : 'text-red-600'}`}>
        {esIngreso ? '+' : '−'} {formatoMoneda(mov.monto)}
      </p>
    </li>
  );
}

export default function HistorialTransacciones({ movimientos, numeroCuenta, cargando }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Historial de movimientos</h2>
        <span className="text-xs text-gray-500">Últimos {movimientos.length}</span>
      </div>

      {cargando ? (
        <ul className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => <li key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />)}
        </ul>
      ) : movimientos.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">Aún no hay movimientos en esta cuenta.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {movimientos.map((m) => <FilaMovimiento key={m._id} mov={m} numeroCuenta={numeroCuenta} />)}
        </ul>
      )}
    </section>
  );
}
