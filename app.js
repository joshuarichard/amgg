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
            // stream: './var/log/app_info.log',
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

app.get('/', function(req, res) {
    log.info('getting index.html');
    res.redirect('index.html');
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/unsponsored', function(req, res) {
    log.info('getting /api/unsponsored');
    mongo.find({'status': 'Waiting for Sponsor - No Prior Sponsor'}, 'children',
        100, true, function(docs) {
            log.info('got /api/unsponsored');
            res.send(JSON.stringify(docs));
        });
});

app.get('/api/children/:id', function(req, res) {
    log.info('getting /api/children/' + req.params.id);
    mongo.get(req.params.id, 'children', true, function(doc) {
        res.send(JSON.stringify(doc));
    });
});

app.post('/api/donor', function(req, res) {
    log.info('posting to /api/donor ' + JSON.stringify(req.body));
    mongo.insert(req.body, 'donors', function(result) {
        res.send(result);
    });
});

app.put('/api/donor', function(req, res) {
    log.info('putting to /api/donor ' + JSON.stringify(req.body));
    mongo.edit(req.body._id, req.body.changes, 'donors', function(result) {
        res.send(result);
    });
});

app.get('/api/pictures/:id', function(req, res) {
    log.info('getting picture for ' + req.params.id);
    mongo.getPic(req.params.id, 'children', function(buffer) {
        res.send(buffer);
    });
});

app.listen(port, function () {
    log.info('express port listening at localhost:' + port);
});
