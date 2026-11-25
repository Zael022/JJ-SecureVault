// Persiste las sesiones en una tabla creada por migración.
const session = require('express-session');
const { Session } = require('../models');
module.exports = class MysqlSessionStore extends session.Store {
 get(sid, cb) { Session.findByPk(sid).then(row => { if (!row || row.expiresAt <= new Date()) return cb(null, null); cb(null, JSON.parse(row.data)); }).catch(cb); }
 set(sid, data, cb = () => {}) { Session.upsert({ sid, userId: data.userId || null, data: JSON.stringify(data), expiresAt: data.cookie.expires || new Date(Date.now() + 3600000) }).then(() => cb()).catch(cb); }
 destroy(sid, cb = () => {}) { Session.destroy({ where: { sid } }).then(() => cb()).catch(cb); }
};
