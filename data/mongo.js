/* eslint-env node */

var MongoClient = require('mongodb').MongoClient;
var mongo = require('mongodb');
var nconf = require('nconf');
var bunyan = require('bunyan');
var crypto = require('crypto');
var argv = require('minimist')(process.argv.slice(2));

// TODO: need to take care of making this more robust. don't log.trace(success)
// when there's failure. know this is happening for edit() with undefined ID
// need to assert on mongo res's. need to know structure of the res's.
// need to figure out how to format errors to then send to app.js for 401's

var log = bunyan.createLogger({
    name: 'mongo',
    streams: [
        {
            level: 'info',
            stream: process.stdout
            // path: './log/mongo_info.log',
            // period: '1d',  // daily rotation
            // count: 3
        },
        {
            level: 'trace',
            path: './log/mongo.trace.log',
            period: '1d',
            count: 3
        },
        {
            level: 'debug',
            path: './log/app.log',
            period: '1d',   // daily rotation
            count: 3
        }
    ]
});

nconf.env()
     .file({
         file: 'config.json'
     });

// mongodb://username:password@host:port/databasename
/*
var url = 'mongodb://' +
          nconf.get('mongo:username') +
          ':' +
          nconf.get('mongo:password') +
          '@' +
          nconf.get('mongo:host') +
          ':' +
          nconf.get('mongo:port') +
          '/' +
          nconf.get('mongo:db');
*/

// MONGODB_PORT_27017_TCP_ADDR is the linked container's IP address (for deploy)
var host = nconf.get('MONGODB_PORT_27017_TCP_ADDR') || nconf.get('mongo:host');
var port = nconf.get('mongo:port');
var dbName = nconf.get('mongo:db');

var algorithm = 'aes-256-ctr';

