// Cifra y autentica datos sensibles con AES-256-GCM y genera índices ciegos con HMAC-SHA256.
const crypto = require('node:crypto');
function key() { const k = Buffer.from(process.env.ENCRYPTION_KEY_BASE64 || '', 'base64'); if (k.length !== 32) throw new Error('ENCRYPTION_KEY_BASE64 debe representar exactamente 32 bytes'); return k; }
function encrypt(value) { const iv = crypto.randomBytes(12); const c = crypto.createCipheriv('aes-256-gcm', key(), iv); const ciphertext = Buffer.concat([c.update(value, 'utf8'), c.final()]); return { cipher: ciphertext.toString('base64'), iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), version: Number(process.env.KEY_VERSION || 1) }; }
function decrypt(v) { if (v.version !== Number(process.env.KEY_VERSION || 1)) throw new Error('Versión de llave no disponible'); const d = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(v.iv, 'base64')); d.setAuthTag(Buffer.from(v.tag, 'base64')); return Buffer.concat([d.update(Buffer.from(v.cipher, 'base64')), d.final()]).toString('utf8'); }
// Empaqueta un valor cifrado en una sola columna: v<versión>:<iv>:<tag>:<cifrado>, todo en base64.
function seal(value) { const e = encrypt(String(value)); return `v${e.version}:${e.iv}:${e.tag}:${e.cipher}`; }
function open(packed) { if (packed == null) return null; const [v, iv, tag, cipher] = String(packed).split(':'); if (!v?.startsWith('v') || !iv || !tag || cipher === undefined) throw new Error('Formato cifrado inválido'); return decrypt({ version: Number(v.slice(1)), iv, tag, cipher }); }
// Índice ciego: permite buscar y exigir unicidad del correo sin guardarlo legible. La llave HMAC se deriva con HKDF y es distinta de la de cifrado.
function blindIndex(value) { const hmacKey = Buffer.from(crypto.hkdfSync('sha256', key(), Buffer.alloc(0), 'securevault-email-index-v1', 32)); return crypto.createHmac('sha256', hmacKey).update(String(value).trim().toLowerCase()).digest('hex'); }
function hashToken(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
module.exports = { encrypt, decrypt, seal, open, blindIndex, hashToken };
