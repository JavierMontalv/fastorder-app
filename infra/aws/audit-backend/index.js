import auditRoutes from './routes/auditRoutes.js';
// backend/index.js
// ======================================================================
// 🚀 Comanda Backend – Entry Point (Enterprise 2026)
// ======================================================================

import dotenv from 'dotenv';

dotenv.config();

// ======================================================
// 📦 Imports base
// ======================================================
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import helmet from 'helmet';
import http from 'http';
import morgan from 'morgan';
import path from 'path';
import { Server as SocketServer } from 'socket.io';
import { fileURLToPath } from 'url';

// ======================================================
// 🧾 Infra crítica
// ======================================================
import { corsErrorHandler } from './middlewares/corsErrorHandler.js';
import { requestId } from './middlewares/requestId.js';
import iaInventarioService from './services/iaInventarioService.js';
import { corsOptions } from './config/cors.js';

// ======================================================
// 🔐 Rate limits
// ======================================================
import { rateLimitAuth } from './middlewares/rateLimitAuth.js';
import { rateLimitPrivate } from './middlewares/rateLimitPrivate.js';
import { rateLimitPublic } from './middlewares/rateLimitPublic.js';
import auditarAccion from './middlewares/auditarAccion.js';

// ======================================================
// 🛣️ Rutas privadas
// ======================================================
import analyticsRoutes from './routes/analyticsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import categoriaRoutes from './routes/categoriaRoutes.js';
import equipoRoutes from './routes/equipoRoutes.js';
import iaRoutes from './routes/iaRoutes.js';
import inventarioIARoutes from './routes/inventarioIARoutes.js';
import inventarioRoutes from './routes/inventarioRoutes.js';
import mesaRoutes from './routes/mesaRoutes.js';
import reservaRoutes from './routes/reservaRoutes.js';
import modificadorRoutes from './routes/modificadorRoutes.js';
import pagoRoutes from './routes/pagoRoutes.js';
import pedidoRoutes from './routes/pedidoRoutes.js';
import platoRoutes from './routes/platoRoutes.js';
import productoRoutes from './routes/productoRoutes.js';
import promocionesRoutes from './routes/promocionesRoutes.js';
import restauranteRoutes from './routes/restauranteRoutes.js';
import soporteIARoutes from './routes/soporteIARoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import superadminRoutes from './routes/superadminRoutes.js';
import traduccionRoutes from './routes/traduccionRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import qrPdfRoutes from './routes/qrPdfRoutes.js';
import suscripcionRoutes from './routes/suscripcionRoutes.js';
import planesRoutes from './routes/planesRoutes.js';
import displayRoutes from './routes/displayRoutes.js';

// ======================================================
// 🌍 Rutas públicas (QR)
// ======================================================
import catalogoRoutes from './routes/catalogoRoutes.js';
import mesaPublicaRoutes from './routes/mesaPublicaRoutes.js';
import categoriaPublicRoutes from './routes/public/categoriaPublicRoutes.js';
import comercialPublicRoutes from './routes/public/comercialPublicRoutes.js';
import displayPublicRoutes from './routes/public/displayPublicRoutes.js';
import mesaQrPublicRoutes from './routes/public/mesaPublicRoutes.js';
import menuPublicRoutes from './routes/public/menuPublicRoutes.js';
import pedidoPublicRoutes from './routes/public/pedidoPublicRoutes.js';
import productoPublicRoutes from './routes/public/productoPublicRoutes.js';
import restaurantePublicRoutes from './routes/public/restaurantePublicRoutes.js';
import pushRoutes from './routes/pushRoutes.js';

// ======================================================
// 🔧 Core
// ======================================================
import { sequelize } from './config/db.js';
import { iniciarScheduler } from './jobs/scheduler.js';
import { errorHandler } from './middlewares/errorHandler.js';
import './models/index.js';
import { inicializarSockets } from './sockets/index.js';
import { configurarSocketsPedidos } from './sockets/pedidosSocket.js';
import { configurarSocketsInventario } from './sockets/inventarioSocket.js';
import logger from './utils/logger.js';
import { ensureDisplaySchema } from './services/displaySchemaService.js';
import { ensureMesaSchema } from './services/mesaSchemaService.js';
import { ensurePedidoSchema } from './services/pedidoSchemaService.js';

// ======================================================
// 🟢 Logs infraestructura
// ======================================================
console.log('🚀 Comanda Backend iniciando...');
console.log('🌍 NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('📡 Puerto configurado:', process.env.PORT || 4000);

// ======================================================
// 📁 __dirname
// ======================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======================================================
// 🔥 DB (ÚNICO BOOT)
// ======================================================
try {
  await sequelize.authenticate();
  console.log('🟢 Conexión a RDS exitosa');
  await ensureMesaSchema();
  await ensurePedidoSchema();
  await ensureDisplaySchema();
} catch (error) {
  console.error('🔴 Error DB:', error.message);
  process.exit(1);
}

// ======================================================
// ⏰ Scheduler
// ======================================================
iniciarScheduler();

// ======================================================
// 🤖 IA Inventario
// ======================================================
iaInventarioService.inicializarListenersIAInventario();

// ======================================================
// ⚙️ Express
// ======================================================
const app = express();
app.set('trust proxy', 1);

// ======================================================
// 🧾 Request ID
// ======================================================
app.use(requestId);

app.use(compression());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
  })
);

