// Verifica confidencialidad, integridad y validación de entradas.
const test = require('node:test');
const assert = require('node:assert/strict');
process.env.ENCRYPTION_KEY_BASE64 = Buffer.alloc(32, 7).toString('base64');
const { encrypt, decrypt, seal, open, blindIndex, hashToken } = require('../src/services/crypto');
const { register } = require('../src/validators/schemas');
test('cifrado autenticado usa IV nuevo y detecta alteraciones', () => { const a = encrypt('dato privado'); const b = encrypt('dato privado'); assert.notEqual(a.iv, b.iv); assert.notEqual(a.cipher, b.cipher); assert.equal(decrypt(a), 'dato privado'); const tag = Buffer.from(a.tag, 'base64'); tag[0] ^= 1; assert.throws(() => decrypt({ ...a, tag: tag.toString('base64') })); });
test('hash del token es estable y no es el token', () => { assert.equal(hashToken('abc').length, 64); assert.notEqual(hashToken('abc'), 'abc'); });
test('contraseñas comprueban complejidad y límite en bytes', () => { const base = { name: 'Test', email: 'test@example.com' }; assert.equal(register.safeParse({ ...base, password: 'ClaveSegura123!' }).success, true); assert.equal(register.safeParse({ ...base, password: 'simple' }).success, false); assert.equal(register.safeParse({ ...base, password: 'Aa1!' + 'ñ'.repeat(35) }).success, false); });
test('seal/open empaqueta el cifrado y el índice ciego no revela el correo', () => { const p = seal('Ana Pérez'); assert.ok(!p.includes('Ana')); assert.notEqual(seal('Ana Pérez'), p); assert.equal(open(p), 'Ana Pérez'); const parts = p.split(':'); const c = Buffer.from(parts[3], 'base64'); c[0] ^= 1; parts[3] = c.toString('base64'); assert.throws(() => open(parts.join(':'))); assert.equal(blindIndex('Ana@Example.com '), blindIndex('ana@example.com')); assert.equal(blindIndex('ana@example.com').length, 64); assert.ok(!blindIndex('ana@example.com').includes('ana')); });
