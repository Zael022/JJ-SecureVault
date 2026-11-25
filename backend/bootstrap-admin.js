// Crea el primer administrador desde una terminal interactiva.
require('dotenv').config();
const readline = require('node:readline');
const bcrypt = require('bcrypt');
const { User, sequelize } = require('./src/models');
const { register } = require('./src/validators/schemas');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = prompt => new Promise(resolve => rl.question(prompt, resolve));
async function main() { if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Ejecute este comando en una terminal interactiva.'); if (await User.count({ where: { role: 'administrador' } })) throw new Error('Ya existe un administrador. Use el panel para gestionar roles.'); const name = await ask('Nombre: '); const email = await ask('Correo: '); process.stdout.write('Contraseña (no se mostrará): '); rl._writeToOutput = () => {}; const password = await ask(''); rl._writeToOutput = str => process.stdout.write(str); process.stdout.write('\n'); const parsed = register.safeParse({ name, email, password }); if (!parsed.success) throw new Error(parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')); await User.create({ name: parsed.data.name, email: parsed.data.email, passwordHash: await bcrypt.hash(parsed.data.password, 12), role: 'administrador' }); console.log('Administrador creado.'); }
main().catch(e => { console.error('No se creó el administrador:', e.message); process.exitCode = 1; }).finally(async () => { rl.close(); await sequelize.close(); });
