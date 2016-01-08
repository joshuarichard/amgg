var MongoClient = require('mongodb').MongoClient;
var mongodb = require('mongodb');
var nconf = require('nconf');
var bunyan = require('bunyan');

// TODO: need to take care of making this more robust. don't log.trace(success)
// when there's failure. know this is happening for edit() with undefined ID
// need to assert on mongo res's. need to know structure of the res's.

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
            count: 10
        }
    ]
});

nconf.env()
     .file({ file: 'config.json' });

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

var url = 'mongodb://' +
          nconf.get('mongo:host') +
          ':' +
          nconf.get('mongo:port') +
          '/' +
          nconf.get('mongo:db');

var exports = module.exports = {};

// this assertion doesnt work and the error never gets thrown. look into this
MongoClient.connect(url, function(err, db) {
    if (err) {
        log.error('test connection to Mongo unsuccessful.');
    } else {
        log.info('test connection to Mongo successful.');
        db.close();
    }
});

/** find(selector, collection, limit, callback)
 *
 * find a specified number of documents that match a certain selector.
 * returns a document composed of all documents that mongo returns.
 *
 * selector    (JSON)  - document selector
 * collection (string) - the collection to search for documents
 * limit         (int) - number of documents to limit the search results to
 * callback     (func) - callback function to execute after completion
 */
exports.find = function(selector, collection, limit, callback) {
    log.trace('getting document(s) with selector ' + JSON.stringify(selector) +
              ' in collection \'' + collection + '\' with limit ' + limit);
    var documents = {}, i = 0;

    var findDocs = function(db, collection, selector, callback) {
        var cursor = db.collection(collection).find(selector).limit(limit);
        cursor.each(function(err, doc) {
            if (err) {
                log.error('error in find().findDocs(). message: ' + err);
            }
            if (doc != null) {
                documents[i] = doc;
                i++;
            } else {
                callback();
            }
        });
    };

    MongoClient.connect(url, function(err, db) {
        if (err) {
            log.error('Mongo connection error in find() ' + err);
            callback({'err': 'cannot establish a connection'});
        } else {
            findDocs(db, collection, selector, function() {
                db.close();
                var trimmedDoc = trim(documents);
                log.trace('successfully found document(s) with selector ' +
                          JSON.stringify(selector) + ' in collection \'' +
                          collection + '\'' + ' with limit ' + limit +
                          '. document: ' + JSON.stringify(trimmedDoc));
                callback(trimmedDoc);
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
            }
            callback(result);
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
            }
            callback(result);
        });
    };

    MongoClient.connect(url, function(err, db) {
        if (err) {
            log.error('Mongo connection error in insert() ' + err);
            callback({'err': 'cannot establish a connection'});
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

/** edit(docs, collection, callback)
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

    var o_id = new mongodb.ObjectID(id);
    var selector = {'_id': o_id};

    var editDoc = function(db, collection, selector, changes, callback) {
        db.collection(collection).updateOne(selector, changes,
        function(err, res) {
            if (err) {
                log.error('error in edit().editDoc(). message: ' + err);
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

/** getIds(selector, collection, limit, callback)
 *
 * get the ids of a certain set of documents and returns them as an array of
 * strings. uses the find() function above. really just here to make
 * things a little bit easier. takes the same parameters as find().
 *
 * selector     (JSON) - document selector
 * collection (string) - the collection to search for documents
 * limit         (int) - number of documents to limit the search results to
 * callback     (func) - callback function to execute after completion
 */
exports.getIds = function(selector, collection, limit, callback) {
    log.trace('getting ids of documents with selector ' +
              JSON.stringify(selector) + ' collection \'' + collection +
              '\' and limit ' + limit);
    var ids = [];

    exports.find(collection, selector, limit, function(docs) {
        for (var i = 0; i < docs.length; i++) {
            if (docs[i]._id) {
                ids.push(docs[i]._id);
            }
        }
        log.trace('successfully got document with selector ' +
                  JSON.stringify(selector) + ' from collection \'' +
                  collection + '\' and limit ' + limit);
        callback(ids);
    });
};

/** get(id, collection, callback)
 *
 * fetches a document with a certain _id. returns the document as a JSON object.
 *
 * returns a document with content {'err' : 'not found'} if the id cannot be
 * matched.
 *
 * id         (string) - document _id
 * collection (string) - the collection to search for documents
 * callback     (func) - callback function to execute after completion
 */
exports.get = function(id, collection, callback) {
    log.trace('getting document with id ' + id + ' from collection ' +
              collection);
    var o_id = new mongodb.ObjectID(id);
    var selector = {'_id': o_id};
    var foundOne = false;

    var getDoc = function(db, id, collection, callback) {
        var cursor = db.collection(collection).find(selector);
        cursor.each(function(err, doc) {
            if (err) {
                log.error('error in getDoc(). message: ' + err);
            }
            if (doc != null) {
                foundOne = true;
                callback(doc);
            }
            // cursor.each() is always going to hit a null value so keep track
            // of whether or not we've found one. console out on lookup failure
            if (!foundOne){
                log.error('document not found with id: \'' + id + '\'');
                callback({'err' : 'not found'});
            }
        });
    };

    MongoClient.connect(url, function(err, db) {
        if (err) {
            log.error('Mongo connection error in get() ' + err);
            callback({'err': 'cannot establish a connection.'});
        } else {
            getDoc(db, id, collection, function(doc) {
                db.close();
                var trimmedDoc = trim(doc);
                log.trace('successfully got document with id ' + id +
                          ' from collection \'' + collection + '\'. document: '
                          + JSON.stringify(trimmedDoc));
                callback(trimmedDoc);
            });
        }
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
    var trimmedDoc = {}, i = 0;

    for (var miniDoc in doc) {
        // if this is multiple documents
        if (miniDoc != '_id') {
            trimmedDoc[doc[miniDoc]._id] = {
                'nombre': doc[miniDoc].nombre,
                'años': doc[miniDoc].años,
                'cumpleaños':doc.cumpleaños,
                'género': doc[miniDoc].género,
                'centro_de_ninos': doc[miniDoc].centro_de_ninos
            };
        // else this is only one document
        } else {
            trimmedDoc[doc._id] = {
                'nombre': doc.nombre,
                'años': doc.años,
                'cumpleaños': doc.cumpleaños,
                'género': doc.género,
                'centro_de_ninos': doc.centro_de_ninos
            };
            break;
        }
        i++;
    }
    return(trimmedDoc);
}
