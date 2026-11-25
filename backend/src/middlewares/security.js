// Aplica validación, sesión, autorización y protección contra CSRF.
const crypto = require('node:crypto');
const { User, SecurityEvent } = require('../models');
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const validate = schema => (req, res, next) => { const r = schema.safeParse(req.body); if (!r.success) return res.status(400).json({ ok: false, error: { message: r.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') } }); req.body = r.data; next(); };
const csrf = (req, res, next) => { const a = req.session.csrf; const b = req.get('X-CSRF-Token'); if (!a || !b || Buffer.byteLength(a) !== Buffer.byteLength(b) || !crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))) return res.status(403).json({ ok: false, error: { message: 'Token de seguridad inválido. Recargue la página.' } }); next(); };
const requireUser = wrap(async (req, res, next) => { if (!req.session.userId) return res.status(401).json({ ok: false, error: { message: 'Inicie sesión para continuar.' } }); req.user = await User.findByPk(req.session.userId); if (!req.user) return res.status(401).json({ ok: false, error: { message: 'Sesión inválida.' } }); next(); });
const requireAdmin = wrap(async (req, res, next) => { if (req.user.role !== 'administrador') { await SecurityEvent.create({ userId: req.user.id, eventType: 'access_denied', result: 'denied' }); return res.status(403).json({ ok: false, error: { message: 'Acceso denegado.' } }); } next(); });
module.exports = { wrap, validate, csrf, requireUser, requireAdmin };
