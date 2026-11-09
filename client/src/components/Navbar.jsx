export default function Navbar({ cuentas, cuentaId, onCambiarCuenta }) {
  return (
    <header className="bg-teal-700 text-white shadow-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-xl font-bold">B</div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Banco Simple</h1>
            <p className="text-xs text-teal-200">Gestión de cuenta bancaria</p>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-teal-100">Cuenta activa:</span>
          <select
            value={cuentaId}
            onChange={(e) => onCambiarCuenta(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/60 sm:w-auto"
          >
            {cuentas.length === 0 && <option value="">Sin cuentas</option>}
            {cuentas.map((c) => (
              <option key={c.numeroCuenta} value={c.numeroCuenta} className="text-gray-900">
                {c.numeroCuenta} — {c.titular}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
