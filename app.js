/* eslint-env node */
var express = require('express');
var fs = require('fs');
var https = require('https');
var path = require('path');
var bodyParser = require('body-parser');
var bunyan = require('bunyan');
var nconf = require('nconf');
var jwt = require('jsonwebtoken');
var request = require('request');
var crypto = require('crypto');
var querystring = require('querystring');

var mongo = require('./data/mongo.js');
var password = require('./data/password.js');
var query = require('./data/query.js');
var emailModule = require('./data/email.js');
var cart = require('./data/cart.js');

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
 * GET /api/v1/donor/auth - get a token with email + password
 * ^POST /api/v1/donor/id/:id - get a donor by their id
 * ^PUT /api/v1/donor/id/:id - edit a donor
 * ^POST /api/v1/donor/sponsor - sponsors kids
 * POST /api/v1/donor/create - create a new donor account
 * POST /api/v1/donor/cart - updates donor cart
 * GET /api/v1/donor/cart/id/:id - gets donor cart from donor id
 * ^POST /api/v1/donor/unsponsor - sends email to admin notifying unsponsorship
 * ^POST /api/v1/donor/delete - sends email to admin notifying account deletion
 * ^POST /api/v1/donor/letter - sends letter to admin from donor to kid
 * POST /api/v1/donor/reset - resets donor password and sends them an email with it
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

