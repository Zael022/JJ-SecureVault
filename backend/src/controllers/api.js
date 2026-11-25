// Traduce solicitudes HTTP a operaciones de los servicios.
const crypto = require('node:crypto');
const service = require('../services/business');
const { User, SecurityEvent } = require('../models');
const ok = (res, data, status = 200) => res.status(status).json({ ok: true, data });
const callback = fn => new Promise((resolve, reject) => fn(e => e ? reject(e) : resolve()));
module.exports = {
 csrf: (req, res) => { if (!req.session.csrf) req.session.csrf = crypto.randomBytes(32).toString('hex'); ok(res, { csrfToken: req.session.csrf }); },
 register: async (req, res) => ok(res, await service.register(req.body), 201),
 login: async (req, res) => { const user = await service.login(req.body); await callback(cb => req.session.regenerate(cb)); req.session.userId = user.id; req.session.csrf = crypto.randomBytes(32).toString('hex'); await callback(cb => req.session.save(cb)); ok(res, { user, csrfToken: req.session.csrf }); },
 logout: async (req, res) => { await callback(cb => req.session.destroy(cb)); res.clearCookie('sv.sid', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }); ok(res, { message: 'Sesión cerrada.' }); },
 me: async (req, res) => ok(res, service.publicUser(req.user)),
 forgot: async (req, res) => { try { await service.forgot(req.body.email); } catch { console.error(JSON.stringify({ level: 'error', event: 'recovery_delivery_failed', time: new Date().toISOString() })); } ok(res, { message: 'Si la cuenta existe, recibirá instrucciones.' }); },
 reset: async (req, res) => { await service.reset(req.body.token, req.body.password); ok(res, { message: 'Contraseña actualizada.' }); },
 notes: async (req, res) => ok(res, await service.listNotes(req.user.id)),
 note: async (req, res) => ok(res, await service.getNote(req.user.id, req.params.id)),
 createNote: async (req, res) => ok(res, await service.saveNote(req.user.id, null, req.body), 201),
 editNote: async (req, res) => ok(res, await service.saveNote(req.user.id, req.params.id, req.body)),
 deleteNote: async (req, res) => { await service.deleteNote(req.user.id, req.params.id); ok(res, { message: 'Nota eliminada.' }); },
 profile: async (req, res) => ok(res, { ...service.publicUser(req.user), phone: service.maskedPhone(req.user) }),
 phone: async (req, res) => { await service.setPhone(req.user, req.body.phone); ok(res, { phone: service.maskedPhone(req.user) }); },
 users: async (req, res) => ok(res, (await User.findAll({ attributes: ['id','name','email','role','createdAt'], limit: 200, order: [['createdAt','DESC']] })).map(service.publicUser)),
 role: async (req, res) => { const target = await User.findByPk(req.params.id); if (!target) throw service.fail(404, 'Usuario no encontrado.'); if (target.id === req.user.id && req.body.role !== 'administrador') throw service.fail(400, 'No puede retirar su propio rol de administrador.'); const old = target.role; await target.update({ role: req.body.role }); await service.event(req.user.id, 'role_change', 'success', `${target.id}: ${old} → ${target.role}`); ok(res, service.publicUser(target)); },
 events: async (req, res) => ok(res, await SecurityEvent.findAll({ attributes: ['id','userId','eventType','result','details','createdAt'], order: [['createdAt','DESC']], limit: 200 }))
};
