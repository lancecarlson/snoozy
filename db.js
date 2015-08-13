var knex = require('./knex');

var Db = function(db) {
  return {
    db: db,
    doc_field: 'doc',
    list: function() {
      var self = this;
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
        }).then(function(tables) {
          var securityP = Object.keys(tables).map(function(tbl) {
            return self.security(tbl).then(function(doc) {
              return {tbl: tbl, doc: doc};
            });
          });
          return Promise.all(securityP).then(function(docs) {
            docs.forEach(function(doc) {
              if (doc.doc)
                tables[doc.tbl]._security = doc.doc;
            });
            return tables;
          });
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
    security: function(db) {
      return knex(db).first().where('id', '_security');
    }
  }
};

module.exports = Db;
