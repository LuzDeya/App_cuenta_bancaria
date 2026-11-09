import { Router } from 'express';
import {
  obtenerCuenta,
  listarCuentas,
  depositar,
  retirar,
  transferir,
  historial,
} from '../controllers/cuentaController.js';

// Envuelve controladores async para mandar los errores al manejador central
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();

router.get('/cuentas', ah(listarCuentas));               // extra: listado para el selector
router.post('/cuenta/deposito', ah(depositar));
router.post('/cuenta/retiro', ah(retirar));
router.post('/cuenta/transferencia', ah(transferir));
router.get('/cuenta/:id', ah(obtenerCuenta));
router.get('/cuenta/:id/historial', ah(historial));

export default router;
