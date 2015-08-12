var express = require('express'),
    knex = require('./knex'),
    logger = require('morgan'),
    bodyParser   = require('body-parser'),
    Server = require('./server')();

var app = express();
var port = process.env.PORT || 5000

app.listen(port, function() {
  console.log("Listening on " + port);
})

app.use(logger('combined'));
//app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({extended: true}));

app.get('/', Server.welcome);

/* Database API */
app.get('/_all_dbs', Server.db._all_dbs);
app.put('/:db', Server.db.put);
app.delete('/:db', Server.db.delete);

/* Document API */
app.head('/:db/:id', Server.doc.head);
app.post('/:db', Server.doc.post);
app.get('/:db/:id', Server.doc.get);
app.put('/:db/:id', Server.doc.put);
app.delete('/:db/:id', Server.doc.delete);

/* Catch errors */
app.use(Server.onError);
