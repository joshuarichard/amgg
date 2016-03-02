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
var emailModule = require('./data/email.js');

/** stuff TODO here:
    1. write sendError() function for use all over app.js
       - there is way to much lack of code reuse w/ all of these
         res.status(500) errors, or whatever.
*/

/** api routes:
 *
 * child api routes
 * ----------------
 * GET /api/v1/children/id/:id - get a child by their id
 * GET /api/v1/children/find/:selector - get children by a selector
 * GET /api/v1/pictures/id/:id - get a child's picture by their doc _id
 *
 * donor api routes (^ denotes required token)
 * -------------------------------------------
 * GET /api/v1/donor/auth - get a token with email + password to get donor info
 * ^POST /api/v1/donor/id/:id - get a donor by their id
 * ^PUT /api/v1/donor/id/:id - edit a donor
 * POST /api/v1/donor/sponsor - inserts a donor and sponsors kids (optional)
 * ^POST /api/v1/donor/unsponsor - unsponsors a child but keeps donor doc
 * ^POST /api/v1/donor/delete - unsponsors all children and deletes donor doc
 */

var app = express();

nconf.file({
    file: './config.json'
});

var port = nconf.get('app:port');

// bunyan options for server logs
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

/*** child api routes ***/

// GET /api/v1/children/id/:id get a child with their id
// TODO: error handling
app.get('/api/v1/children/id/:id', function(req, res) {
    mongo.get(req.params.id, childCollection, true, function(doc) {
        res.status(200).send(doc);
    });
});

// GET /api/v1/children/find/:selector find a child's document without an id
// TODO: error handling
app.get('/api/v1/children/find/:selector', function(req, res) {
    var selector = query.format(JSON.parse(req.params.selector));

    mongo.find(selector, childCollection, 100, true,
        function(doc) {
            res.send(doc);
        });
});

// GET /api/v1/pictures/id/:id get and child's picture with the child's id
app.get('/api/v1/pictures/id/:id', function(req, res) {
    mongo.getPic(req.params.id, childCollection, function(data) {
        if (data.hasOwnProperty('err')) {
            res.status(500).send({
                success: false,
                message: data['err']
            });
        } else {
            res.status(200).send({
                success: true,
                id: req.params.id,
                'data': data
            });
        }
    });
});

// editEachChild function to add the 'status': 'sponsored' flag to each kid
function editEachChild(array, newStatus, callback) {
    array = array.slice(0);

    function editChild() {
        var id = array.pop();
        mongo.edit(id, {'status': newStatus}, childCollection, function() {
            // TODO: handle errors in editing children appropriately with error
            // callbacks which then send the appropriate error res
            if(array.length > 0) {
                editChild();
            } else {
                callback();
            }
        });
    }

    if(array.length > 0) {
        editChild();
    } else {
        callback();
    }
}

