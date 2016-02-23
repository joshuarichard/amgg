var express = require('express');
var fs = require('fs');
var https = require('https');
var path = require('path');
var bodyParser = require('body-parser');
var bunyan = require('bunyan');
var nconf = require('nconf');
var jwt = require('jsonwebtoken');

var mongo = require('./data/mongo.js');
var password = require('./data/password.js');
var query = require('./data/query.js');

var app = express();

nconf.file({
    file: './config.json'
});

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

var childCollection = nconf.get('mongo:childCollection');
var donorCollection = nconf.get('mongo:donorCollection');

/* child api routes */

// GET /api/v1/children/id/:id get a child with their id
app.get('/api/v1/children/id/:id', function(req, res) {
    mongo.get(req.params.id, childCollection, true, function(doc) {
        res.send(doc);
    });
});

// GET /api/v1/children/find/:selector find a child's document
// without an id
app.get('/api/v1/children/find/:selector', function(req, res) {
    var selector = query.format(JSON.parse(req.params.selector));

    mongo.find(selector, childCollection, 100, true,
        function(doc) {
            res.send(doc);
        });
});

// PUT /api/v1/children/id/:id edit child document (mainly for
// donor use case)
// TODO: only client
app.put('/api/v1/children/id/:id', function(req, res) {
    mongo.edit(req.params.id, req.body.changes, childCollection, function() {
        res.send('good');
    });
});

// GET /api/v1/pictures/id/:id get and child's picture with the child's id
app.get('/api/v1/pictures/id/:id', function(req, res) {
    mongo.getPic(req.params.id, childCollection, function(data) {
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
 */
app.post('/api/v1/donor/auth', function(req, res) {
    var email = {'correo_electrónico': req.body['correo_electrónico']};
    // find the donor's email
    // if email === null, send res no email
    mongo.find(email, donorCollection, 1, false, function(data) {
        if (JSON.stringify(data) !== '{}') {
            for (var key in data) {
                var saltDB = data[key].salt;
                var passwordDB = data[key].password;

                // encrypt the password with the salt have stored
                password.encryptWithSalt(req.body.password, saltDB,
                    function(passwordGiven) {
                        if(passwordGiven !== passwordDB) {
                            res.status(401).send({
                                success: false,
                                message: 'Incorrect password.'
                            });
                        } else {
                            jwt.sign(data, nconf.get('auth:secret'),
                                     {expiresIn: '1h'}, function(token) {
                                         res.status(200).send({
                                             success: true,
                                             message: 'Authenticated.',
                                             'id': key,
                                             'token': token
                                         });
                                     });
                        }
                    });
            }
        } else {
            res.status(401).send({
                success: false,
                message: 'Email not found.'
            });
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
                mongo.get(id, donorCollection, false, function(data) {
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
// TODO: only client
app.post('/api/v1/donor/insert', function(req, res) {
    var donor = req.body;
    password.encrypt(donor['password'], function(hash, salt) {
        donor['password'] = hash;
        donor['salt'] = salt;
        mongo.insert(donor, donorCollection, function(result) {
            // if mongo confirms success and n = 1 where n is inserted docs
            if (result.hasOwnProperty('insertedCount')) {
                if (result.insertedCount === 1) {
                    res.status(200).send({
                        success: true,
                        code: 7,
                        message: 'Donor successfully inserted.'
                    });
                }
            } else if (result.code === 11000) {
                res.status(409).send({
                    success: false,
                    code: result.code,
                    errmsg: result.errmsg,
                    message: 'Email already exists.'
                });
            } else {
                res.status(500).send({
                    success: false,
                    code: result.code,
                    errmsg: result.errmsg
                });
            }
        });
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
                mongo.edit(id, req.body.changes, donorCollection,
                    function(result) {
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

https.createServer({ key: fs.readFileSync(nconf.get('keys:key')),
                     cert: fs.readFileSync(nconf.get('keys:cert'))}, app)
      .listen(port, function () {
          log.info('express port listening at localhost:' + port);
      });
