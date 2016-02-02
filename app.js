var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongo = require('./data/mongo.js');
var bunyan = require('bunyan');
var nconf = require('nconf');
var jwt = require('jsonwebtoken');

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

app.get('/api/v1/children/:id', function(req, res) {
    mongo.get(req.params.id, 'children', true, function(doc) {
        res.send(doc);
    });
});

app.get('/api/v1/findchild/:selector', function(req, res) {
    var selector = JSON.parse(req.params.selector);
    if (selector.hasOwnProperty('años')) {
        selector['años'] = parseInt(selector['años']);
    }
    mongo.find(selector, 'children', 100, true,
        function(doc) {
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
        var dataJSON = { 'data': data };
        res.send(dataJSON);
    });
});

// donor api routes
app.post('/api/v1/donor/auth', function(req, res) {
    var email = {'correo_electrónico': req.body.email};
    mongo.find(email, 'donors', 1, false, function(data) {
        for (var key in data) {
            if(data[key].password !== req.body.password) {
                res.status(401).send({
                    success: false,
                    message: 'Incorrect password.'
                });
            } else {
                jwt.sign(data, nconf.get('auth:secret'), {expiresIn: '1h'},
                    function(token) {
                        res.status(200).send({
                            success: true,
                            message: 'Authenticated.',
                            'id': key,
                            'token': token
                        });
                    });
            }
        }
    });
});

app.post('/api/v1/donor/id/:id', function(req, res) {
    var token = req.body.token;
    var id = req.params.id;

    // confirm token sent in request is valid
    if (token) {
        jwt.verify(token, nconf.get('auth:secret'), function(err) {
            if (err) {
                res.status(401).send({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else {
                // if it is valid then perform the donor find
                mongo.get(id, 'donors', false, function(data) {
                    res.send({
                        success: true,
                        'data': data
                    });
                });
            }
        });
    } else {
        res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
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

app.get('/api/v1/finddonor/:selector', function(req, res) {
    mongo.find(JSON.parse(req.params.selector), 'donors', 1, false,
        function(doc) {
            res.send(doc);
        });
});

app.listen(port, function () {
    log.info('express port listening at localhost:' + port);
});
