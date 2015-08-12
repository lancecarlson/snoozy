var Db = require('./db'),
    Doc = require('./doc');

var onError = function(e, req, res, next) {
  var code = e.code || 500;
  var json = {error: e.message};
  if (process.env.NODE_ENV != 'production')
    json.stack = e.stack;
  return res.status(code).json(json);
};

var Server = function() {
  var s = {
    dbs: {},
    onError: onError,
    start: function() {
      return Db().list().then(function(data) {
        s.dbs = data;
      });
    },
    welcome: function(req, res) {
      return res.json({snoozy: 'Welcome', version: '0.0.1'});
    },
    db: {
      _all_dbs: function(req, res) {
        return res.json(Object.keys(s.dbs));
      },
      put: function(req, res) {
        Db(req.params.db).create().then(function(data) {
          res.json({ok: true});
          return Db().list().then(function(data) {
            s.dbs = data;
          });
        });
      },
      delete: function(req, res) {
        Db(req.params.db).delete().then(function(data) {
          res.json({ok: true});
          return Db().list().then(function(data) {
            s.dbs = data;
          });
        });
      }
    },
    doc: {
      head: function(req, res) {
        Doc(s, req.params.db).head(req.params.id).then(function(data) {
          res.set({Etag: data.rev, Connection: 'close'});
          return res.end();
        });
      },
      post: function(req, res) {
        Doc(s, req.params.db).post(req.body).then(function(data) {
          return res.json(data);
        });
      },
      get: function(req, res) {
        Doc(s, req.params.db).get(req.params.id).then(function(data) {
          res.set('ETag', data._rev);
          return res.json(data);
        });
      },
      put: function(req, res) {
        Doc(req.params.db).put(req.params.id, req.body).then(function(data) {
          res.set({Etag: data.rev, Connection: 'close'});
          return res.json(data);
        });
      },
      delete: function(req, res) {
        Doc(s, req.params.db).delete(req.params.id).then(function(data) {
          return res.json(data);
        });
      }
    }
  }
  s.start();
  return s
};

module.exports = Server;
