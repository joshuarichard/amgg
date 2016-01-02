var MongoClient = require('mongodb').MongoClient;
var mongo = require('mongodb');
var assert = require('assert');
var nconf = require('nconf');
nconf.env()
     .file({ file: 'config.json' });

var dbName = nconf.get('autofill:dbName');
var url = 'mongodb://' + nconf.get('mongo:host') + ':' +
          nconf.get('mongo:port') + '/' + dbName;

var exports = module.exports = {};

/** find(selector, collection, limit, callback)
 *
 * find a specified number of documents that match a certain selector.
 * returns an array of documents as JSON objects.
 *
 * selector    (JSON)  - selector
 * collection (string) - the collection to search for documents
 * limit         (int) - number of documents to limit the search results to
 * callback     (func) - callback function to execute after completion
 */
exports.find = function(selector, collection, limit, callback) {
    var documents = [];

    var findDocs = function(db, collection, selector, callback) {
        var cursor = db.collection(collection).find(selector).limit(limit);
        cursor.each(function(err, doc) {
            assert.equal(err, null);
            if (doc != null) {
                documents.push(doc);
            } else {
                callback();
            }
        });
    };

    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        findDocs(db, collection, selector, function() {
            db.close();
            callback(documents);
        });
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

    var insertDoc = function(db, collection, doc, callback) {
        db.collection(collection).insertOne(doc, function(err, result) {
            assert.equal(err, null);
            callback(result);
        });
    };

    var bulkInsert = function(db, collection, docs, callback) {
        var bulk = db.collection(collection).initializeUnorderedBulkOp();
        for (var i = 0; i < docs.length; i++) {
            bulk.insert(docs[i]);
        }

        // execute bulk op and make some assertions
        bulk.execute(function(err, result) {
            assert.equal(docs.length, result.nInserted);
            callback(result);
        });
    };

    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        if(docs instanceof Array) {
            bulkInsert(db, collection, docs, function(result) {
                db.close();
                callback(result);
            });
        } else {
            insertDoc(db, collection, docs, function(result) {
                db.close();
                callback(result);
            });
        }
    });
};

/**
 * TODO: edit
 */
exports.edit = function(selector, changes, collection, limit, callback) {
    return selector, changes, collection, limit, callback;
};

/** delete(selector, collection, callback)
 *
 * delete any number of documents into a specific collection. returns the
 * results as a JSON object.
 *
 * selector       (JSON) - document selector
 * collection   (string) - the collection to search for documents
 * callback       (func) - callback function to execute after completion
 */
exports.delete = function(selector, collection, callback) {

    var deleteDoc = function(db, collection, selector, callback) {
        db.collection(collection).deleteOne(selector, function(err, result) {
            assert.equal(null, err);
            callback(result);
        });
    };

    var bulkDelete = function(db, collection, selector, callback) {
        var bulk = db.collection(collection).initializeUnorderedBulkOp();
        for (var i = 0; i < selector.length; i++) {
            bulk.find(selector[i]).removeOne();
        }

        // execute bulk op and make some assertions
        bulk.execute(function(err, result) {
            callback(result);
        });
    };

    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        if(selector instanceof Array) {
            bulkDelete(db, collection, selector, function(result) {
                db.close();
                callback(result);
            });
        } else {
            deleteDoc(db, collection, selector, function(result) {
                db.close();
                callback(result);
            });
        }
    });
};

/** getIds(selector, collection, limit, callback)
 *
 * get the ids of a certain set of documents and returns them as an array of
 * strings. uses the find() function above. really just here to make
 * things a little bit easier. takes the same parameters as find().
 *
 * selector    (JSON)  - document selector
 * collection (string) - the collection to search for documents
 * limit         (int) - number of documents to limit the search results to
 * callback     (func) - callback function to execute after completion
 */
exports.getIds = function(selector, collection, limit, callback) {
    var ids = [];

    exports.find(collection, selector, limit, function(docs) {
        for (var i = 0; i < docs.length; i++) {
            if (docs[i]._id) {
                ids.push(docs[i]._id);
            }
        }
        callback(ids);
    });
}

/** isLocked(id, collection, callback)
 *
 * checks to see if a child is locked
 *
 * id        (string)  - document _id
 * collection (string) - the collection to search for documents
 * callback     (func) - callback function to execute after completion
 */
exports.getDoc = function(id, collection, callback) {
    var o_id = new mongo.ObjectID(id);
    var selector = {'_id': o_id};

    var checkLock = function(db, id, collection, callback) {
        var cursor = db.collection(collection).find(selector);
        cursor.each(function(err, doc) {
            assert.equal(err, null);
            var doc;
            if (doc != null) {
                callback(doc);
            } else {
                console.log('MONGO ERROR: Document not found with id:' + id + ' on ' +// INSERT DATE HERE );
                callback(//CAN I CALLBACK NOTHING?);
            }
        });
    }

    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        checkLock(db, id, collection, function(doc) {
            db.close();
            callback(doc);
        });
    });
}

/**
 * getDoc by id method
 */
