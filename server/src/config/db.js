import mongoose from 'mongoose';

export async function conectarDB(uri) {
  mongoose.connection.on('connected', () => console.log('✅ Conectado a MongoDB local'));
  mongoose.connection.on('error', (err) => console.error('❌ Error de MongoDB:', err.message));
  mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB desconectado'));

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
}
