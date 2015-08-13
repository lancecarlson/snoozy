var Promise = require('bluebird'),
    jwt = Promise.promisifyAll(require('jsonwebtoken')),
    Db = require('./db'),
    Doc = require('./doc');

var onError = function(e, req, res, next) {
  var code = e.code || 500;
  var json = {error: e.message};
  if (process.env.NODE_ENV != 'production')
    json.stack = e.stack;
  return res.status(code).json(json);
};

var onCatch = function(req, res) {
  return function(e) { onError(e, req, res); };
};

var Server = function() {
  var s = {
    dbs: {},
    onError: onError,
    auth: function(req, res, next) {
      var db = s.dbs[req.params.db];
      var security = db._security;
      var jwt_pubkey;
      if (db._security) {
        jwt_pubkey = db._security.doc.pubkey;
      } 

      // skip authorization checks if there is no pubkey
      if (!jwt_pubkey)
        return next();
  
      var token;
      if (req.headers && req.headers.authorization) {
        var parts = req.headers.authorization.split(' ');
        if (parts.length == 2) {
          var scheme = parts[0],
          credentials = parts[1];

          if (/^Bearer$/i.test(scheme)) {
            token = credentials;
          }
        } else {
          return res.status(401).json({error: 'Format is Authorization: Bearer [token]'});
        }
      } else if (req.query.token) {
        token = req.query.token;
        delete req.query.token;
      } else {
        // code for public access eventually
        return res.status(401).json({error: 'No Authorization header or token query found'});
      }

      jwt.verifyAsync(token, jwt_pubkey).then(function(data) {
        req.jwt = data;
        next();
      }).catch(function(e) {
        return res.status(401).json({error: e.message});
      });
    },
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
        }).catch(onCatch(req, res));
      },
      post: function(req, res) {
        Doc(s, req.params.db).post(req.body).then(function(data) {
          return res.json(data);
        }).catch(onCatch(req, res));
      },
      get: function(req, res) {
        Doc(s, req.params.db).get(req.params.id).then(function(data) {
          res.set('ETag', data._rev);
          return res.json(data);
        }).catch(onCatch(req, res));
      },
      put: function(req, res) {
        Doc(s, req.params.db).put(req.params.id, req.body).then(function(data) {
          res.set({Etag: data.rev, Connection: 'close'});
          return res.json(data);
        }).catch(onCatch(req, res));
      },
      delete: function(req, res) {
        Doc(s, req.params.db).delete(req.params.id).then(function(data) {
          return res.json(data);
        }).catch(onCatch(req, res));
      }
    }
  }
  s.start();
  return s
};

module.exports = Server;
