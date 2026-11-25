// Persiste las sesiones en una tabla creada por migración; el contenido se guarda cifrado con AES-256-GCM.
const session = require('express-session');
const { Session } = require('../models');
const { seal, open } = require('./crypto');
// Una sesión que no se puede descifrar (alterada o de otra llave) se trata como inexistente.
const read = data => { try { return JSON.parse(open(data)); } catch { return null; } };
module.exports = class DbSessionStore extends session.Store {
 get(sid, cb) { Session.findByPk(sid).then(row => { if (!row || row.expiresAt <= new Date()) return cb(null, null); cb(null, read(row.data)); }).catch(cb); }
 set(sid, data, cb = () => {}) { Session.upsert({ sid, userId: data.userId || null, data: seal(JSON.stringify(data)), expiresAt: data.cookie.expires || new Date(Date.now() + 3600000) }).then(() => cb()).catch(cb); }
 destroy(sid, cb = () => {}) { Session.destroy({ where: { sid } }).then(() => cb()).catch(cb); }
};
