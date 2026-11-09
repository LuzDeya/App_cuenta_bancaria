import { formatoMoneda } from '../services/api';

export default function SaldoCard({ cuenta, cargando, onRefrescar }) {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 p-6 text-white shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-teal-100">Saldo disponible</p>
          {cargando || !cuenta ? (
            <div className="mt-2 h-10 w-48 animate-pulse rounded-lg bg-white/20" />
          ) : (
            <p className="mt-1 text-4xl font-extrabold tracking-tight">{formatoMoneda(cuenta.saldo, cuenta.moneda)}</p>
          )}
        </div>
        <button
          onClick={onRefrescar}
          disabled={cargando}
          title="Actualizar saldo"
          className="rounded-lg bg-white/15 px-3 py-2 text-sm font-medium transition hover:bg-white/25 disabled:opacity-50"
        >
          ↻ Actualizar
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-teal-200">Titular</p>
          <p className="font-semibold">{cuenta?.titular ?? '—'}</p>
        </div>
        <div>
          <p className="text-teal-200">N.° de cuenta</p>
          <p className="font-mono font-semibold">{cuenta?.numeroCuenta ?? '—'}</p>
        </div>
      </div>
    </section>
  );
}
