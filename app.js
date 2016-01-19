var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongo = require('./data/mongo.js');
var bunyan = require('bunyan');
var nconf = require('nconf');

var app = express();

var port = nconf.get('app:port');

var log = bunyan.createLogger({
    name: 'app',
    streams: [
        {
            level: 'info',
            stream: process.stdout
            // path: './var/log/app_info.log',
            // period: '1d',  // daily rotation
            // count: 3
        },
        {
            level: 'trace',
            path: './var/log/app_access.log',
            period: '1d',    // daily rotation
            count: 3
        },
        {
            level: 'error',
            path: './var/log/app_error.log',
            period: '1d',   // daily rotation
            count: 10
        }
    ]
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.redirect('index.html');
});

app.get('/api/v1/unsponsored', function(req, res) {
    mongo.find({'status': 'Waiting for Sponsor - No Prior Sponsor'}, 'children',
        100, true, function(docs) {
            res.send(docs);
        });
});

app.get('/api/v1/children/:id', function(req, res) {
    mongo.get(req.params.id, 'children', true, function(doc) {
        res.send(doc);
    });
});

app.put('/api/v1/children/:id', function(req, res) {
    mongo.edit(req.params.id, req.body.changes, 'children', function() {
        res.send('good');
    });
});

app.get('/api/v1/pictures/:id', function(req, res) {
    mongo.getPic(req.params.id, 'children', function(data) {
        res.set('Content-Type', 'text/plain; charset=x-user-defined');
        res.send(data);
    });
});

app.post('/api/v1/donors', function(req, res) {
    mongo.insert(req.body, 'donors', function(result) {
        res.send(result);
    });
});

app.put('/api/v1/donors', function(req, res) {
    mongo.edit(req.body._id, req.body.changes, 'donors', function(result) {
        res.send(result);
    });
});

app.get('/api/v1/donorid/:selector', function(req, res) {
    mongo.find(JSON.parse(req.params.selector), 'donors', 1, false,
        function(doc) {
            res.send(doc);
        });
});

app.listen(port, function () {
    log.info('express port listening at localhost:' + port);
});
