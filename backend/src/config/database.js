// Configura el acceso a MySQL usando variables de entorno.
require('dotenv').config();
const settings = { username: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), dialect: 'mysql', logging: false, dialectOptions: process.env.DB_SSL_CA ? { ssl: { ca: process.env.DB_SSL_CA, rejectUnauthorized: true } } : {} };
module.exports = { development: settings, production: settings, test: settings };
