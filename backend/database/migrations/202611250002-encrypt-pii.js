// Cifra nombre, correo y título de notas: agrega columnas cifradas, migra los datos existentes y elimina el texto claro.
'use strict';
const { seal, open, blindIndex } = require('../../src/services/crypto');

module.exports = {
 async up(q, S) {
  await q.sequelize.transaction(async transaction => {
   const t = { transaction };
   await q.addColumn('users', 'name_enc', { type: S.TEXT, allowNull: true }, t);
   await q.addColumn('users', 'email_enc', { type: S.TEXT, allowNull: true }, t);
   await q.addColumn('users', 'email_hash', { type: S.STRING(64), allowNull: true }, t);
   await q.addColumn('notes', 'title_enc', { type: S.TEXT, allowNull: true }, t);

   const [users] = await q.sequelize.query('SELECT id, name, email FROM users', t);
   for (const u of users) {
    await q.sequelize.query('UPDATE users SET name_enc = :n, email_enc = :e, email_hash = :h WHERE id = :id', { ...t, replacements: { n: seal(u.name), e: seal(u.email.toLowerCase()), h: blindIndex(u.email), id: u.id } });
   }
   const [notes] = await q.sequelize.query('SELECT id, title FROM notes', t);
   for (const n of notes) {
    await q.sequelize.query('UPDATE notes SET title_enc = :v WHERE id = :id', { ...t, replacements: { v: seal(n.title), id: n.id } });
   }

   await q.changeColumn('users', 'name_enc', { type: S.TEXT, allowNull: false }, t);
   await q.changeColumn('users', 'email_enc', { type: S.TEXT, allowNull: false }, t);
   await q.changeColumn('users', 'email_hash', { type: S.STRING(64), allowNull: false }, t);
   await q.changeColumn('notes', 'title_enc', { type: S.TEXT, allowNull: false }, t);
   await q.addIndex('users', ['email_hash'], { unique: true, name: 'users_email_hash_unique', ...t });

   await q.removeColumn('users', 'name', t);
   await q.removeColumn('users', 'email', t);
   await q.removeColumn('notes', 'title', t);
   // Las sesiones previas estaban en texto claro: se invalidan y los usuarios vuelven a iniciar sesión.
   await q.sequelize.query('DELETE FROM sessions', t);
  });
 },

 async down(q, S) {
  await q.sequelize.transaction(async transaction => {
   const t = { transaction };
   await q.addColumn('users', 'name', { type: S.STRING(100), allowNull: true }, t);
   await q.addColumn('users', 'email', { type: S.STRING(254), allowNull: true }, t);
   await q.addColumn('notes', 'title', { type: S.STRING(150), allowNull: true }, t);

   const [users] = await q.sequelize.query('SELECT id, name_enc, email_enc FROM users', t);
   for (const u of users) {
    await q.sequelize.query('UPDATE users SET name = :n, email = :e WHERE id = :id', { ...t, replacements: { n: open(u.name_enc), e: open(u.email_enc), id: u.id } });
   }
   const [notes] = await q.sequelize.query('SELECT id, title_enc FROM notes', t);
   for (const n of notes) {
    await q.sequelize.query('UPDATE notes SET title = :v WHERE id = :id', { ...t, replacements: { v: open(n.title_enc), id: n.id } });
   }

   await q.changeColumn('users', 'name', { type: S.STRING(100), allowNull: false }, t);
   await q.changeColumn('users', 'email', { type: S.STRING(254), allowNull: false, unique: true }, t);
   await q.changeColumn('notes', 'title', { type: S.STRING(150), allowNull: false }, t);

   await q.removeIndex('users', 'users_email_hash_unique', t);
   await q.removeColumn('users', 'name_enc', t);
   await q.removeColumn('users', 'email_enc', t);
   await q.removeColumn('users', 'email_hash', t);
   await q.removeColumn('notes', 'title_enc', t);
   await q.sequelize.query('DELETE FROM sessions', t);
  });
 }
};