/*** donor api routes ***/

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
                    delete data['password'];
                    delete data['salt'];
                    res.send(data);
                });
            }
        });
    } else {
        console.log(token);
        res.status(400).send({
            success: false,
            message: 'No token provided.'
        });
    }
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

    if (token) {
        // confirm token sent in request is valid
        jwt.verify(token, nconf.get('auth:secret'), function(err) {
            if (err) {
                res.status(401).send({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else {
                // if it is valid then perform the donor edit
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

// POST /api/v1/donor/insert to insert donor
app.post('/api/v1/donor/sponsor', function(req, res) {
    var donor = req.body;

    password.encrypt(donor['password'], function(hash, salt) {
        donor['password'] = hash;
        donor['salt'] = salt;
        mongo.insert(donor, donorCollection, function(result) {
            // if mongo confirms success and n = 1 where n is inserted docs
            if (result.hasOwnProperty('insertedCount')) {
                if (result.insertedCount === 1) {
                    // TODO: then delete cart collection entry?

                    // recursive function to manage asynch for each id
                    /* eslint-disable */
                    editEachChild(donor['niños_patrocinadoras'], 'Sponsored', function() {
                        /* eslint-enable */
                        emailModule.email(donor['correo_electrónico'],
                            function(didEmail) {
                                if(didEmail === true) {
                                    res.status(200).send({
                                        success: true,
                                        message: 'Child sponsored.'
                                    });
                                } else {
                                    res.status(500).send({
                                        success: false,
                                        message: 'An error occured on email.'
                                    });
                                }
                            });
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

/* POST /api/v1/donor/unsponsor
 *
 * to delete a donor's sponsorship of a child.
 *
 * remove from donor's list of sponsored children and set child status back to
 * unsponsored
 *
 * takes as a body:
 *
 * {
 *  "id": "donor_id",
 *  "token": "donor_token",
 *  "child_unsponsoring": "child_id"
 * }
 */
app.post('/api/v1/donor/unsponsor', function(req, res) {
    var donorID = req.body.id;
    var token = req.body.token;
    var childIDtoUnsponsor = req.body.child_unsponsoring;

    // if missing information then throw malformed request
    if (typeof req.body.id === 'undefined' ||
        typeof req.body.child_unsponsoring === 'undefined') {
        res.status(400).send({
            success: false,
            message: 'Malformed request.'
        });
    } else {
        if (token) {
            // confirm token sent in request is valid
            jwt.verify(token, nconf.get('auth:secret'), function(err) {
                if (err) {
                    res.status(401).send({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {
                    // get the donor's information
                    /* eslint-disable */
                    // just too much callback hell to deal with running over 80 chars
                    mongo.get(donorID, donorCollection, false, function(data) {
                        // if the donor has the children they're sponsoring
                        if (data.hasOwnProperty('niños_patrocinadoras') &&
                            data['niños_patrocinadoras'].length > 0) {
                            var kids = data['niños_patrocinadoras'];

                            // then remove that child from their array of sponsored children
                            if (kids.indexOf(childIDtoUnsponsor) !== -1) {
                                kids.splice(kids.indexOf(childIDtoUnsponsor), 1);

                                var changes = {
                                    'niños_patrocinadoras': kids
                                };

                                // put the kids array back into the donor document
                                mongo.edit(donorID, changes, donorCollection, function(donorEditResult) {
                                    if (!donorEditResult.hasOwnProperty('err')) {
                                        changes = {'status': 'Waiting for Sponsor - Discontinued'};
                                        mongo.edit(childIDtoUnsponsor, changes, childCollection, function(childEditResult) {
                                            if (!childEditResult.hasOwnProperty('err')) {
                                                res.status(200).send({
                                                    success: true,
                                                    message: 'Child unsponsored.'
                                                });
                                            } else {
                                                res.status(500).send({
                                                    sucess: false,
                                                    message: donorEditResult['err']
                                                });

                                            }
                                        });
                                    } else {
                                        res.status(500).send({
                                            sucess: false,
                                            message: donorEditResult['err']
                                        });
                                    }
                                });
                            } else {
                                res.status(400).send({
                                    success: false,
                                    message: 'Donor is not sponsoring this child.'
                                });
                            }
                        } else {
                            res.status(400).send({
                                success: false,
                                message: 'Donor is not sponsoring any children.'
                            });
                        }

                    });
                }
            });
        } else {
            res.status(400).send({
                success: false,
                message: 'No token provided.'
            });
        }
      }
      /* eslint-enable */
});

/* POST /api/v1/donor/delete
 *
 * delete donor document and edit all child docs who they were sponsoring and
 * change their status back to unsponsored
 */
app.post('/api/v1/donor/delete', function(req, res) {
    // delete donor function
    function deleteDonor() {
        mongo.delete(req.body.id, donorCollection,
            function(result) {
                if (result.hasOwnProperty('err')) {
                    res.status(500).send({
                        success: false,
                        message: result['err']
                    });
                } else {
                    res.status(200).send({
                        success: true,
                        message: 'Donor deleted.'
                    });
                }
            });
    }

    // get the donor info from the db
    mongo.get(req.body.id, donorCollection, false, function(data) {
        // recursive function to manage asynch for each id
        if (data.hasOwnProperty('niños_patrocinadoras')) {
            // for each child the donor is sponsoring, add the "unsponsored"
            // flag back into their db
            editEachChild(data['niños_patrocinadoras'],
                          'Waiting for Sponsor - Discontinued', function() {
                              deleteDonor();
                          });
        } else {
            // donor has no children they're sponsoring, just delete the donor
            deleteDonor();
        }

    });
});

https.createServer({ key: fs.readFileSync(nconf.get('keys:key')),
                     cert: fs.readFileSync(nconf.get('keys:cert'))}, app)
      .listen(port, function () {
          log.info('express port listening at localhost:' + port);
      });