// ======================================================
// 🛡️ CORS (centralizado en config/cors.js)
// ======================================================
app.use(cors(corsOptions));

// ======================================================
// 🚦 Rate limit base (alto)
// ======================================================
app.use(
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator
  })
);

// ======================================================
// 🧾 Logs HTTP
// ======================================================
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  })
);

// ======================================================
// ======================================================
// 🖼️ ARCHIVOS ESTÁTICOS (uploads — imágenes de productos)
// ======================================================
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// 🩺 Health
// ======================================================
app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      success: true,
      status: 'up',
      timestamp: new Date().toISOString()
    });
  } catch {
    res.status(503).json({ success: false, status: 'down' });
  }
});

// ======================================================
// 🔐 Auth
// ======================================================
app.use('/api/auth', rateLimitAuth, auditarAccion, authRoutes);

// ======================================================
// 🌐 Rutas públicas (QR)
// ======================================================
app.use('/api/public/restaurantes', restaurantePublicRoutes);
app.use('/api/public/categorias', categoriaPublicRoutes);
app.use('/api/public/menu', rateLimitPublic, menuPublicRoutes);
app.use('/api/public/comercial', rateLimitPublic, comercialPublicRoutes);
app.use('/api/public/display', rateLimitPublic, displayPublicRoutes);
app.use('/api/public/mesas', rateLimitPublic, mesaQrPublicRoutes);
app.use('/api/public/pedidos', rateLimitPublic, pedidoPublicRoutes);
app.use('/api/public/productos', rateLimitPublic, productoPublicRoutes);
app.use('/api/push', rateLimitPublic, pushRoutes);

app.use('/api/stats', rateLimitPublic, statsRoutes);
app.use('/api/catalogo', rateLimitPublic, catalogoRoutes);
app.use('/api', mesaPublicaRoutes);

// ======================================================
// 📦 PLANES (PÚBLICO)
// ======================================================
app.use('/api/planes', planesRoutes);

// ======================================================
// 🔐 Rutas privadas
// ======================================================
app.use(auditarAccion);

app.use('/api/auditoria', rateLimitPrivate, auditRoutes);

app.use('/api/usuarios', rateLimitPrivate, usuarioRoutes);
app.use('/api/equipo', rateLimitPrivate, equipoRoutes);
app.use('/api/restaurantes', rateLimitPrivate, restauranteRoutes);
app.use('/api/mesas', rateLimitPrivate, mesaRoutes);
app.use('/api/reservas', rateLimitPrivate, reservaRoutes);
app.use('/api/categorias', rateLimitPrivate, categoriaRoutes);
app.use('/api/productos', rateLimitPrivate, productoRoutes);
app.use('/api/platos', rateLimitPrivate, platoRoutes);
app.use('/api/pedidos', rateLimitPrivate, pedidoRoutes);
app.use('/api/display', rateLimitPrivate, displayRoutes);
app.use('/api/pagos', rateLimitPrivate, pagoRoutes);
app.use('/api/promociones', rateLimitPrivate, promocionesRoutes);
app.use('/api/analytics', rateLimitPrivate, analyticsRoutes);
app.use('/api/superadmin', rateLimitPrivate, superadminRoutes);
app.use('/api/ia', rateLimitPrivate, iaRoutes);
app.use('/api/soporte-ia', rateLimitPrivate, soporteIARoutes);
app.use('/api/qr/pdf', rateLimitPrivate, qrPdfRoutes);
app.use('/api/suscripciones', rateLimitPrivate, suscripcionRoutes);

app.use('/api', traduccionRoutes);

// ======================================================
// 📦 Inventario y Modificadores
// ======================================================
app.use('/api/inventario/ia', rateLimitPrivate, inventarioIARoutes);
app.use('/api/inventario', rateLimitPrivate, inventarioRoutes);
app.use('/api/modificadores', rateLimitPrivate, modificadorRoutes);

// ======================================================
// 🧨 Errores
// ======================================================
app.use(corsErrorHandler);
app.use(errorHandler);

// ======================================================
// 🔌 Socket.IO (CORS CON CREDENTIALS)
// ======================================================
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: corsOptions.origin,
    credentials: true
  },
  pingInterval: 10000,
  pingTimeout:  5000
});

configurarSocketsPedidos(io);
configurarSocketsInventario(io);
inicializarSockets(io);
global.io = io;

// ======================================================
// 🚀 Server
// ======================================================
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Comanda Backend activo en ${PORT}`));

