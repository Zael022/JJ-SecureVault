// Comprueba la respuesta pública de salud y las cabeceras básicas.
const test = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');
test('health no expone versiones ni datos internos', async () => { const r = await request(app).get('/health'); assert.equal(r.status, 200); assert.deepEqual(r.body, { ok: true, data: { status: 'ok' } }); assert.equal(r.headers['x-powered-by'], undefined); assert.ok(r.headers['content-security-policy']); });
