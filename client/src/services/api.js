// Capa de acceso a la API REST del backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(ruta, opciones = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${ruta}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opciones,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. ¿Está corriendo el backend?');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.mensaje || `Error ${res.status}`);
  return data;
}

const post = (ruta, body) => request(ruta, { method: 'POST', body: JSON.stringify(body) });

export const api = {
  listarCuentas: () => request('/cuentas'),
  obtenerCuenta: (id) => request(`/cuenta/${encodeURIComponent(id)}`),
  historial: (id, limite = 20) => request(`/cuenta/${encodeURIComponent(id)}/historial?limite=${limite}`),
  depositar: (numeroCuenta, monto) => post('/cuenta/deposito', { numeroCuenta, monto }),
  retirar: (numeroCuenta, monto) => post('/cuenta/retiro', { numeroCuenta, monto }),
  transferir: (cuentaOrigen, cuentaDestino, monto, descripcion) =>
    post('/cuenta/transferencia', { cuentaOrigen, cuentaDestino, monto, descripcion }),
};

export const formatoMoneda = (n, moneda = 'PEN') =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda }).format(n ?? 0);
