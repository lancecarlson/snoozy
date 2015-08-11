module.exports = require('knex')({
  client: 'postgres',
  connection: process.env.DATABASE_URL,
  debug: true
});
