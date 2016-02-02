var express = require('express');
var fs = require('fs');
var https = require('https');
var path = require('path');
var bodyParser = require('body-parser');
var mongo = require('./data/mongo.js');
var bunyan = require('bunyan');
var nconf = require('nconf');
var jwt = require('jsonwebtoken');

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

var app = express();

var port = nconf.get('app:port');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.redirect('index.html');
});

/* child api routes */

// GET /api/v1/children/id/:id get a child with their id
app.get('/api/v1/children/id/:id', function(req, res) {
    mongo.get(req.params.id, 'children', true, function(doc) {
        res.send(doc);
    });
});

// GET /api/v1/children/find/:selector find a child's document without an id
app.get('/api/v1/children/find/:selector', function(req, res) {
    var selector = JSON.parse(req.params.selector);
    if (selector.hasOwnProperty('años')) {
        selector['años'] = parseInt(selector['años']);
    }
    mongo.find(selector, 'children', 100, true,
        function(doc) {
            res.send(doc);
        });
});

// PUT /api/v1/children/id/:id edit child document (mainly for donor use case)
app.put('/api/v1/children/id/:id', function(req, res) {
    mongo.edit(req.params.id, req.body.changes, 'children', function() {
        res.send('good');
    });
});

// GET /api/v1/pictures/id/:id get and child's picture with the child's id
app.get('/api/v1/pictures/id/:id', function(req, res) {
    mongo.getPic(req.params.id, 'children', function(data) {
        var dataJSON = { 'data': data };
        res.send(dataJSON);
    });
});

/* donor api routes */

/* POST /api/v1/donor/auth for getting a json web token from donor credentials
 * {
 *   "email": "donor@email.com",
 *   "password": "plaintext password"
 * }
 *
 * - should the donor passwords be hashed on the client side? or is it ok
 * because everything will be covered by SSL?
 */
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

/* POST /api/v1/donor/id/:id for getting donor doc with json web token
 * {
 *   "token": "token_goes_here"
 * }
 */
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
                // if it is valid then perform the donor get
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

// POST /api/v1/donor/insert to insert donor
app.post('/api/v1/donor/insert', function(req, res) {
    mongo.insert(req.body, 'donors', function(result) {
        res.send(result);
    });
});

/* PUT /api/v1/donor/id/:id to edit a donor
 * {
 *   "token": "token_goes_here",
 *   "changes": {
 *        "name": "new_name",
 *        "email": "new_email"
 *   }
 * }
 */
app.put('/api/v1/donor/id/:id', function(req, res) {
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
                // if it is valid then perform the donor get
                mongo.edit(id, req.body.changes, 'donors', function(result) {
                    if (result.result.ok === 1) {
                        res.status(200).send({
                            success: true,
                            message: 'Donor edited.'
                        });
                    } else {
                        res.status(500).send({
                            success: false,
                            message: 'DB error.'
                        });
                    }
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

// GET /api/v1/donor/find/:selector to find a donor without an id - secure???
app.get('/api/v1/donor/find/:selector', function(req, res) {
    mongo.find(JSON.parse(req.params.selector), 'donors', 1, false,
        function(doc) {
            res.send(doc);
        });
});

https.createServer({ key: fs.readFileSync('./keys/key.pem'),
                     cert: fs.readFileSync('./keys/cert.pem')}, app)
      .listen(port, function () {
          log.info('express port listening at localhost:' + port);
      });
