import { useCallback, useEffect, useState } from 'react';
import { api } from './services/api';
import Navbar from './components/Navbar';
import SaldoCard from './components/SaldoCard';
import FormOperacion from './components/FormOperacion';
import HistorialTransacciones from './components/HistorialTransacciones';
import Alerta from './components/Alerta';

export default function App() {
  const [cuentas, setCuentas] = useState([]);
  const [cuentaId, setCuentaId] = useState('');
  const [cuenta, setCuenta] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [alerta, setAlerta] = useState(null);

  // 1. Al montar: cargar la lista de cuentas
  useEffect(() => {
    api
      .listarCuentas()
      .then(({ cuentas }) => {
        setCuentas(cuentas);
        if (cuentas.length) setCuentaId(cuentas[0].numeroCuenta);
        else setCargando(false);
      })
      .catch((err) => {
        setAlerta({ tipo: 'error', mensaje: err.message });
        setCargando(false);
      });
  }, []);

  // Trae saldo + historial de la cuenta activa
  const cargarDatos = useCallback(async (id) => {
    if (!id) return;
    setCargando(true);
    try {
      const [{ cuenta }, { movimientos }] = await Promise.all([api.obtenerCuenta(id), api.historial(id)]);
      setCuenta(cuenta);
      setMovimientos(movimientos);
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.message });
    } finally {
      setCargando(false);
    }
  }, []);

  // 2. Cada vez que cambia la cuenta activa: recargar datos
  useEffect(() => {
    cargarDatos(cuentaId);
  }, [cuentaId, cargarDatos]);

  // 3. Ocultar la alerta automáticamente
  useEffect(() => {
    if (!alerta) return;
    const t = setTimeout(() => setAlerta(null), 5000);
    return () => clearTimeout(t);
  }, [alerta]);

  // Ejecuta la operación y sincroniza saldo e historial sin recargar la página
  const handleOperar = async ({ tipo, monto, destino, descripcion }) => {
    setProcesando(true);
    setAlerta(null);
    try {
      let resp;
      if (tipo === 'deposito') resp = await api.depositar(cuentaId, monto);
      else if (tipo === 'retiro') resp = await api.retirar(cuentaId, monto);
      else resp = await api.transferir(cuentaId, destino, monto, descripcion);

      setCuenta(resp.cuenta); // saldo actualizado al instante
      const [{ movimientos }, { cuentas }] = await Promise.all([api.historial(cuentaId), api.listarCuentas()]);
      setMovimientos(movimientos);
      setCuentas(cuentas);
      setAlerta({ tipo: 'exito', mensaje: resp.mensaje });
      return true;
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.message });
      return false;
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar cuentas={cuentas} cuentaId={cuentaId} onCambiarCuenta={setCuentaId} />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <Alerta alerta={alerta} onCerrar={() => setAlerta(null)} />

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <SaldoCard cuenta={cuenta} cargando={cargando} onRefrescar={() => cargarDatos(cuentaId)} />
            <FormOperacion cuenta={cuenta} cuentas={cuentas} procesando={procesando} onOperar={handleOperar} />
          </div>
          <div className="lg:col-span-3">
            <HistorialTransacciones movimientos={movimientos} numeroCuenta={cuentaId} cargando={cargando} />
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-gray-400">Ingeniería Web · Sistema de Gestión de Cuenta Bancaria</footer>
    </div>
  );
}
