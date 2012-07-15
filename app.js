var express = require('express');
var routes = require('./routes');
var fs = require('fs');
var persist = require('persist');

// DB Configuration

var databaseSettings = JSON.parse(fs.readFileSync('database.json', 'utf-8'));
persist.setDefaultConnectOptions(databaseSettings.dev);

// App Configuration

var app = module.exports = express.createServer();

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', { layout: false, pretty: true });  
  app.use(express.bodyParser());
  //app.use(app.router); //no idea what this does
  app.use(express.static(__dirname + '/public'));
});

app.get('/', routes.index);
app.get('/tag/*', routes.index);
app.get('/bookmarklet', routes.bookmarklet);
app.get('/api/get/*', routes.api.get);
app.get('/api/post', routes.api.post);
app.get('/images/*', routes.images);

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