var eventlog = bunyan.createLogger({
    name: 'app',
    streams: [
        {
            level: 'info',
            path: './log/event_info.log'
        },
        {
            level: 'error',
            path: './log/event_error.log',
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


// email strings
//var emailHeaderSponsor =  'Thank you for your sponsorship';
//var emailBodySponsor = 'You sponsored a child!!!!!';
var emailHeaderRemoveSponsorship = 'Donor requesting removal of their sponsorship.';
var emailBodyRemoveSponsorship = 'A donor is requesting the removal of their sponsorship.';
var emailHeaderDeleteAccount = 'Donor requesting their account be deleted.';
var emailBodyDeleteAccount = 'A donor is requesting their account be deleted.';
var emailHeaderTempPassword = 'Temporary password for AMGG';
var emailBodyTempPassword = 'Your temporary password is: ';
var emailHeaderLetter = 'A Letter has Arrived';
var emailBodyLetter = ' Contents of the Letter';

// error email strings
//var emailErrorHeader = 'Error adding sponsor for donor.';
//var emailErrorBody = 'Error adding sponsorship for donor'; // JSON.stringify(donor);

var ADMIN_EMAIL = nconf.get('admin:email');
var CHILD_COLLECTION = nconf.get('mongo:childCollection');
var DONOR_COLLECTION = nconf.get('mongo:donorCollection');
var CART_COLLECTION = nconf.get('mongo:cartCollection');
var CHILD_COST = nconf.get('amgg:childCost');
var TOKEN_KEY = nconf.get('keys:token');
var BANK_PUBLIC_KEY = nconf.get('keys:bankPublic');
var BANK_PRIVATE_KEY = nconf.get('keys:bankPrivate');
var SSL_KEY = nconf.get('keys:sslKey');
var SSL_CERT = nconf.get('keys:sslCert');
var AMGG_USERNAME = nconf.get('keys:username');

/*** child api routes ***/

// GET /api/v1/children/id/:id get a child with their id
app.get('/api/v1/children/id/:id', function(req, res) {
    mongo.get(req.params.id, CHILD_COLLECTION, true, function(doc) {
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
app.get('/api/v1/children/find/:selector', function(req, res) {
    var selector = query.format(JSON.parse(req.params.selector));

    // get a child pool
    mongo.find(selector, CHILD_COLLECTION, 100, true, function(children) {
        var unsponsoredChildrenIds = [];
        for (var key in children) {
            unsponsoredChildrenIds.push(key);
        }

        // get all cart docs...
        mongo.find({}, CART_COLLECTION, 10000, false, function(cartdocs) {
            // ...and make an array of all child ids currently in carts
            var idsOfKidsInCarts = [];
            for (var key in cartdocs) {
                if (cartdocs[key].hasOwnProperty('kids_in_cart')) {
                    var kidsInThisCart = cartdocs[key].kids_in_cart;
                    for (var e = 0; e < kidsInThisCart.length; e++) {
                        idsOfKidsInCarts.push(kidsInThisCart[e]);
                    }
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
    mongo.find(selector, CART_COLLECTION, 10000, false, function(cartdocs) {
        // ...and make an array of all child ids currently in carts
        var idsOfKidsInCarts = [];
        for (var key in cartdocs) {
            if (cartdocs[key].hasOwnProperty('kids_in_cart')) {
                var kidsInThisCart = cartdocs[key].kids_in_cart;
                for (var e = 0; e < kidsInThisCart.length; e++) {
                    idsOfKidsInCarts.push(kidsInThisCart[e]);
                }
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
    mongo.getPic(req.params.id, CHILD_COLLECTION, function(data) {
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
        mongo.edit(id, {'status': newStatus}, CHILD_COLLECTION, function() {
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
    var email = {'correo_electrónico': req.body['email']};
    // find the donor's email
    // if email === null, send res no email
    mongo.find(email, DONOR_COLLECTION, 1, false, function(data) {
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
                        jwt.sign(data, TOKEN_KEY, {expiresIn: '5h'}, function(token) {
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
        jwt.verify(token, TOKEN_KEY, function(err) {
            if (err) {
                res.status(401).send({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else {
                // if it is valid then perform the donor get
                mongo.get(id, DONOR_COLLECTION, false, function(data) {
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
        jwt.verify(token, TOKEN_KEY, function(err) {
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
                    mongo.edit(id, changes, DONOR_COLLECTION, function(result) {
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

// equalArrays used for /api/v1/donor/sponsor... here temporarily until
// we move all of this crap out of app.js
function equalArrays(arr1, arr2) {
    if(arr1.length !== arr2.length)
        return false;
    for(var i = arr1.length; i--;) {
        if(arr1[i] !== arr2[i])
            return false;
    }
    return true;
}

// POST /api/v1/donor/sponsor to sponsor a child[ren]
app.post('/api/v1/donor/sponsor', function(req, res) {
    var donor = req.body;

    if (donor.token) {
        // confirm token sent in request is valid
        jwt.verify(donor.token, TOKEN_KEY, function(err) {
            if (!err) {
                // then define some variables...

                // bank parameters from the client
                var donor_id = donor.donor_id;
                var children = donor.child_id;
                var ccnumber = donor.ccnumber;
                var cvv = donor.cvv;
                var expiration = donor.expiration.replace('/', '');

                // other bank parameters
                var amount = children.length * CHILD_COST;
                var user = AMGG_USERNAME;
                var url = 'https://paycom.credomatic.com/PayComBackEndWeb/common/requestPaycomService.go';

                // calculated bank parameters
                var orderid = donor_id + '-' + children.toString().replace(/,/g, '-');
                var timeNow = Math.floor(new Date().getTime() / 1000);
                var hash = crypto.createHash('md5')
                                 .update(orderid + '|' +
                                         amount + '|' +
                                         timeNow + '|' +
                                         BANK_PRIVATE_KEY)
                                 .digest('hex');

                mongo.get(donor_id, DONOR_COLLECTION, false, function(donordoc) {
                    var firstname = donordoc.nombre;
                    var lastname = donordoc.apellido;
                    var address1 = donordoc.calle;
                    var city = donordoc.ciudad;
                    var country = donordoc.país;
                    var phone = donordoc.teléfono;
                    var email = donordoc.correo_electrónico;
                    // var zip = donordoc.zip?;

                    var bankData = {
                        username: user,
                        type: 'auth',
                        key_id: BANK_PUBLIC_KEY,
                        hash: hash,
                        time: timeNow,
                        amount: amount,
                        orderid: orderid,
                        processor_id: null,
                        ccnumber: ccnumber,
                        ccexp: expiration,
                        cvv: cvv,
                        firstname: firstname,
                        lastname: lastname,
                        address1: address1,
                        city: city,
                        country: country,
                        phone: phone,
                        email: email,
                        redirect: 'http://localhost/'
                    };

                    request.post({ url: url, form: bankData }, function(error, response) {
                        var location = response.headers.location;
                        var start = location.indexOf('?') + 1;
                        var qs = location.substr(start);

                        var bankResult = querystring.parse(qs);

                        var responseHash = bankResult.hash;
                        var responseCode = bankResult.response;
                        var transactionid = bankResult.transactionid;
                        var avsresponse = bankResult.avsresponse;
                        var cvvresponse = bankResult.cvvresponse;
                        var time = bankResult.time;
                        var computedResponseHash = crypto.createHash('md5')
                                                         .update(orderid + '|' +
                                                                 amount + '|' +
                                                                 responseCode + '|' +
                                                                 transactionid + '|' +
                                                                 avsresponse + '|' +
                                                                 cvvresponse + '|' +
                                                                 time + '|' +
                                                                 BANK_PRIVATE_KEY)
                                                         .digest('hex');

                        if (responseHash === computedResponseHash) {
                            if (responseCode === '2') {
                                // find the donor's cart in the cart collection
                                // and get the children to sponsor
                                cart.find(donor_id, function(cartdoc) {
                                    for (var key in cartdoc) {
                                        var cartKids = cartdoc[key].kids_in_cart;
                                        var orderIDarray = orderid.split('-');

                                        var orderKids = [];
                                        for (var e = 1; e < orderIDarray.length; e++) {
                                            orderKids.push(orderIDarray[e]);
                                        }

                                        if ((equalArrays(cartKids, orderKids) === true) && (cartdoc[key].request_to_pay === 'true')) {
                                            // ... and store it in the donor doc
                                            var donorPayments = [];
                                            if (donordoc.hasOwnProperty('transacciones')) {
                                                donorPayments = donordoc.transacciones;
                                            }
                                            bankResult['time'] = new Date(parseInt(bankResult.time * 1000));
                                            donorPayments.push(bankResult);

                                            var donorKids = [];
                                            if (donordoc.hasOwnProperty('niños_patrocinadoras')) {
                                                donorKids = donordoc.niños_patrocinadoras;
                                            }

                                            for (var kid = 0; kid < cartKids.length; kid++) {
                                                donorKids.push(cartKids[kid]);
                                            }
                                            mongo.edit(donor_id, {'niños_patrocinadoras': donorKids, 'transacciones': donorPayments}, DONOR_COLLECTION, function(result) {
                                                if (result.hasOwnProperty('err')) {
                                                    // log lack of editing and response appropriately...
                                                    eventlog.error('Error editing database. Card charged but no edits were made on the donor document. Check to see the children are correctly marked as sponsored. Donor changes: ' + JSON.stringify({'niños_patrocinadoras': donorKids, 'transacciones': donorPayments}));
                                                }
                                                // then delete the cart doc
                                                cart.delete(donor_id, function() {
                                                    // recursive function to manage asynch for each id (change status to sponsored)
                                                    changeChildrenStatus(cartKids, 'Sponsored', function() {
                                                        // and we're done.
                                                        res.status(200).send({
                                                            success: true,
                                                            message: 'Child Sponsored.'
                                                        });
                                                    });
                                                });
                                            });
                                        }
                                    }
                                });
                            } else {
                                res.status(500).send({
                                    success: false,
                                    message: 'Unsuccessful sponsorship. Card not charged.'
                                });
                            }
                        } else {
                            res.status(500).send({
                                success: false,
                                message: 'Unsuccessful sponsorship. Card not charged.'
                            });
                        }
                    });
                });
            } else {
                res.status(401).send({
                    success: false,
                    message: 'Failed to authenticate token.'
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

// POST /api/v1/donor/create to create a donor
app.post('/api/v1/donor/create', function(req, res) {
    var donor = req.body;

    // hash the password and store it in the db
    password.encrypt(donor['password'], function(hash, salt) {
        // fix the donor doc a bit before insertion
        donor['password'] = hash;
        donor['salt'] = salt;

        // now insert donor into db
        mongo.insert(donor, DONOR_COLLECTION, function(result) {
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
    cart.update(req.body.donor_id, req.body.kids_in_cart, req.body.request_to_pay, function(result) {
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

app.get('/api/v1/donor/cart/id/:id', function(req, res) {
    cart.find(req.params.id, function(cartdoc) {
        if (cartdoc.hasOwnProperty('err')) {
            res.status(500).send({
                success: false,
                message: cartdoc.err
            });
        } else {
            res.status(200).send(cartdoc);
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
            jwt.verify(token, TOKEN_KEY, function(err) {
                if (err) {
                    res.status(401).send({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {
                    emailModule.email(ADMIN_EMAIL, emailHeaderRemoveSponsorship, emailBodyRemoveSponsorship + '\n\ndonor: ' + donorID + '\nchild: ' + childID, function(didEmail) {
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
            jwt.verify(token, TOKEN_KEY, function(err) {
                if (err) {
                    res.status(401).send({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {
                    emailModule.email(ADMIN_EMAIL, emailHeaderDeleteAccount, emailBodyDeleteAccount + '\n\ndonor: ' + donorID, function(didEmail) {
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

/* POST /api/v1/donor/letter
 *
 * emails the admin with a letter to a child
 * {
 *   'token': 'token_goes_here',
 *   'donor_id': donor_id,
 *   'child_id': child_id,
 *   'letterText': letter_text
 * }
 */
app.post('/api/v1/donor/letter', function(req, res) {
    var donorID = req.body.donor_id;
    var token = req.body.token;
    var childID = req.body.child_id;
    var letterText = req.body.letter_text;

     // if missing information then throw malformed request
    if (typeof req.body.donor_id === 'undefined' || typeof req.body.child_id === 'undefined' ) {
        res.status(400).send({
            success: false,
            message: 'Malformed request.'
        });
    } else {
        if (token) {
             // confirm token sent in request is valid
            jwt.verify(token, TOKEN_KEY, function(err) {
                if (err) {
                    res.status(401).send({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {
                    emailModule.email(ADMIN_EMAIL, emailHeaderLetter, emailBodyLetter + '\n\ndonor: ' + donorID + '\nchild: ' + childID + '\nletter: ' + letterText, function(didEmail) {
                        if(didEmail === true) {
                            // and we're done.
                            res.status(200).send({
                                success: true,
                                message: 'Letter Sent!'
                            });
                        } else {
                            res.status(500).send({
                                success: false,
                                message: 'An error occured on email.'
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
});

/* POST /api/v1/donor/reset
 *
 * emails the user with a temp password they can use to login with
 * {
 *   'correo_electrónico': 'donor_email'
 * }
 */
app.post('/api/v1/donor/reset', function(req, res) {
    // firstly create a selector based on the email to get the donor's doc
    var selector = {
        'correo_electrónico': req.body.correo_electrónico
    };

    // find the doc
    mongo.find(selector, DONOR_COLLECTION, 10000, true, function(donor) {
        for (var id in donor) {
            // get the doc with the id
            mongo.get(id, DONOR_COLLECTION, false, function(data) {
                // generate a random password and encrypt it...
                var tempPassword = Math.random().toString(36).slice(-8);
                password.encrypt(tempPassword, function(hash, salt) {
                    // fix the donor doc a bit before insertion
                    var changes = {};
                    changes['password'] = hash;
                    changes['salt'] = salt;

                    // ... then store it in their donor doc
                    mongo.edit(id, changes, DONOR_COLLECTION, function(result) {
                        if (result.hasOwnProperty('err')) {
                            res.status(500).send({
                                success: false,
                                message: 'DB error.'
                            });
                        } else {
                            // construct the email with the donor's new password and send the email
                            emailModule.email(data['correo_electrónico'], emailHeaderTempPassword, emailBodyTempPassword + tempPassword, function() {
                                res.status(200).send({
                                    success: true,
                                    message: 'Donor password reset.'
                                });
                            });
                        }
                    });
                });
            });
        }

    });
});

https.createServer({ key: fs.readFileSync(SSL_KEY),
                     cert: fs.readFileSync(SSL_CERT)}, app)
      .listen(port, function () {
          log.info('express port listening at localhost:' + port);
      });
