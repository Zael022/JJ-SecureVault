// Verifica autorización de notas y cierre de sesión con MySQL de prueba.
const test = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');
const { sequelize, User } = require('../src/models');
const integration = process.env.MYSQL_TEST === '1' ? test : test.skip;
integration('dos usuarios no pueden acceder a notas ajenas y logout invalida la cookie', async () => {
 const suffix = Date.now(); const users = [`a${suffix}@example.test`, `b${suffix}@example.test`];
 const one = request.agent(app); const two = request.agent(app);
 async function setup(agent, email) { let r = await agent.get('/api/auth/csrf'); let csrf = r.body.data.csrfToken; r = await agent.post('/api/auth/register').set('X-CSRF-Token',csrf).send({ name:'Prueba',email,password:'PruebaSegura123!' }); assert.equal(r.status,201); r = await agent.post('/api/auth/login').set('X-CSRF-Token',csrf).send({ email,password:'PruebaSegura123!' }); assert.equal(r.status,200); return { csrf:r.body.data.csrfToken, cookie:r.headers['set-cookie'][0].split(';')[0] }; }
 try { const a = await setup(one,users[0]); const b = await setup(two,users[1]); let r = await one.post('/api/notes').set('X-CSRF-Token',a.csrf).send({title:'Prueba',content:'privado'}); assert.equal(r.status,201); const id = r.body.data.id; r = await two.get(`/api/notes/${id}`); assert.equal(r.status,404); r = await two.put(`/api/notes/${id}`).set('X-CSRF-Token',b.csrf).send({title:'Ajena',content:'x'}); assert.equal(r.status,404); r = await two.delete(`/api/notes/${id}`).set('X-CSRF-Token',b.csrf); assert.equal(r.status,404); r = await one.post('/api/auth/logout').set('X-CSRF-Token',a.csrf); assert.equal(r.status,200); r = await request(app).get('/api/auth/me').set('Cookie',a.cookie); assert.equal(r.status,401); } finally { await User.destroy({where:{email:users}}); await sequelize.close(); }
});
