var knex = require('./knex');

var Db = function(db) {
  return {
    db: db,
    doc_field: 'doc',
    create: function() {
      var self = this;
      return knex.schema.createTable(this.db, function(table) {
        table.text('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
        table.text('rev').defaultTo(knex.raw('uuid_generate_v4()'));
        table.json(self.doc_field, true).notNullable().default('{}');
      });
    },
    delete: function() {
      return knex.schema.dropTable(this.db);
    }
  }
};

module.exports = Db;
