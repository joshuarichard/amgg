var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var nconf = require('nconf');
nconf.env()
     .file({ file: 'config.json'});

var dbName = nconf.get('autofill:dbName');
var url = 'mongodb://' + nconf.get('mongo:host') + ':' +
          nconf.get('mongo:port') + '/' + dbName;



var exports = module.exports = {};

exports.insert = function (doc) {
    return doc;
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

/**
 * findDocuments(collection, lookupKeys, lookupValues, limit, callback)
 *
 * collection (string) - the collection to search for documents
 * query (JSON)  - query to execute
 * limit - number of documents to limit the search results to
 * callback - callback function to execute after completion
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
