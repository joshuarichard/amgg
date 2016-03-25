/* eslint-env node */
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
var cart = require('./data/cart.js');

/** stuff TODO here:
    1. write sendError() function for use all over app.js
       - there is way to much lack of code reuse w/ all of these
         res.status(500) errors, or whatever.
*/

/** api routes:
 *
 * children
 * --------
 * GET /api/v1/children/id/:id - get a child by their id
 * GET /api/v1/children/find/:selector - get children by a selector
 * POST /api/v1/children/islocked/id/:id - check to see if a child is in a cart
 * GET /api/v1/pictures/id/:id - get a child's picture by their doc _id
 *
 * donors (^ denotes required token)
 * ---------------------------------
 * GET /api/v1/donor/auth - get a token with email + password to get donor info
 * ^POST /api/v1/donor/id/:id - get a donor by their id
 * ^PUT /api/v1/donor/id/:id - edit a donor
 * POST /api/v1/donor/sponsor - inserts a donor and sponsors kids (optional)
 * POST /api/v1/donor/create - create a new donor account
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
            // path: './log/app_info.log',
            // period: '1d',  // daily rotation
            // count: 3
        },
        {
            level: 'trace',
            path: './log/app_access.log',
            period: '1d',    // daily rotation
            count: 3
        },
        {
            level: 'error',
            path: './log/app_error.log',
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

var adminEmail = nconf.get('admin:email');

// email strings
var emailHeaderSponsor =  'Thank you for your sponsorship';
var emailBodySponsor = 'You sponsored a child!!!!!';
var emailHeaderRemoveSponsorship = 'Donor requesting removal of their sponsorship.';
var emailBodyRemoveSponsorship = 'A donor is requesting the removal of their sponsorship.';
var emailHeaderDeleteAccount = 'Donor requesting their account be deleted.';
var emailBodyDeleteAccount = 'A donor is requesting their account be deleted.';

// error email strings
var emailErrorHeaderDeletingCart = 'Error deleting donor cart.';
var emailErrorBodyDeletingCart = 'Error deleting donor cart.';
//var emailErrorHeader = 'Error adding sponsor for donor.';
//var emailErrorBody = 'Error adding sponsorship for donor'; // JSON.stringify(donor);

var childCollection = nconf.get('mongo:childCollection');
var donorCollection = nconf.get('mongo:donorCollection');
var cartCollection = nconf.get('mongo:cartCollection');

/*** child api routes ***/

// GET /api/v1/children/id/:id get a child with their id
// TODO: error handling
app.get('/api/v1/children/id/:id', function(req, res) {
    mongo.get(req.params.id, childCollection, true, function(doc) {
        if (doc.hasOwnProperty('err')) {
            res.status(500).send({
                success: false,
                message: doc.err
            });
        } else {
            res.status(200).send(doc);
        }
    });
});

// GET /api/v1/children/find/:selector find a child's document without an id
// TODO: error handling
app.get('/api/v1/children/find/:selector', function(req, res) {
    var selector = query.format(JSON.parse(req.params.selector));

    // get a child pool
    mongo.find(selector, childCollection, 100, true, function(children) {
        var unsponsoredChildrenIds = [];
        for (var key in children) {
            unsponsoredChildrenIds.push(key);
        }

        // get all cart docs...
        mongo.find({}, cartCollection, 10000, false, function(cartdocs) {
            // ...and make an array of all child ids currently in carts
            var idsOfKidsInCarts = [];
            for (var key in cartdocs) {
                var kidsInThisCart = cartdocs[key].niños_patrocinadoras;
                for (var e = 0; e < kidsInThisCart.length; e++) {
                    idsOfKidsInCarts.push(kidsInThisCart[e]);
                }
            }

            // then compare that to the list of ids in the child pool...
            for (var c = 0; c < idsOfKidsInCarts.length; c++) {
                if (children.hasOwnProperty(idsOfKidsInCarts[c])) {
                    // ...and remove them from the child pool if in a cart
                    delete children[idsOfKidsInCarts[c]];
                }
            }

            res.send(children);
        });
    });
});

/** POST /api/v1/children/islocked/id/:id
 *
 * checks to see if a child is currently locked meaning they are currently in a
 * donor's cart. returns true if they are in a cart, false if they are not in a
 * cart.
 *
 * takes the donor_id as the only key/value in the req.body. this donor id is
 * either the donor's actual id in the db or it could be autogenterated. either
 * way send it from the client as 'donor_id'
 */
