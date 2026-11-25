// Contiene las operaciones de autenticación y gestión de datos.
const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { sequelize, User, Note, Session, ResetToken, SecurityEvent } = require('../models');
const { encrypt, decrypt, hashToken } = require('./crypto');
const publicUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role });
const event = (userId, eventType, result, details) => SecurityEvent.create({ userId, eventType, result, details });
const fail = (status, message) => Object.assign(new Error(message), { status });
async function register(input) { try { const user = await User.create({ name: input.name, email: input.email, passwordHash: await bcrypt.hash(input.password, 12), role: 'usuario' }); return publicUser(user); } catch (e) { if (e.name === 'SequelizeUniqueConstraintError') throw fail(409, 'El correo ya está registrado.'); throw e; } }
async function login(input) {
 const user = await User.findOne({ where: { email: input.email } });
 const now = new Date();
 if (user && user.lockedUntil && user.lockedUntil > now) { await event(user.id, 'login', 'blocked'); throw fail(429, 'Demasiados intentos. Inténtelo más tarde.'); }
 // El hash fijo solo equilibra el trabajo para cuentas inexistentes; no autentica ninguna cuenta.
 const valid = await bcrypt.compare(input.password, user ? user.passwordHash : '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYxUe0hQ55N6jk8TyDhn.H5z.jK2oF5W');
 if (!user || !valid) { if (user) { user.failedAttempts += 1; if (user.failedAttempts >= 5) user.lockedUntil = new Date(Date.now() + Math.min(2 ** Math.min(user.failedAttempts - 5, 5), 30) * 60000); await user.save(); } await event(user?.id || null, 'login', 'failure'); if (user?.failedAttempts >= 5) { await event(user.id, 'login_alert', 'threshold', 'Umbral de 5 fallos consecutivos alcanzado'); console.warn(JSON.stringify({ level: 'warn', event: 'login_alert', userId: user.id, time: now.toISOString() })); } throw fail(401, 'Credenciales inválidas.'); }
 user.failedAttempts = 0; user.lockedUntil = null; await user.save(); await event(user.id, 'login', 'success'); return publicUser(user);
}
// Envía el correo por la API HTTPS de Brevo (Render gratis bloquea los puertos SMTP).
async function sendResetEmail(to, url) {
 const text = `El enlace vence en 15 minutos. Si no solicitó este cambio, ignore este mensaje: ${url}`;
 if (!process.env.BREVO_API_KEY) { if (process.env.NODE_ENV === 'production') throw new Error('Falta BREVO_API_KEY'); if (process.env.NODE_ENV !== 'test') console.warn(JSON.stringify({ level: 'warn', event: 'reset_email_dev', note: 'Sin BREVO_API_KEY: enlace mostrado solo en desarrollo', url })); return; }
 const res = await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ sender: { name: process.env.MAIL_FROM_NAME || 'SecureVault', email: process.env.MAIL_FROM }, to: [{ email: to }], subject: 'Recuperar acceso a SecureVault', textContent: text }), signal: AbortSignal.timeout(10000) });
 if (!res.ok) throw Object.assign(new Error('No se pudo enviar el correo'), { code: `BREVO_${res.status}` });
}
async function forgot(email) {
 const user = await User.findOne({ where: { email } }); if (!user) return;
 const token = crypto.randomBytes(32).toString('hex'); await ResetToken.create({ userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 15 * 60000) });
 const url = new URL('/reset-password', process.env.APP_URL); url.searchParams.set('token', token);
 await sendResetEmail(user.email, url.toString());
}
async function reset(token, password) { await sequelize.transaction(async transaction => { const record = await ResetToken.findOne({ where: { tokenHash: hashToken(token), usedAt: null, expiresAt: { [Op.gt]: new Date() } }, transaction, lock: transaction.LOCK.UPDATE }); if (!record) throw fail(400, 'El enlace es inválido o venció.'); const user = await User.findByPk(record.userId, { transaction, lock: transaction.LOCK.UPDATE }); user.passwordHash = await bcrypt.hash(password, 12); user.failedAttempts = 0; user.lockedUntil = null; await user.save({ transaction }); record.usedAt = new Date(); await record.save({ transaction }); await ResetToken.update({ usedAt: new Date() }, { where: { userId: user.id, usedAt: null }, transaction }); await Session.destroy({ where: { userId: user.id }, transaction }); }); }
async function listNotes(userId) { const rows = await Note.findAll({ where: { userId }, order: [['updatedAt', 'DESC']] }); return rows.map(n => ({ id: n.id, title: n.title, updatedAt: n.updatedAt })); }
async function getNote(userId, id) { const n = await Note.findOne({ where: { id, userId } }); if (!n) { await event(userId, 'note_access_denied', 'denied'); throw fail(404, 'Nota no encontrada.'); } return { id: n.id, title: n.title, content: decrypt({ cipher: n.contentCipher, iv: n.contentIv, tag: n.contentTag, version: n.keyVersion }), updatedAt: n.updatedAt }; }
async function saveNote(userId, id, input) { let n; if (id) { n = await Note.findOne({ where: { id, userId } }); if (!n) { await event(userId, 'note_access_denied', 'denied'); throw fail(404, 'Nota no encontrada.'); } } else { if (await Note.count({ where: { userId } }) >= 100) throw fail(400, 'Máximo 100 notas por usuario.'); n = Note.build({ userId }); } const encrypted = encrypt(input.content); Object.assign(n, { title: input.title, contentCipher: encrypted.cipher, contentIv: encrypted.iv, contentTag: encrypted.tag, keyVersion: encrypted.version }); await n.save(); return { id: n.id, title: n.title }; }
async function deleteNote(userId, id) { const count = await Note.destroy({ where: { id, userId } }); if (!count) { await event(userId, 'note_access_denied', 'denied'); throw fail(404, 'Nota no encontrada.'); } }
async function setPhone(user, phone) { const e = encrypt(phone); await user.update({ phoneCipher: e.cipher, phoneIv: e.iv, phoneTag: e.tag, phoneKeyVersion: e.version }); }
function maskedPhone(user) { if (!user.phoneCipher) return null; const p = decrypt({ cipher: user.phoneCipher, iv: user.phoneIv, tag: user.phoneTag, version: user.phoneKeyVersion }); return '••••' + p.replace(/\D/g, '').slice(-4); }
module.exports = { publicUser, event, register, login, forgot, reset, listNotes, getNote, saveNote, deleteNote, setPhone, maskedPhone, fail };
