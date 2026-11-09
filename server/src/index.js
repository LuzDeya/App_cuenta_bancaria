import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { conectarDB } from './config/db.js';
import cuentaRoutes from './routes/cuentaRoutes.js';
import { manejadorErrores, rutaNoEncontrada } from './middleware/errores.js';

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/banco_db';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.get('/api/salud', (req, res) => res.json({ ok: true, estado: 'API funcionando' }));
app.use('/api', cuentaRoutes);

app.use(rutaNoEncontrada);
app.use(manejadorErrores);

conectarDB(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 API escuchando en http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('No se pudo conectar a MongoDB. ¿Está corriendo mongod?\n', err.message);
    process.exit(1);
  });
