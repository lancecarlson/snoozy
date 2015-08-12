var knex = require('./knex');

var Db = function(db) {
  return {
    db: db,
    doc_field: 'doc',
    list: function() {
      return knex('information_schema.columns')
        .select('table_name', 'column_name', 'data_type', 'column_default', 'is_nullable')
        .where('table_schema', '!=', 'pg_catalog')
        .where('table_schema', '!=', 'information_schema')
        .then(function(columns) {
          var tables = {};
          columns.forEach(function(column) {
            var tableName = column.table_name;
            delete column.table_name;
            tables[tableName] = tables[tableName] || {columns: []};
            tables[tableName].columns.push(column);
          });
          return tables;
        });
    },
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
    },
  }
};

module.exports = Db;
