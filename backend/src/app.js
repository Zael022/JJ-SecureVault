// Configura la aplicación web, sus controles y el manejo de errores.
require('dotenv').config();
const express = require('express');
const path = require('node:path');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const Store = require('./services/sessionStore');
const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY && process.env.TRUST_PROXY !== 'false') app.set('trust proxy', /^\d+$/.test(process.env.TRUST_PROXY) ? Number(process.env.TRUST_PROXY) : process.env.TRUST_PROXY);
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'"], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'", ...(process.env.NODE_ENV === 'development' && process.env.FRONTEND_ORIGIN ? [process.env.FRONTEND_ORIGIN] : [])], objectSrc: ["'none'"], frameAncestors: ["'none'"] } } }));
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || false, credentials: true }));
app.use(express.json({ limit: '32kb' }));
app.get('/health', (req, res) => res.json({ ok: true, data: { status: 'ok' } }));
app.use(session({ name: 'sv.sid', secret: process.env.SESSION_SECRET || (process.env.NODE_ENV === 'test' ? 'test-only-secret-not-for-deployment' : (() => { throw new Error('Falta SESSION_SECRET'); })()), store: new Store(), resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 3600000 } }));
app.use('/api', require('./routes'));
const distPath = path.resolve(__dirname, '../../frontend/dist');
// Si el frontend se construye junto al backend, Express lo sirve; en Render solo-API (frontend en Vercel) se omite.
if (process.env.NODE_ENV === 'production' && require('node:fs').existsSync(path.join(distPath, 'index.html'))) { const dist = distPath; app.use(express.static(dist)); app.get('*', (req, res, next) => req.path.startsWith('/api/') ? next() : res.sendFile(path.join(dist, 'index.html'))); }
app.use((req, res) => res.status(404).json({ ok: false, error: { message: 'Recurso no encontrado.' } }));
app.use((err, req, res, next) => { void next; const status = err.status || (err.type === 'entity.parse.failed' ? 400 : err.type === 'entity.too.large' ? 413 : 500); console.error(JSON.stringify({ level: 'error', event: 'request_error', status, name: err.name, code: err.parent?.code || err.code || null, message: status >= 500 ? 'Error del servidor; revisar tipo y código.' : 'Solicitud rechazada', time: new Date().toISOString() })); res.status(status).json({ ok: false, error: { message: status >= 500 ? 'Ocurrió un error interno.' : (err.status ? err.message : 'Solicitud inválida.') } }); });
module.exports = app;
