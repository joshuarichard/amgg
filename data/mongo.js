/* eslint-env node */

var MongoClient = require('mongodb').MongoClient;
var mongo = require('mongodb');
var nconf = require('nconf');
var bunyan = require('bunyan');

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
            // path: './var/log/mongo_info.log',
            // period: '1d',  // daily rotation
            // count: 3
        },
        {
            level: 'trace',
            path: './var/log/mongo_access.log',
            period: '1d',    // daily rotation
            count: 3
        },
        {
            level: 'error',
            path: './var/log/mongo_error.log',
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

// mongodb://host:port/databasename
var url = 'mongodb://' + host + ':' + port + '/' + dbName;

// TODO: this test works if connected or unconnected to the internet, but if the
// IP is wrong, it will take a million years to timeout. look into a MongoClient
// connect() timeout option to shorten the timeout if possible
MongoClient.connect(url, function(err, db) {
    if (err) {
        log.error('test connection to Mongo unsuccessful.');
    } else {
        log.info('test connection to Mongo successful.');
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
    log.trace('getting document(s) with selector ' + JSON.stringify(selector) +
              ' in collection \'' + collection + '\' with limit ' + limit);
    var documents = {}, i = 0;

    var findDocs = function(db, collection, selector, callback) {
        var cursor = db.collection(collection).find(selector).limit(limit);
        cursor.each(function(err, doc) {
            if (err) {
                log.error('error in find().findDocs(). message: ' + err);
                // TODO: callback with error in JSON
            }
            if (doc != null) {
                documents[doc._id] = doc;
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
                    log.trace('successfully found document(s) with selector ' +
                              JSON.stringify(selector) + ' in collection \'' +
                              collection + '\'' + ' with limit ' + limit +
                              '. document: ' + JSON.stringify(documents));
                } else {
                    log.trace('document not found with selector ' +
                              JSON.stringify(selector) + ' in collection \'' +
                              collection + '\'' + ' with limit ' + limit +
                              '. document: ' + JSON.stringify(documents));
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
    log.trace('inserting document(s) ' + JSON.stringify(docs) +
              ' in collection \'' + collection + '\'');
    var insertDoc = function(db, collection, doc, callback) {
        db.collection(collection).insertOne(doc, function(err, result) {
            if (err) {
                log.error('error in insert().insertDoc() message: ' + err);
                callback({
                    success: false,
                    code: err.code,
                    message: err.errmsg
                });
            } else {
                callback(result);
            }
        });
    };

    var bulkInsert = function(db, collection, docs, callback) {
        var bulk = db.collection(collection).initializeUnorderedBulkOp();
        for (var i = 0; i < docs.length; i++) {
            bulk.insert(docs[i]);
        }

        bulk.execute(function(err, result) {
            if (err) {
                log.error('error in insert().bulkInsert() message: ' + err);
                callback(err);
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
            if(docs instanceof Array) {
                bulkInsert(db, collection, docs, function(result) {
                    db.close();
                    log.trace('successfully inserted many documents ' +
                              JSON.stringify(docs) + ' into collection \'' +
                              collection + '\'');
                    callback(result);
                });
            } else {
                insertDoc(db, collection, docs, function(result) {
                    db.close();
                    log.trace('successfully inserted one document ' +
                              JSON.stringify(docs) + ' into collection \'' +
                              collection + '\'');
                    callback(result);
                });
            }
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
    log.trace('editing document(s) with id ' + id + ' in collection \'' +
              collection + '\' with changes ' + changes);
    var changesMod = {};
    changesMod['$set'] = changes;

    var o_id = new mongo.ObjectID(id);
    var selector = {'_id': o_id};

    var editDoc = function(db, collection, selector, changes, callback) {
        db.collection(collection).updateOne(selector, changes,
        function(err, res) {
            if (err) {
                log.error('error in edit().editDoc(). message: ' + err);
                // TODO: callback with error in JSON
            }
            callback(res);
        });
    };

    MongoClient.connect(url, function(err, db) {
        if (err) {
            log.error('Mongo connection error in edit() ' + err);
            callback({'err': 'cannot establish a connection'});
        } else {
            editDoc(db, collection, selector, changesMod, function(res) {
                db.close();
                log.trace('successfully edited one document with id ' +
                          id + ' from collection ' + collection +
                          ' with changes' + changes);
                callback(res);
            });
        }
    });
};

/** delete(selector, collection, callback)
 *
 * delete any number of documents into a specific collection. returns the
 * results as a JSON object.
 *
 * selector       (JSON) - document selector
 * collection   (string) - the collection to search for documents
 * callback       (func) - callback function to execute after completion
 *
 * TODO: look into fixing bulkDelete(). not sure if the for loop works correctly
 */
exports.delete = function(selector, collection, callback) {
    log.trace('deleting document(s) with selector ' + JSON.stringify(selector) +
              ' in collection \'' + collection + '\'');
    var deleteDoc = function(db, collection, selector, callback) {
        db.collection(collection).deleteOne(selector, function(err, res) {
            if (err) {
                log.error('error in deleteDoc(). message: ' + err);
                // TODO: callback with error in JSON
            }
            callback(res);
        });
    };

    var bulkDelete = function(db, collection, selector, callback) {
        var bulk = db.collection(collection).initializeUnorderedBulkOp();
        for (var i = 0; i < selector.length; i++) {
            bulk.find(selector[i]).removeOne();
        }

        bulk.execute(function(err, res) {
            if (err) {
                log.error('error in bulkDelete(). message: ' + err);
                // TODO: callback with error in JSON
            }
            callback(res);
        });
    };

    MongoClient.connect(url, function(err, db) {
        if (err) {
            log.error('Mongo connection error in delete() ' + err);
            callback({'err': 'cannot establish a connection.'});
        } else {
            if(selector instanceof Array) {
                bulkDelete(db, collection, selector, function(res) {
                    db.close();
                    log.trace('successfully deleted documents with selector '+
                              JSON.stringify(selector) + ' from collection \'' +
                              collection + '\'');
                    callback(res);
                });
            } else {
                deleteDoc(db, collection, selector, function(res) {
                    db.close();
                    log.trace('successfully deleted one document with selector '
                              + JSON.stringify(selector) + ' from collection \''
                              + collection + '\'');
                    callback(res);
                });
            }
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
    log.trace('getting document with id ' + id + ' from collection ' +
              collection);
    var o_id = new mongo.ObjectID(id);
    var selector = {'_id': o_id};
    var foundOne = false;

    var getDoc = function(db, id, collection, callback) {
        var cursor = db.collection(collection).find(selector);
        cursor.each(function(err, doc) {
            if (err) {
                log.error('error in getDoc(). message: ' + err);
                // TODO: callback with error in JSON
            }
            if (doc != null) {
                foundOne = true;
                callback(doc);
            }
            // cursor.each() is always going to hit a null value so keep track
            // of whether or not we've found one. callback error on lookup fail
            if (!foundOne){
                log.error('document not found with id: \'' + id + '\'');
                callback({'err': 'not found'});
            }
        });
    };

    MongoClient.connect(url, function(err, db) {
        if (err) {
            log.error('Mongo connection error in get() ' + err);
            callback({'err': 'cannot establish a connection.'}); // good start
        } else {
            getDoc(db, id, collection, function(doc) {
                db.close();
                if(isTrim) {
                    doc = trim(doc);
                }
                log.trace('successfully got document with id ' + id +
                          ' from collection \'' + collection + '\'. document: '
                          + JSON.stringify(doc));
                callback(doc);
            });
        }
    });
};

/** getPic(id, collection, callback)
 *
 * fetches a buffer for child pictures based on the child's document _id
 *
 * returns a document with content {'err' : 'not found'} if the id cannot be
 * matched.
 *
 * id         (string) - _id of the child whose picture buffer to return
 * collection (string) - the collection to search for documents
 * callback     (func) - callback function to execute after completion
 */
exports.getPic = function(id, collection, callback) {
    log.trace('getting picture for child with id ' + id);

    exports.get(id, collection, false, function(doc) {
        var db = new mongo.Db(nconf.get('mongo:db'),
                 new mongo.Server(host,
                 nconf.get('mongo:port')));

        db.open(function(err, db) {
            if (err) {
                log.error('Mongo connection error in getPic() ' + err);
                callback({'err': 'cannot establish a connection.'});
            } else {
                var imageId = new mongo.ObjectID(doc.image_id);
                var gridStore = new mongo.GridStore(db, imageId, 'r');
                gridStore.open(function(err, gridStore) {
                    gridStore.seek(0, function() {
                        gridStore.read(function(err, data) {
                            db.close();
                            log.trace('got picture for child with id ' + id);
                            callback(data.toString('base64'));
                        });
                    });
                });
            }
        });
    });
};

/** trim(doc)
 *
 * trims a document down from a full document to a public, api-ready document.
 * returns a json doc.
 *
 * doc  (JSON) - document to be trimmed
 */
function trim(doc) {
    var trimmedDoc = {};

    for (var miniDoc in doc) {
        // if this is multiple documents
        if (miniDoc != '_id') {
            trimmedDoc[doc[miniDoc]._id] = {
                'nombre': doc[miniDoc].nombre,
                'años': doc[miniDoc].años,
                'cumpleaños':doc[miniDoc].cumpleaños,
                'género': doc[miniDoc].género,
                'centro_de_ninos': doc[miniDoc].centro_de_ninos,
                'provincia': doc[miniDoc].provincia
            };
        // else this is only one document
        } else {
            trimmedDoc[doc._id] = {
                'nombre': doc.nombre,
                'años': doc.años,
                'cumpleaños': doc.cumpleaños,
                'género': doc.género,
                'centro_de_ninos': doc.centro_de_ninos,
                'provincia': doc.provincia
            };
            break;
        }
    }
    return(trimmedDoc);
}
