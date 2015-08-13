var express = require('express'),
    knex = require('./knex'),
    logger = require('morgan'),
    bodyParser   = require('body-parser'),
    Server = require('./server')();

var app = express();
var port = process.env.PORT || 5984;

app.set('x-powered-by', false);
app.listen(port, function() {
  console.log("Listening on " + port);
})

app.use(logger('combined'));
//app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({extended: true}));

app.get('/', Server.auth, Server.welcome);

/* Database API */
app.get('/_all_dbs', Server.auth, Server.db._all_dbs);
app.put('/:db', Server.auth, Server.db.put);
app.delete('/:db', Server.auth, Server.db.delete);

/* Document API */
app.head('/:db/:id', Server.auth, Server.doc.head);
app.post('/:db', Server.auth, Server.doc.post);
app.get('/:db/:id', Server.auth, Server.doc.get);
app.put('/:db/:id', Server.auth, Server.doc.put);
app.delete('/:db/:id', Server.auth, Server.doc.delete);

/* Catch errors */
app.use(Server.onError);
