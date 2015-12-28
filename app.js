var express = require('express');
var app = express();
// var mongoapi = require('./src/api/mongo.js');

app.use('/home', express.static('public'));

app.get('/', function(req, res) {
    res.send('index.html');
});

app.listen(3000, function () {
    console.log('Express port listening at localhost:3000/home');
});
