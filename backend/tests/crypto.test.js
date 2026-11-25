// Verifica confidencialidad, integridad y validación de entradas.
const test = require('node:test');
const assert = require('node:assert/strict');
process.env.ENCRYPTION_KEY_BASE64 = Buffer.alloc(32, 7).toString('base64');
const { encrypt, decrypt, hashToken } = require('../src/services/crypto');
const { register } = require('../src/validators/schemas');
test('cifrado autenticado usa IV nuevo y detecta alteraciones', () => { const a = encrypt('dato privado'); const b = encrypt('dato privado'); assert.notEqual(a.iv, b.iv); assert.notEqual(a.cipher, b.cipher); assert.equal(decrypt(a), 'dato privado'); const tag = Buffer.from(a.tag, 'base64'); tag[0] ^= 1; assert.throws(() => decrypt({ ...a, tag: tag.toString('base64') })); });
test('hash del token es estable y no es el token', () => { assert.equal(hashToken('abc').length, 64); assert.notEqual(hashToken('abc'), 'abc'); });
test('contraseñas comprueban complejidad y límite en bytes', () => { const base = { name: 'Test', email: 'test@example.com' }; assert.equal(register.safeParse({ ...base, password: 'ClaveSegura123!' }).success, true); assert.equal(register.safeParse({ ...base, password: 'simple' }).success, false); assert.equal(register.safeParse({ ...base, password: 'Aa1!' + 'ñ'.repeat(35) }).success, false); });
