var knex = require('./knex'),
    Promise = require('bluebird');

var ErrNotFound = new Error("not found");
ErrNotFound.code = 404;

var ErrDocumentUpdateConflict = new Error("Document update conflict");
ErrNotFound.code = 409;

var Doc = function(db) {
  return {
    db: db || 'docs',
    doc_field: 'doc',
    selectFields: function() {
      return ['id', 'rev', this.doc_field];
    },
    parseBody: function(body) {
      var params = {};
      params[this.doc_field] = body;
      if (body._id) {
        params.id = body._id;
        delete body._id;
      } else {
        params.id = knex.raw('uuid_generate_v4()');
      }
      if (body._rev) {
        params.rev = body._rev;
        delete body._rev;
      } else {
        params.rev = knex.raw('uuid_generate_v4()');
      }
      return params;
    },
    post: function(body) {
      if (body === undefined)
        return Promise.reject(Error("No data"));
      var params = this.parseBody(body);
      console.log(params);
      return knex(this.db).insert(params).returning(['id', 'rev']).then(function(data) {
        return {ok: true, id: data[0].id, rev: data[0].rev};
      });
    },
    get: function(id) {
      return knex(this.db).first().select(this.selectFields()).where('id', id).then(function(data) {
        if (!data)
          throw ErrNotFound;
        data.doc._id = data.id;
        data.doc._rev = data.rev;
        delete data.id;
        delete data.rev;
        return data.doc;
      });
    },
    put: function(id, body) {
      body._id = id;

      var updateQ = function() {
        delete body._rev; // reset revision
        var params = this.parseBody(body);
        return knex(this.db)
          .update(params)
          .where('id', id)
          .returning(['id', 'rev']).then(function(data) {
            return {ok: true, id: data[0].id, rev: data[0].rev};
          });
      }.bind(this);

      var onHead = function(data) {
        if (!data)
          return this.post(body);

        if (data.rev != body._rev)
          throw ErrDocumentUpdateConflict;

        return updateQ();
      }.bind(this);

      return this.head(id).then(onHead);
    },
    delete: function(id) {
      return knex(this.db).where('id', id).del().then(function(data) {
        return {ok: true};
      });
    },
    head: function(id) {
      return knex(this.db).first().select('rev').where('id', id);
    }
  }
};

module.exports = Doc;