app.post('/api/v1/children/islocked/id/:id', function(req, res) {
    var child = req.params.id;
    var body = req.body;
    var selector = {
        'donor_id': {
            '$ne': body['donor_id']
        }
    };

    // get all cart docs...
    mongo.find(selector, cartCollection, 10000, false, function(cartdocs) {
        // ...and make an array of all child ids currently in carts
        var idsOfKidsInCarts = [];
        for (var key in cartdocs) {
            var kidsInThisCart = cartdocs[key].niños_patrocinadoras;
            for (var e = 0; e < kidsInThisCart.length; e++) {
                idsOfKidsInCarts.push(kidsInThisCart[e]);
            }
        }

        var isLocked = false;
        // then compare that to the list of ids in the child pool...
        for (var c = 0; c < idsOfKidsInCarts.length; c++) {
            if (child === idsOfKidsInCarts[c]) {
                isLocked = true;
                break;
            }
        }

        if (isLocked === true) {
            res.status(200).send({
                success: true,
                islocked: true
            });
        } else {
            res.status(200).send({
                success: true,
                islocked: false
            });
        }
    });
});

// GET /api/v1/pictures/id/:id get and child's picture with the child's id
app.get('/api/v1/pictures/id/:id', function(req, res) {
    mongo.getPic(req.params.id, childCollection, function(data) {
        if (data.hasOwnProperty('err')) {
            res.status(500).send({
                success: false,
                message: data.err
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

// changeChildrenStatus function to add the 'status': 'sponsored' flag to each kid
function changeChildrenStatus(array, newStatus, callback) {
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
                password.encryptWithSalt(req.body.password, saltDB, function(passwordGiven) {
                    if(passwordGiven !== passwordDB) {
                        res.status(401).send({
                            success: false,
                            message: 'Incorrect password.'
                        });
                    } else {
                        jwt.sign(data, nconf.get('auth:secret'), {expiresIn: '1h'}, function(token) {
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
                    if (data.hasOwnProperty('err')) {
                        res.status(500).send({
                            success: false,
                            message: data.err
                        });
                    } else {
                        delete data['password'];
                        delete data['salt'];
                        res.send(data);
                    }
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
    var changes = req.body.changes;

    if (token) {
        // confirm token sent in request is valid
        jwt.verify(token, nconf.get('auth:secret'), function(err) {
            if (err) {
                res.status(401).send({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else {
                //if there is a password in the changes, encrypt it
                if (typeof changes !== 'undefined') {
                    if (changes.hasOwnProperty('password')) {
                        // hash the password and store it in the db
                        password.encrypt(changes['password'], function(hash, salt) {
                            // fix the donor doc a bit before insertion
                            changes['password'] = hash;
                            changes['salt'] = salt;
                        });
                    }

                    // if it is valid then perform the donor edit
                    mongo.edit(id, changes, donorCollection, function(result) {
                        if (result.hasOwnProperty('err')) {
                            if (result.code === 11000) {
                                res.status(409).send({
                                    success: false,
                                    message: 'Email already exists.'
                                });
                            } else {
                                res.status(500).send({
                                    success: false,
                                    message: result.err
                                });
                            }
                        } else {
                            res.status(200).send({
                                success: true,
                                message: 'Donor edited.'
                            });
                        }
                    });
                } else {
                    res.status(403).send({
                        success: false,
                        message: 'No changes provided.'
                    });
                }
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

    // firstly check if this is real donor or a to-be donor
    // if it's a to-be donor the client will send along an 'assigned_donor_id'
    // if it's a real donor the client will send the donor's actual id
    if (req.body.hasOwnProperty('assigned_donor_id')) {
        // NEW DONOR
        // ---------
        // find the donor's cart in the cart collection
        // and get the children to sponsor
        cart.find(req.body.assigned_donor_id, function(cartdoc) {
            // if the cart is empty then send back 500
            if (JSON.stringify(cartdoc) !== '{}') {
                for (var key in cartdoc) {
                    var realCart = cartdoc[key];
                    var childrenToSponsor = realCart['niños_patrocinadoras'];

                    // hash the password and store it in the db
                    password.encrypt(donor['password'], function(hash, salt) {
                        // fix the donor doc a bit before insertion
                        donor['password'] = hash;
                        donor['salt'] = salt;
                        donor['niños_patrocinadoras'] = childrenToSponsor;

                        // store this as a variable because need to delete from
                        // donor doc before insert.
                        var assignedDonorID = donor['assigned_donor_id'];
                        delete donor['assigned_donor_id'];

                        // now insert donor into db
                        mongo.insert(donor, donorCollection, function(result) {
                            // if mongo confirms success and n = 1 where n is inserted docs
                            if (result.hasOwnProperty('insertedCount')) {
                                if (result.insertedCount === 1) {
                                    // then delete the cart doc
                                    cart.delete(assignedDonorID, function(result) {
                                        if (result === false) {
                                            emailErrorBodyDeletingCart += ' Donor id for the cart is: ' + assignedDonorID;
                                            emailModule.email(adminEmail, emailErrorHeaderDeletingCart, emailErrorBodyDeletingCart, function(didEmail) {
                                                if (didEmail === false) {
                                                    log.error('error emailing admin about error when deleting cart for donor ' + req.body.assigned_donor_id);
                                                }
                                            });
                                        }
                                        if (result.hasOwnProperty('err')) {
                                            res.status(500).send({
                                                success: false,
                                                message: result.err
                                            });
                                        } else {
                                            // recursive function to manage asynch for each id (change status to sponsored)
                                            changeChildrenStatus(childrenToSponsor, 'Sponsored', function() {
                                                // email donor about their successful confirmation
                                                emailModule.email(donor['correo_electrónico'], emailHeaderSponsor, emailBodySponsor, function(didEmail) {
                                                    if(didEmail === true) {
                                                        // and we're done.
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
                                    });
                                } else {
                                    res.status(500).send({
                                        success: false,
                                        message: 'Donor could not be inserted.'
                                    });
                                }
                            } else if (result.code === 11000) {
                                res.status(409).send({
                                    success: false,
                                    message: 'Email already exists.'
                                });
                            } else {
                                res.status(500).send({
                                    success: false,
                                    message: result.errmsg
                                });
                            }
                        });
                    });
                }
            } else {
                res.status(500).send({
                    success: false,
                    message: 'Cart not found.'
                });
            }
        });
    } else {
        // EXISTING DONOR
        // --------------
        // find the donor's cart in the cart collection
        // and get the children to sponsor
        cart.find(req.body.donor_id, function(cartdoc) {
            for (var key in cartdoc) {
                var realCart = cartdoc[key];
                var childrenToSponsor = realCart['niños_patrocinadoras'];

                // get the donor's document from the db using the donor_id the client sent us
                mongo.get(req.body.donor_id, donorCollection, false, function(donor) {
                    if (donor.hasOwnProperty('err')) {
                        res.status(500).send({
                            success: false,
                            message: 'Donor not found.'
                        });
                    } else {
                        if (JSON.stringify(donor) !== '{}') {
                            var saltDB = donor.salt;
                            var passwordDB = donor.password;

                            // encrypt the password and validate it. if not equal
                            // send back a 401
                            password.encryptWithSalt(req.body.password, saltDB, function(passwordGiven) {
                                if(passwordGiven !== passwordDB) {
                                    res.status(401).send({
                                        success: false,
                                        message: 'Incorrect password.'
                                    });
                                } else {
                                    // push all of the new children to the sponsored
                                    // children array...
                                    var childrenSponsored = donor['niños_patrocinadoras'];
                                    for (var d = 0; d < childrenToSponsor.length; d++) {
                                        childrenSponsored.push(childrenToSponsor[d]);
                                    }

                                    // ... and store it in the donor doc
                                    mongo.edit(req.body.donor_id, {'niños_patrocinadoras': childrenSponsored}, donorCollection, function(result) {
                                        if (result.hasOwnProperty('err')) {
                                            res.status(500).send({
                                                success: false,
                                                message: result.err
                                            });
                                        } else {
                                            // then delete the cart doc
                                            cart.delete(req.body.donor_id, function(result) {
                                                if (result === false) {
                                                    emailErrorBodyDeletingCart += ' Donor id for the cart is: ' + req.body.donor_id;
                                                    emailModule.email(adminEmail, emailErrorHeaderDeletingCart, emailErrorBodyDeletingCart, function(didEmail) {
                                                        if (didEmail === false) {
                                                            log.error('error emailing admin about error when deleting cart for donor ' + req.body.donor_id);
                                                        }
                                                    });
                                                }
                                                if (result.hasOwnProperty('err')) {
                                                    res.status(500).send({
                                                        success: false,
                                                        message: result.err
                                                    });
                                                } else {
                                                    // recursive function to manage asynch for each id (change status to sponsored)
                                                    changeChildrenStatus(childrenToSponsor, 'Sponsored', function() {
                                                        // email donor about their successful confirmation
                                                        emailModule.email(donor['correo_electrónico'], emailHeaderSponsor, emailBodySponsor,  function(didEmail) {
                                                            if(didEmail === true) {
                                                                // and we're done.
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
                                            });
                                        }
                                    });
                                }
                            });
                        } else {
                            res.status(401).send({
                                success: false,
                                message: 'Email not found.'
                            });
                        }
                    }
                });
            }
        });
    }
});

// POST /api/v1/donor/create to create a donor
app.post('/api/v1/donor/create', function(req, res) {
    var donor = req.body;

    // hash the password and store it in the db
    password.encrypt(donor['password'], function(hash, salt) {
        // fix the donor doc a bit before insertion
        donor['password'] = hash;
        donor['salt'] = salt;

        // now insert donor into db
        mongo.insert(donor, donorCollection, function(result) {
            // if mongo confirms success and n = 1 where n is inserted docs
            if (result.hasOwnProperty('insertedCount')) {
                if (result.insertedCount === 1) {
                    res.status(200).send({
                        success: true,
                        message: 'Child sponsored.'
                    });
                } else {
                    res.status(500).send({
                        success: false,
                        message: 'Donor could not be inserted.'
                    });
                }
            } else if (result.code === 11000) {
                res.status(409).send({
                    success: false,
                    message: 'Email already exists.'
                });
            } else {
                res.status(500).send({
                    success: false,
                    message: result.errmsg
                });
            }
        });
    });
});

/* POST /api/v1/donor/cart
 *
 * update the cart document with the new cart from the client
 */
app.post('/api/v1/donor/cart', function(req, res) {
    cart.update(req.body.donor_id, req.body.niños_patrocinadoras, function(result) {
        if (result.hasOwnProperty('err')) {
            res.status(500).send({
                success: false,
                message: result.err
            });
        } else {
            res.status(200).send({
                success: true,
                message: 'Cart updated.'
            });
        }
    });
});

/* POST /api/v1/donor/unsponsor
 *
 * emails the admin saying a donor wants to unsponsor a child
 * {
 *   'token': 'token_goes_here',
 *   'donor_id': donor_id,
 *   'child_id': child_id
 * }
 */
app.post('/api/v1/donor/unsponsor', function(req, res) {
    var donorID = req.body.donor_id;
    var token = req.body.token;
    var childID = req.body.child_id;

    // if missing information then throw malformed request
    if (typeof req.body.donor_id === 'undefined' || typeof req.body.child_id === 'undefined') {
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
                    // just too much callback hell to deal with running over 80 chars
                    mongo.get(donorID, donorCollection, false, function(data) {
                        emailBodyRemoveSponsorship += '\n\ndonor: ' + donorID + '\nchild: ' + childID;
                        emailModule.email(data['correo_electrónico'], emailHeaderRemoveSponsorship, emailBodyRemoveSponsorship, function(didEmail) {
                            if(didEmail === true) {
                                // and we're done.
                                res.status(200).send({
                                    success: true,
                                    message: 'Email send. Child removal is processing.'
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
            });
        } else {
            res.status(400).send({
                success: false,
                message: 'No token provided.'
            });
        }
    }
});

/* POST /api/v1/donor/delete
 *
 * emails the admin saying a donor wants to delete their account
 * {
 *   'token': 'token_goes_here',
 *   'donor_id': donor_id
 * }
 */
app.post('/api/v1/donor/delete', function(req, res) {
    var donorID = req.body.donor_id;
    var token = req.body.token;

    // if missing information then throw malformed request
    if (typeof req.body.donor_id === 'undefined') {
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
                    // just too much callback hell to deal with running over 80 chars
                    mongo.get(donorID, donorCollection, false, function(data) {
                        emailBodyDeleteAccount += '\n\ndonor: ' + donorID;
                        emailModule.email(data['correo_electrónico'], emailHeaderDeleteAccount, emailBodyDeleteAccount, function(didEmail) {
                            if(didEmail === true) {
                                // and we're done.
                                res.status(200).send({
                                    success: true,
                                    message: 'Email send. Child removal is processing.'
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
            });
        } else {
            res.status(400).send({
                success: false,
                message: 'No token provided.'
            });
        }
    }
});

https.createServer({ key: fs.readFileSync(nconf.get('keys:key')),
                     cert: fs.readFileSync(nconf.get('keys:cert'))}, app)
      .listen(port, function () {
          log.info('express port listening at localhost:' + port);
      });
