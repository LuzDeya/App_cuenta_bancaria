const estilos = {
  exito: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  error: 'border-red-300 bg-red-50 text-red-800',
};

export default function Alerta({ alerta, onCerrar }) {
  if (!alerta) return null;
  return (
    <div role="alert" className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${estilos[alerta.tipo]}`}>
      <p>
        <span className="mr-1 font-bold">{alerta.tipo === 'exito' ? '✔' : '✖'}</span>
        {alerta.mensaje}
      </p>
      <button onClick={onCerrar} className="font-bold opacity-60 hover:opacity-100" aria-label="Cerrar">×</button>
    </div>
  );
}