// encrypt and decrypt functions taken from:
// http://lollyrock.com/articles/nodejs-encryption/
function decrypt(text, pass) {
    var decipher = crypto.createDecipher(algorithm, pass);
    var decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

if (typeof argv.password === 'undefined') {
    log.error('Add password with the --password option.');
    process.exit();
}

var decryptedMongoDB = decrypt(nconf.get('mongo:credentials'), argv.password);
decryptedMongoDB = decryptedMongoDB.split('|');
var mongoHash = crypto.createHash('md5')
                      .update(decryptedMongoDB[0] + '|' +
                              decryptedMongoDB[1])
                      .digest('hex');

if (mongoHash !== decryptedMongoDB[2]) {
    log.error('Incorrect password given at startup. Bank and email worked but mongodb didn\'t.');
    process.exit();
}

// mongodb://username:password@host:port/databasename

var url;
if (argv.noauth === true) {
    url = 'mongodb://' + host + ':' + port + '/' + dbName;
} else {
    url = 'mongodb://' + decryptedMongoDB[0] + ':' + decryptedMongoDB[1] + '@' + host + ':' + port + '/' + dbName;
}

// TODO: this test works if connected or unconnected to the internet, but if the
// IP is wrong, it will take a million years to timeout. look into a MongoClient
// connect() timeout option to shorten the timeout if possible
MongoClient.connect(url, function(err, db) {
    if (err) {
        log.error('Test connection to Mongo unsuccessful.');
    } else {
        log.info('Test connection to Mongo successful.');
        db.close();
    }
});

var exports = module.exports = {};

/** find(selector, collection, limit, isTrim, callback)
 *
 * find a specified number of documents that match a certain selector.
 * returns a document composed of all documents that mongo returns.
 *
 * selector    (JSON)  - document selector
 * collection (string) - the collection to search for documents
 * limit         (int) - number of documents to limit the search results to
 * isTrim    (boolean) - true if trim is requested, false if not
 * callback     (func) - callback function to execute after completion
 */
exports.find = function(selector, collection, limit, isTrim, callback) {
    log.trace('getting document(s) with selector ' + JSON.stringify(selector) + ' in collection \'' + collection + '\' with limit ' + limit);
    var documents = [], i = 0;

    var findDocs = function(db, collection, selector, callback) {
        var cursor = db.collection(collection).find(selector).limit(limit);
        cursor.each(function(err, doc) {
            if (err) {
                log.error('error in find().findDocs(). message: ' + err);
                callback({
                    'err': err.errmsg,
                    code: err.code
                });
            }
            if (doc != null) {
                documents.push(doc);
                i++;
            } else {
                callback();
            }
        });
    };

    MongoClient.connect(url, function(err, db) {
        if (err) {
            log.error('Mongo connection error in find() ' + err);
            callback({'err': 'cannot establish a connection'}); // good start
        } else {
            findDocs(db, collection, selector, function() {
                db.close();
                if (JSON.stringify(documents) !== '{}') {
                    if(isTrim) {
                        documents = trim(documents);
                    }
                    log.trace('successfully found document(s) with selector ' + JSON.stringify(selector) + ' in collection \'' + collection + '\'' + ' with limit ' + limit + '. document: ' + JSON.stringify(documents));
                } else {
                    log.trace('document not found with selector ' + JSON.stringify(selector) + ' in collection \'' + collection + '\'' + ' with limit ' + limit + '. document: ' + JSON.stringify(documents));
                }
                callback(documents);
            });
        }
    });
};

/** insert(docs, collection, callback)
 *
 * insert any number of documents into a specific collection. returns the
 * results as a JSON object.
 *
 * docs (JSON or array)  - docs to insert. one JSON doc or array of JSON docs
 * collection   (string) - the collection to search for documents
 * callback       (func) - callback function to execute after completion
 */
exports.insert = function(docs, collection, callback) {
    log.trace('inserting document(s) ' + JSON.stringify(docs) + ' in collection \'' + collection + '\'');
    var insertDoc = function(db, collection, doc, callback) {
        db.collection(collection).insertOne(doc, function(err, result) {
            if (err) {
                log.error('error in insert().insertDoc() message: ' + err);
                callback({
                    'err': err.errmsg,
                    code: err.code
                });
            } else {
                callback(result);
            }
        });
    };

    MongoClient.connect(url, function(err, db) {
        if (err) {
            log.error('Mongo connection error in insert() ' + err);
            callback({'err': 'cannot establish a connection'}); // good start
        } else {
            insertDoc(db, collection, docs, function(result) {
                db.close();
                log.trace('successfully inserted one document ' + JSON.stringify(docs) + ' into collection \'' + collection + '\'');
                callback(result);
            });
        }
    });
};

/** edit(id, changes, collection, callback)
 *
 * edit a document with a specific _id. returns the result as a JSON object.
 *
 * id           (string) - document _id
 * changes        (JSON) - changes to be made in JSON notation
 * collection   (string) - the collection to search for documents
 * callback       (func) - callback function to execute after completion
 */
exports.edit = function(id, changes, collection, callback) {
    log.trace('editing document(s) with id ' + id + ' in collection \'' + collection + '\' with changes ' + changes);
    var changesMod = {};
    changesMod['$set'] = changes;

    var editDoc = function(id, db, collection, changes, callback) {
        try {
            var o_id = new mongo.ObjectID(id);
            var selector = {'_id': o_id};

            db.collection(collection).updateOne(selector, changes,
            function(err, res) {
                if (err) {
                    log.error('error in edit().editDoc(). message: ' + err);
                    callback({
                        'err': err.errmsg,
                        code: err.code
                    });
                } else {
                    callback(res);
                }
            });
        } catch (err) {
            log.error('Bad ID in mongo.edit() ID: ' + id);
            callback({'err': 'Bad ID.'});
        }
    };


    MongoClient.connect(url, function(err, db) {
        if (err) {
            log.error('Mongo connection error in edit() ' + err);
            callback({'err': 'cannot establish a connection'});
        } else {
            editDoc(id, db, collection, changesMod, function(res) {
                db.close();
                log.trace('successfully edited one document with id ' + id + ' from collection ' + collection + ' with changes' + changes);
                callback(res);
            });
        }
    });
};

/** delete(selector, collection, callback)
 *
 * delete a document with a given ID. used to delete donor documents.
 *
 * id           (string) - document _id
 * collection   (string) - the collection to search for documents
 * callback       (func) - callback function to execute after completion
 *
 */
exports.delete = function(id, collection, callback) {
    log.trace('deleting document(s) with id ' + id + ' in collection \'' + collection + '\'');

    var deleteDoc = function(db, collection, id, callback) {
        try {
            var o_id = new mongo.ObjectID(id);
            var selector = {'_id': o_id};

            db.collection(collection).deleteOne(selector, function(err, res) {
                if (err) {
                    log.error('error in deleteDoc(). message: ' + err);
                    callback({
                        'err': err.errmsg,
                        code: err.code
                    });
                } else {
                    callback(res);
                }
            });
        } catch(err) {
            log.error('Invalid _id when deleting document. id: ' + id);
            callback({
                'err': 'invalid _id.'
            });
        }
    };

    MongoClient.connect(url, function(err, db) {
        if (err) {
            log.error('Mongo connection error in delete() ' + err);
            callback({'err': 'cannot establish a connection.'});
        } else {
            deleteDoc(db, collection, id, function(res) {
                db.close();
                log.trace('successfully deleted one document with selector ' + id + ' from collection \'' + collection + '\'');
                callback(res);
            });
        }
    });
};

/** get(id, collection, isTrim, callback)
 *
 * fetches a document with a certain _id. returns the document as a JSON object.
 *
 * returns a document with content {'err' : 'not found'} if the id cannot be
 * matched.
 *
 * id         (string) - document _id
 * collection (string) - the collection to search for documents
 * isTrim    (boolean) - true if trim is requested, false if not
 * callback     (func) - callback function to execute after completion
 */
exports.get = function(id, collection, isTrim, callback) {
    log.trace('getting document with id ' + id + ' from collection ' + collection);

    var getDoc = function(db, id, collection, callback) {
        try {
            var o_id = new mongo.ObjectID(id);
            var selector = {'_id': o_id};
            var foundOne = false;

            var cursor = db.collection(collection).find(selector);
            cursor.each(function(err, doc) {
                if (err) {
                    log.error('error in getDoc(). message: ' + err);
                    callback({
                        'err': err.errmsg,
                        code: err.code
                    });
                }
                if (doc != null) {
                    foundOne = true;
                    callback([doc]);
                }
                // cursor.each() is always going to hit a null value so keep track
                // of whether or not we've found one. callback error on lookup fail
                if (!foundOne){
                    log.error('document not found with id: \'' + id + '\'');
                    callback({'err': 'Not found.'});
                }
            });
        } catch (err) {
            log.error('Bad ID in mongo.get(). ID: ' + id);
            callback({'err': 'Bad ID.'});
        }
    };

    MongoClient.connect(url, function(err, db) {
        if (err) {
            log.error('Mongo connection error in get() ' + err);
            callback({'err': 'cannot establish a connection.'}); // good start
        } else {
            getDoc(db, id, collection, function(doc) {
                if (doc.hasOwnProperty('err')) {
                    db.close();
                    callback(doc);
                } else {
                    db.close();
                    if(isTrim) {
                        doc = trim(doc);
                    }
                    log.trace('successfully got document with id ' + id + ' from collection \'' + collection + '\'. document: ' + JSON.stringify(doc));
                    callback(doc);
                }
            });
        }
    });
};

/** trim(doc)
 *
 * trims a document down from a full document to a public, api-ready document.
 * returns a json doc.
 *
 * doc  (JSON) - array of documents to be trimmed
 */
function trim(doc) {
    var trimmedDoc = [];

    for (var j = 0; j < doc.length; j++) {
        trimmedDoc.push({
            '_id': doc[j]._id,
            'nombre': doc[j].nombre,
            'cumpleaños':doc[j].cumpleaños,
            'género': doc[j].género,
            'centro_de_niños': doc[j].centro_de_niños,
            'departamento': doc[j].departamento,
            'pasatiempos': doc[j].pasatiempos,
            'sueños': doc[j].sueños,
            'foto': doc[j].foto
        });
    }
    return(trimmedDoc);
}
