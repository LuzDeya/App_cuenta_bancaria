// Error con código HTTP para usar en los controladores
export class HttpError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

// Ruta no encontrada
export function rutaNoEncontrada(req, res) {
  res.status(404).json({ ok: false, mensaje: `Ruta ${req.method} ${req.originalUrl} no existe` });
}

// Manejador central de errores: 400 / 404 / 500
// eslint-disable-next-line no-unused-vars
export function manejadorErrores(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ ok: false, mensaje: err.message });
  }
  if (err.name === 'ValidationError' || err.name === 'CastError' || err.type === 'entity.parse.failed') {
    return res.status(400).json({ ok: false, mensaje: 'Datos inválidos en la solicitud' });
  }
  console.error('Error interno:', err);
  res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
}
