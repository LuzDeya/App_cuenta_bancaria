# 🏦 Sistema de Gestión de Cuenta Bancaria Simplificada

Aplicación web **Full-Stack** para gestionar cuentas bancarias: consulta de saldo, depósitos, retiros, transferencias entre cuentas e historial de movimientos.

**Curso:** Ingeniería Web — Unidad de Desarrollo Full-Stack (Node.js + React + MongoDB)

---

## 🧱 Tecnologías

| Capa | Tecnologías |
|------|-------------|
| Backend | Node.js, Express.js, JavaScript ES6+ (módulos ES), Mongoose |
| Base de datos | MongoDB local |
| Frontend | React 19 + Vite, JSX, `useState` / `useEffect` |
| Estilos | Tailwind CSS v4 (plugin `@tailwindcss/vite`) |

## 📁 Estructura del proyecto

```
banco-app/
├── server/                     # Backend (API REST)
│   ├── scripts/seed.js         # Carga cuentas y movimientos de prueba
│   ├── src/
│   │   ├── config/db.js        # Conexión a MongoDB
│   │   ├── models/             # Cuenta.js, Transaccion.js
│   │   ├── controllers/        # Lógica de negocio y validaciones
│   │   ├── routes/             # Definición de endpoints
│   │   ├── middleware/         # Manejo centralizado de errores (400/404/500)
│   │   └── index.js            # Punto de entrada del servidor
│   └── .env.example
└── client/                     # Frontend (React + Vite + Tailwind)
    ├── src/
    │   ├── components/         # Navbar, SaldoCard, FormOperacion, HistorialTransacciones, Alerta
    │   ├── services/api.js     # Llamadas a la API
    │   ├── App.jsx             # Estado global de la app
    │   └── main.jsx
    └── .env.example
```

## ✅ Requisitos previos

- **Node.js** 18 o superior → `node -v`
- **MongoDB Community Server** instalado y corriendo en local (puerto `27017`)
  - Windows: se instala como servicio y arranca solo. Verifica con `mongosh`.
  - Linux/macOS: `mongod --dbpath /ruta/a/datos` o `sudo systemctl start mongod`
- (Opcional) **MongoDB Compass** para ver los datos gráficamente

## 🚀 Instalación y ejecución

### 1. Clonar el repositorio
```bash
git clone https://github.com/<tu-usuario>/<tu-repo>.git
cd <tu-repo>
```

### 2. Backend
```bash
cd server
cp .env.example .env        # En Windows: copy .env.example .env
npm install
npm run seed                # Crea las cuentas de prueba en MongoDB
npm run dev                 # API en http://localhost:4000
```

### 3. Frontend (en otra terminal)
```bash
cd client
cp .env.example .env        # En Windows: copy .env.example .env
npm install
npm run dev                 # App en http://localhost:5173
```

Abre **http://localhost:5173** en el navegador.

## ⚙️ Variables de entorno

**`server/.env`**

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto de la API | `4000` |
| `MONGO_URI` | Cadena de conexión a MongoDB local | `mongodb://127.0.0.1:27017/banco_db` |
| `CLIENT_URL` | Origen permitido por CORS (frontend) | `http://localhost:5173` |

**`client/.env`**

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `VITE_API_URL` | URL base de la API | `http://localhost:4000/api` |

## 🌱 Script seed (datos de prueba)

`npm run seed` (dentro de `/server`) **borra** las colecciones y crea:

| N.° cuenta | Titular | Saldo inicial |
|-----------|---------|---------------|
| 1001 | Hermiluz Reinaga | S/ 2,500.00 |
| 1002 | Carlos Quispe | S/ 1,200.50 |
| 1003 | María Huamán | S/ 800.00 |
| 1004 | José Rojas | S/ 50.00 |
| 1005 | Ana Torres | S/ 0.00 |

Además inserta movimientos de ejemplo coherentes con esos saldos.

## 🔌 API REST

Base: `http://localhost:4000/api`

| Método | Ruta | Descripción | Body |
|--------|------|-------------|------|
| GET | `/cuenta/:id` | Saldo y datos de la cuenta | — |
| POST | `/cuenta/deposito` | Registra un depósito | `{ "numeroCuenta": "1001", "monto": 100 }` |
| POST | `/cuenta/retiro` | Registra un retiro | `{ "numeroCuenta": "1001", "monto": 50 }` |
| POST | `/cuenta/transferencia` | Transferencia entre cuentas | `{ "cuentaOrigen": "1001", "cuentaDestino": "1002", "monto": 75, "descripcion": "opcional" }` |
| GET | `/cuenta/:id/historial` | Últimos movimientos (`?limite=20`, máx. 100) | — |
| GET | `/cuentas` | *(Extra)* Lista de cuentas para el selector | — |

`:id` es el número de cuenta (ej. `1001`).

### Códigos de respuesta

| Código | Cuándo |
|--------|--------|
| `200` / `201` | Consulta correcta / operación registrada |
| `400` | Monto inválido (≤ 0, no numérico, más de 2 decimales), campos faltantes, misma cuenta origen/destino o **saldo insuficiente** |
| `404` | La cuenta (origen o destino) no existe |
| `500` | Error interno del servidor |

Ejemplo de prueba rápida con curl:
```bash
curl http://localhost:4000/api/cuenta/1001
curl -X POST http://localhost:4000/api/cuenta/retiro -H "Content-Type: application/json" -d "{\"numeroCuenta\":\"1004\",\"monto\":999}"
# → 400 { "ok": false, "mensaje": "Saldo insuficiente para realizar el retiro" }
```

## 🔒 Validaciones y atomicidad

- **Saldos nunca negativos:** retiros y transferencias usan una actualización condicional atómica
  (`findOneAndUpdate({ saldo: { $gte: monto } }, { $inc: { saldo: -monto } })`), así ni dos peticiones simultáneas pueden dejar la cuenta en negativo. El esquema también tiene `min: 0`.
- **Transferencias atómicas:** si MongoDB corre como *replica set*, todo se ejecuta dentro de una **transacción** (`session.withTransaction`) y se revierte automáticamente ante un error.
  Si corre como servidor *standalone* (lo usual en local), el sistema lo detecta y aplica **compensación**: si falla la acreditación o el registro, revierte el débito para que ningún saldo quede a medias.
- Validaciones repetidas en el **frontend** (respuesta inmediata) y en el **backend** (seguridad real).

## 🖥️ Frontend

- **Componentes:** `Navbar` (selector de cuenta), `SaldoCard`, `FormOperacion` (pestañas depósito / retiro / transferencia), `HistorialTransacciones`, `Alerta`.
- **Estado:** `useState` para formularios, cuenta activa, carga y alertas; `useEffect` para cargar cuentas al iniciar, recargar al cambiar de cuenta y ocultar alertas.
- Tras cada operación el **saldo y el historial se actualizan sin recargar la página**.
- Estados de **carga** (skeletons, spinner) y **alertas** de éxito/error.
- Diseño **responsive** solo con clases de Tailwind (móvil → escritorio).

## 🧯 Problemas comunes

| Problema | Solución |
|----------|----------|
| `No se pudo conectar a MongoDB` | Inicia el servicio de MongoDB y revisa `MONGO_URI` |
| La app dice "No se pudo conectar con el servidor" | El backend no está corriendo o `VITE_API_URL` es incorrecta |
| Error de CORS | `CLIENT_URL` del server debe coincidir con la URL del frontend |
| No aparecen cuentas | Ejecuta `npm run seed` en `/server` |
