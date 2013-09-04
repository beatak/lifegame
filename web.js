var path = require('path');
var fs = require('fs');
var url = require('url');

var express = require('express');
var ejs = require('ejs-locals');
var async = require('async');

var ROOT = __dirname;
var port = process.env.PORT || 5000;
var app = express();

var EXPIRATION; // for static files
var global = (new Function ('return this'))();
var page = global.page = {}; // global variable lol


// ===================================================================


app.use( express.logger() );

app.engine( 'ejs', ejs );
app.set( 'views', ROOT + '/views' );
app.set( 'view engine', 'ejs' );

app.configure('production', function(){
  // console.log('production');
  EXPIRATION = 365 * 24 * 60 * 60 * 1000;
});

app.configure('development', function(){
  // console.log('development');
  EXPIRATION = 10;
  page.cache = ['?', +new Date].join('');
});

app.use( express.static( ROOT + '/public', { maxAge: EXPIRATION }) );
app.use( express.bodyParser() );


// ===================================================================


app.get( '/', function (req, res) {
  res.render(
    'index.ejs', 
    { page: page } 
  );
});


// ===================================================================


app.listen( port, function () {
  console.log( "listening on " + port );
});

