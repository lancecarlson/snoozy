var express = require('express'),
    knex = require('./knex'),
    logger = require('morgan'),
    bodyParser   = require('body-parser'),
    Db = require('./db'),
    Doc = require('./doc');

var app = express();
var port = process.env.PORT || 5000

app.listen(port, function() {
  console.log("Listening on " + port);
})

app.use(logger('combined'));
//app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({extended: true}));

var onError = function(res) {
  return function(e) {
    var code = e.code || 500;
    var json = {error: e.message};
    if (process.env.NODE_ENV != 'production')
      json.stack = e.stack;
    return res.status(code).json(json);
  }
};

app.get('/', function(req, res) {
  res.json({snoozy: 'Welcome', version: '0.0.1'});
});

/* Database API */
app.put('/:db', function(req, res) {
  Db(req.params.db).create().then(function(data) {
    return res.json({ok: true});
  }).catch(onError(res));
});

app.delete('/:db', function(req, res) {
  Db(req.params.db).delete().then(function(data) {
    return res.json({ok: true});
  }).catch(onError(res));
});

/* Document API */
app.head('/:db/:id', function(req, res) {
  Doc(req.params.db).head(req.params.id).then(function(data) {
    res.set({Etag: data.rev, Connection: 'close'});
    return res.end();
  }).catch(onError(res));
});

app.post('/:db', function(req, res) {
  Doc(req.params.db).post(req.body).then(function(data) {
    return res.json(data);
  }).catch(onError(res));
});

app.get('/:db/:id', function(req, res) {
  Doc(req.params.db).get(req.params.id).then(function(data) {
    res.set('ETag', data._rev);
    return res.json(data);
  }).catch(onError(res));
});

app.put('/:db/:id', function(req, res) {
  Doc(req.params.db).put(req.params.id, req.body).then(function(data) {
    res.set({Etag: data.rev, Connection: 'close'});
    return res.json(data);
  }).catch(onError(res));
});

app.delete('/:db/:id', function(req, res) {
  Doc(req.params.db).delete(req.params.id).then(function(data) {
    return res.json(data);
  }).catch(onError(res));
});

