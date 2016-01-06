var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongo = require('./data/mongo.js');
var bunyan = require('bunyan');

var app = express();

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
        100, function(docs) {
            res.send(JSON.stringify(docs));
        });
});

app.get('/api/children/:id', function(req, res) {
    log.info('getting /api/children/' + req.params.id);
    mongo.get(req.params.id, 'children', function(doc) {
        res.send(JSON.stringify(doc));
    });
});

app.listen(3000, function () {
    log.info('express port listening at localhost:3000');
});
