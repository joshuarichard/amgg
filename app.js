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
var argv = require('minimist')(process.argv.slice(2));

var mongo = require('./data/mongo.js');
var password = require('./data/password.js');
var query = require('./data/query.js');
var emailModule = require('./data/email.js');
var cart = require('./data/cart.js');

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
            level: 'debug',
            path: './log/app.log',
            period: '1d',
            count: 3
        },
        {
            level: 'trace',
            path: './log/app.trace.log',
            period: '1d',
            count: 3
        }
    ]
});

var eventlog = bunyan.createLogger({
    name: 'app',
    streams: [
        {
            level: 'info',
            path: './log/event.info.log',
            period: '1d',
            count: 3
        },
        {
            level: 'error',
            path: './log/event.error.log',
            period: '1d',   // daily rotation
            count: 10
        }
    ]
});

log.info('Setting up app...');

var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.redirect('index.html');
});

log.info('Accessing config file (./config.json)...');

nconf.file({
    file: './config.json'
});

log.info('Using password to decrypt bank credentials...');

var algorithm = 'aes-256-ctr';
var argvPassword = argv.password;

if (typeof argvPassword === 'undefined') {
    log.error('Add password with the --password option.');
    process.exit();
}

// encrypt and decrypt functions taken from:
// http://lollyrock.com/articles/nodejs-encryption/
function decrypt(text, pass) {
    var decipher = crypto.createDecipher(algorithm, pass);
    var decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

var decryptedBank = decrypt(nconf.get('keys:credomatic'), argv.password);
decryptedBank = decryptedBank.split('|');
var credomaticHash = crypto.createHash('md5')
                           .update(decryptedBank[0] + '|' +
                                   decryptedBank[1] + '|' +
                                   decryptedBank[2])
                           .digest('hex');

if (credomaticHash !== decryptedBank[3]) {
    log.error('Incorrect password given at startup.');
    process.exit();
}

var decryptedEmail = decrypt(nconf.get('admin:email'), argv.password);
decryptedEmail = decryptedEmail.split('|');
var emailHash = crypto.createHash('md5')
                      .update(decryptedEmail[0] + '|' +
                              decryptedEmail[1])
                      .digest('hex');

if (emailHash !== decryptedEmail[2]) {
    log.error('Incorrect password given at startup. Bank worked but email didn\'t.');
    process.exit();
}

log.info('Setting constants...');

var APP_PORT = nconf.get('app:port');
var BANK_PUBLIC_KEY = decryptedBank[0];
var BANK_PRIVATE_KEY = decryptedBank[1];
var AMGG_USERNAME = decryptedBank[2];
var ADMIN_EMAIL = decryptedEmail[0];
var CHILD_COLLECTION = nconf.get('mongo:childCollection');
var DONOR_COLLECTION = nconf.get('mongo:donorCollection');
var CART_COLLECTION = nconf.get('mongo:cartCollection');
var CHILD_COST = nconf.get('amgg:childCost');
var TOKEN_KEY = nconf.get('keys:token');
var SSL_KEY_PATH = nconf.get('keys:sslkey');
var SSL_CERT_PATH = nconf.get('keys:certificate');
var SSL_CA_PATH_1 = nconf.get('keys:ca')[0];
var SSL_CA_PATH_2 = nconf.get('keys:ca')[1];
var SSL_CA_PATH_3 = nconf.get('keys:ca')[2];

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

/** api routes:
 *
 * children
 * --------
 * GET /api/v1/children/id/:id - get a child by their id
 * GET /api/v1/children/find/:selector - get children by a selector
 * POST /api/v1/children/islocked/id/:id - check to see if a child is in a cart
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
 * ^DELETE /api/v1/donor/unsponsor - sends email to admin notifying unsponsorship
 * ^DELETE /api/v1/donor/delete - sends email to admin notifying account deletion
 * ^POST /api/v1/donor/letter - sends letter to admin from donor to kid
 * POST /api/v1/donor/reset - resets donor password and sends them an email with it
 */

/*** child api routes ***/

// GET /api/v1/children/id/:id get a child with their id
app.get('/api/v1/children/id/:id', function(req, res) {
    log.info('GET /api/v1/children/id/' + req.params.id);
    mongo.get(req.params.id, CHILD_COLLECTION, true, function(doc) {
        if (doc.hasOwnProperty('err')) {
            log.error({res: {'status': 500, success: false, message: doc.err}}, 'GET /api/v1/children/id/' + req.params.id);
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
    log.info('GET /api/v1/children/find/' + req.params.selector);
    var selector = query.format(JSON.parse(req.params.selector));

    // get a child pool
    mongo.find(selector, CHILD_COLLECTION, 20, true, function(children) {
        var matches = [];
        for (var b = 0; b < children.length; b++) {
            matches.push(children[b]._id);
        }

        // get all cart docs...
        mongo.find({}, CART_COLLECTION, 10000, false, function(cartdocs) {
            // ...and make an array of all child ids currently in carts
            var idsOfKidsInCarts = [];
            for (var w = 0; w < cartdocs.length; w++) {
                if (cartdocs[w].hasOwnProperty('kids_in_cart')) {
                    var kidsInThisCart = cartdocs[w].kids_in_cart;
                    for (var e = 0; e < kidsInThisCart.length; e++) {
                        idsOfKidsInCarts.push(kidsInThisCart[e]);
                    }
                }
            }

            // then compare that to the list of ids in the child pool...
            for (var c = 0; c < matches.length; c++) {
                for (var q = 0; q < idsOfKidsInCarts.length; q++) {
                    if (matches[c] == idsOfKidsInCarts[q]) {
                        for (var s = 0; s < children.length; s++) {
                            if (children[s]._id == idsOfKidsInCarts[q]) {
                                children.splice(s, 1);
                                break;
                            }
                        }
                        break;
                    }
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
    log.info('POST /api/v1/children/islocked/id/' + req.params.id);
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
        if (cartdocs.hasOwnProperty('err')) {
            res.status(500).send({
                success: false,
                islocked: true
            });
        } else {
            if (JSON.stringify(cartdocs) !== '[]') {
                if (cartdocs[0].hasOwnProperty('kids_in_cart')) {
                    var kidsInThisCart = cartdocs[0].kids_in_cart;
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
            } else {
                res.status(200).send({
                    success: true,
                    islocked: false
                });
            }
        }
    });
});

// changeChildrenStatus function to add the 'estado': 'sponsored' flag to each kid
function changeChildrenStatus(array, newStatus, callback) {
    array = array.slice(0);

    function editChild() {
        var id = array.pop();
        mongo.edit(id, {'estado': newStatus}, CHILD_COLLECTION, function(result) {
            if (result.hasOwnProperty('err')) {
                eventlog.error('Child ' + id + ' status not set to ' + newStatus + '. Error: ' + result);
            } else {
                eventlog.info('Child ' + id + ' status set to ' + newStatus + '.');
            }

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
    log.info('POST /api/v1/donor/auth');
    var email = {'correo_electrónico': req.body['email']};
    // find the donor's email
    // if email === null, send res no email
    mongo.find(email, DONOR_COLLECTION, 1, false, function(data) {
        if (JSON.stringify(data) !== '[]') {
            var saltDB = data[0].salt;
            var passwordDB = data[0].password;

            // encrypt the password with the salt have stored
            password.encryptWithSalt(req.body.password, saltDB, function(passwordGiven) {
                if(passwordGiven !== passwordDB) {
                    res.status(401).send({
                        success: false,
                        message: 'Incorrect password.'
                    });
                } else {
                    jwt.sign(data, TOKEN_KEY, {expiresIn: '1h'}, function(token) {
                        res.status(200).send({
                            success: true,
                            message: 'Authenticated.',
                            'id': data[0]._id,
                            'token': token
                        });
                    });
                }
            });
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
    log.info('POST /api/v1/donor/id/' + req.params.id);
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
                        delete data[0].password;
                        delete data[0].salt;
                        delete data[0].transacciones;
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
    log.info('PUT /api/v1/donor/id/' + req.params.id);
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
                            eventlog.error('Internal server error. Donor ' + id + ' not edited with changes ' + changes + '. Error: ' + result);
                            res.status(500).send({
                                success: false,
                                message: result.err
                            });
                        } else {
                            eventlog.info('Donor ' + id + ' edited with changes ' + changes);
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
    log.info('POST /api/v1/donor/sponsor');
    var donor = req.body;

    if (donor.token) {
        // confirm token sent in request is valid
        jwt.verify(donor.token, TOKEN_KEY, function(err) {
            if (!err) {
                // then define some variables...

                // bank parameters from the client
                var donor_id = donor.donor_id;
                var children = donor.child_id;
                if (argv.dev === false) {
                    var ccnumber = donor.ccnumber;
                    var cvv = donor.cvv;
                    var expiration = donor.expiration.replace('/', '');
                } else {
                    var ccnumber = '4111111111111111';
                    var cvv = '111'
                    var expiration = '1120';
                }

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
                    var firstname = donordoc[0].nombre;
                    var lastname = donordoc[0].apellido;
                    var address1 = donordoc[0].calle;
                    var city = donordoc[0].ciudad;
                    var country = donordoc[0].país;
                    var phone = donordoc[0].teléfono;
                    var email = donordoc[0].correo_electrónico;
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
                        if (typeof response !== 'undefined') {
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
                                if (argv.dev === true) { responseCode = '1' };
                                if (responseCode === '1') {
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
                                                if (donordoc[0].hasOwnProperty('transacciones')) {
                                                    donorPayments = donordoc[0].transacciones;
                                                }
                                                // convert the time to ISO from seconds
                                                bankResult['time'] = new Date(parseInt(bankResult.time * 1000));
                                                donorPayments.push(bankResult);

                                                var donorKids = [];
                                                if (donordoc[0].hasOwnProperty('niños_patrocinadoras')) {
                                                    donorKids = donordoc[0].niños_patrocinadoras;
                                                }

                                                for (var kid = 0; kid < cartKids.length; kid++) {
                                                    donorKids.push(cartKids[kid]);
                                                }
                                                mongo.edit(donor_id, {'niños_patrocinadoras': donorKids, 'transacciones': donorPayments}, DONOR_COLLECTION, function(result) {
                                                    if (result.hasOwnProperty('err')) {
                                                        // log lack of editing and response appropriately...
                                                        eventlog.error('Error editing database when sponsoring children. Card charged but no edits were made on the donor document. Check to see the children are correctly marked as sponsored. Donor changes: ' + {'transacciones': donorPayments});
                                                    }
                                                    // then delete the cart doc
                                                    cart.delete(donor_id, function() {
                                                        // recursive function to manage asynch for each id (change status to sponsored)
                                                        changeChildrenStatus(cartKids, 'Sponsored', function() {
                                                            // and we're done.
                                                            eventlog.info('Donor ' + donor_id + ' successfully sponsored children. New children: ' + cartKids);
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
                                    eventlog.error('Error sponsoring children. ResponseCode != 1. Transaction: ' + JSON.stringify({'orderid': orderid}));
                                    res.status(500).send({
                                        success: false,
                                        message: 'Unsuccessful sponsorship. Card not charged. (responseCode != 1)'
                                    });
                                }
                            } else {
                                eventlog.error('Error sponsoring children. Hashes not equal. Transaction: ' + JSON.stringify({'orderid': orderid}));
                                res.status(500).send({
                                    success: false,
                                    message: 'Unsuccessful sponsorship. Card not charged. (Hashes not equal)'
                                });
                            }
                        } else {
                            eventlog.error('Error sponsoring children. No response from bank. Transaction: ' + JSON.stringify({'orderid': orderid}));
                            res.status(500).send({
                                success: false,
                                message: 'Unsuccessful sponsorship. Card not charged. (No response from bank)'
                            });
                        }

                    });
                });
            } else {
                eventlog.error('Error authenticating token during sponsorship process. Transactin: ' + JSON.stringify({'orderid': orderid}));
                res.status(401).send({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            }
        });
    } else {
        eventlog.error('No token provided during sponsorship process. Transaction: ' + {'donor': donor, 'token': donor.token});
        res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
});

// POST /api/v1/donor/create to create a donor
app.post('/api/v1/donor/create', function(req, res) {
    log.info('POST /api/v1/donor/create');
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
                    eventlog.info('Donor created. ' + JSON.stringify(donor));
                    res.status(200).send({
                        success: true,
                        message: 'Donor account created.'
                    });
                } else {
                    eventlog.error('Internal server error. Donor could not be created. ' + donor + '. Error' + result);
                    res.status(500).send({
                        success: false,
                        message: 'Donor could not be created.'
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
    log.info('POST /api/v1/donor/cart');
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
    log.info('GET /api/v1/donor/cart/id/' + req.params.id);
    cart.find(req.params.id, function(cartdoc) {
        if (cartdoc.hasOwnProperty('err')) {
            eventlog.error('Internal server error. Donor cart not found. ' + cartdoc);
            res.status(500).send({
                success: false,
                message: cartdoc.err
            });
        } else {
            res.status(200).send(cartdoc);
        }
    });
});

/* DELETE /api/v1/donor/unsponsor
 *
 * emails the admin saying a donor wants to unsponsor a child
 * {
 *   'token': 'token_goes_here',
 *   'donor_id': donor_id,
 *   'child_id': child_id
 * }
 */
app.delete('/api/v1/donor/unsponsor', function(req, res) {
    log.info('DELETE /api/v1/donor/unsponsor');
    eventlog.info('Donor requesting their sponsorship be deleted. Donor: ' + req.body.donor_id + ', Child: ' + req.body.child_id);
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
                            res.status(200).send({
                                success: true,
                                message: 'Email sent.'
                            });
                        } else {
                            eventlog.error('Error emailing admin. Donor requesting their sponsorship be deleted. Donor: ' + req.body.donor_id + ', Child: ' + req.body.child_id + '.' + JSON.stringify(didEmail));
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

/* DELETE /api/v1/donor/delete
 *
 * emails the admin saying a donor wants to delete their account
 * {
 *   'token': 'token_goes_here',
 *   'donor_id': donor_id
 * }
 */
app.delete('/api/v1/donor/delete', function(req, res) {
    log.info('DELETE /api/v1/donor/delete');
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
                            res.status(200).send({
                                success: true,
                                message: 'Email sent.'
                            });
                        } else {
                            eventlog.error('Error emailing admin. Donor requesting their account be deleted. Donor: ' + req.body.donor_id + '. ' + didEmail);
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
 *   'letter_text': letter_text
 * }
 */
app.post('/api/v1/donor/letter', function(req, res) {
    log.info('POST /api/v1/donor/letter');
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
                            res.status(200).send({
                                success: true,
                                message: 'Letter Sent.'
                            });
                        } else {
                            eventlog.error('Error emailing admin a donor letter. Letter:' + {'donor': donorID, 'child': childID, 'body': letterText} + '. ' + didEmail);
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
 *   'email': 'donor_email'
 * }
 */
app.post('/api/v1/donor/reset', function(req, res) {
    log.info('POST /api/v1/donor/reset');

    // firstly create a selector based on the email to get the donor's doc
    var selector = {
        'correo_electrónico': req.body.email
    };

    // find the doc
    mongo.find(selector, DONOR_COLLECTION, 1, true, function(donor) {
        var id = donor[0]._id;
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
                        eventlog.error('Error resetting donor password. Donor:' + id);
                        res.status(500).send({
                            success: false,
                            message: result.err
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
    });
});

https.createServer({ key: fs.readFileSync(SSL_KEY_PATH),
                     cert: fs.readFileSync(SSL_CERT_PATH),
                     ca: [fs.readFileSync(SSL_CA_PATH_1, 'utf8'),
                          fs.readFileSync(SSL_CA_PATH_2, 'utf8'),
                          fs.readFileSync(SSL_CA_PATH_3, 'utf8')]
                    }, app)
     .listen(APP_PORT, function() {
         log.info('Server up and listening at https://0.0.0.0:' + APP_PORT + '...');
     });
