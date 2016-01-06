var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var mongo = require('./data/mongo.js');

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', function(req, res) {
    res.redirect('index.html');
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/unsponsored', function(req, res) {
    mongo.find({'status': 'Waiting for Sponsor - No Prior Sponsor'}, 'children',
        100, function(docs) {
            res.send(JSON.stringify(docs));
        });
});

app.get('/api/children/:id', function(req, res) {
    mongo.get(req.params.id, 'children', function(doc) {
        res.send(JSON.stringify(doc));
    });
});

app.listen(3000, function () {
    console.log('Express port listening at localhost:3000');
});
