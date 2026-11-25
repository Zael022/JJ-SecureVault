// Inicia el servidor y cierra las conexiones ante señales o fallos graves.
require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const server = app.listen(Number(process.env.PORT || 3000), () => console.log(JSON.stringify({ level: 'info', event: 'server_started' })));
server.requestTimeout = 30000; server.headersTimeout = 35000;
let stopping = false;
async function shutdown(reason) { if (stopping) return; stopping = true; console.error(JSON.stringify({ level: 'error', event: 'shutdown', reason })); server.close(async () => { await sequelize.close(); process.exit(reason === 'signal' ? 0 : 1); }); setTimeout(() => process.exit(1), 10000).unref(); }
process.on('SIGTERM', () => shutdown('signal')); process.on('SIGINT', () => shutdown('signal')); process.on('uncaughtException', () => shutdown('uncaughtException')); process.on('unhandledRejection', () => shutdown('unhandledRejection'));
