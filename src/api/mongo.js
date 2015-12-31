var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var nconf = require('nconf');
nconf.env()
     .file({ file: 'config.json' });

var dbName = nconf.get('autofill:dbName');
var url = 'mongodb://' + nconf.get('mongo:host') + ':' +
          nconf.get('mongo:port') + '/' + dbName;

var exports = module.exports = {};

/** insertDocuments(collection, docs, callback)
 *
 * insert any number of documents into a specific collection.
 *
 * collection   (string) - the collection to search for documents
 * docs (JSON or array)  - docs to insert. one JSON doc or array of JSON docs
 * callback       (func) - callback function to execute after completion
 *
 * example implementation:
 * -----------------------
 * var mongoapi = require('./src/api/mongo.js');
 *
 * var docs = [{ 'name': 'Poe Dameron' }, { 'name' : 'Kylo Ren' }];
 * mongoapi.insertDocuments('testing', docs, function(isOk) {
 *     if(isOk) {
 *         console.log('everything\'s okay');
 *     } else {
 *         console.log('everything sucks');
 * });
 *
 */
exports.insertDocuments = function(collection, docs, callback) {
    var isOk = false;

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
            bulkInsert(db, collection, docs, function() {
                db.close();
                isOk = true;
                callback(isOk);
            });
        } else {
            insertDoc(db, collection, docs, function() {
                db.close();
                isOk = true;
                callback(isOk);
            });
        }
    });
};

// lookupKeys - array of keys
// lookupValues - array of values, must be the same length as lookupKey
exports.delete = function(lookupKeys, lookupValues) {
    return lookupKeys, lookupValues;
};

// lookupKeys - array of keys
// lookupValues - array of values, must be the same length as lookupKey
exports.edit = function(lookupKeys, lookupValues, replaceKey, replaceValue) {
    return lookupKeys, lookupValues, replaceKey, replaceValue;
};

/** findDocuments(collection, lookupKeys, lookupValues, limit, callback)
 *
 * find a specified number of documents that match a certain query. returns an
 * array of documents as JSON objects. information can then be extracted from
 * the documents by looping through the array and using JSON dot notation.
 *
 * collection (string) - the collection to search for documents
 * query       (JSON)  - query to execute
 * limit         (int) - number of documents to limit the search results to
 * callback     (func) - callback function to execute after completion
 *
 * example implementation:
 * -----------------------
 * var mongoapi = require('./src/api/mongo.js');
 *
 * var query = { 'status': 'Sponsored' };
 * mongoapi.findDocuments('testing', query, 10, function(docs) {
 *     // loop through the returned documents and console out the doc ids
 *     for (var i = 0; i < docs.length; i++) {
 *         if (docs[i]._id) {
 *             console.log(docs[i]._id);
 *         }
 *     }
 * });
 *
 */
exports.findDocuments = function(collection, query, limit, callback) {
    var documents = [];

    var findDocs = function(db, collection, query, callback) {
        var cursor = db.collection(collection).find(query).limit(limit);
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
        findDocs(db, collection, query, function() {
            db.close();
            callback(documents);
        });
    });
};

/** getIds(callback, query, limit, callback)
 *
 * get the ids of a certain set of documents and returns them as an array of
 * strings. uses the findDocuments() function above. really just here to make
 * things a little bit easier. takes the same parameters as findDocuments().
 *
 * collection (string) - the collection to search for documents
 * query       (JSON)  - query to execute
 * limit         (int) - number of documents to limit the search results to
 * callback     (func) - callback function to execute after completion
 *
 * example implementation:
 * -----------------------
 * var mongoapi = require('./src/api/mongo.js');
 *
 * var query = { 'status': 'Sponsored' };
 * mongoapi.getIds('testing', query, 10, function(ids) {
 *     console.log(ids);
 * });
 *
 */
exports.getIds = function(collection, query, limit, callback) {
    var ids = [];

    exports.findDocuments(collection, query, limit, function(docs) {
        for (var i = 0; i < docs.length; i++) {
            if (docs[i]._id) {
                ids.push(docs[i]._id);
            }
        }
        callback(ids);
    });
}
