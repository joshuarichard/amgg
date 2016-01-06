var express = require('express');
var path = require('path');

var mongo = require('./data/mongo.js');

var app = express();

app.get('/', function(req, res) {
    res.redirect('index.html');
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/unsponsered', function(req, res) {
    mongo.findUnsponsoredChildren(function(docs) {
        res.send(JSON.stringify(docs));
    });
});

app.listen(3000, function () {
    console.log('Express port listening at localhost:3000');
});
