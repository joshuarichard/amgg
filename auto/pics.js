/* eslint-env node */

var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
var GridStore = require('mongodb').GridStore;
var assert = require('assert');

var nconf = require('nconf');
nconf.env()
     .file({ file: 'config.json'});

var dbName = nconf.get('autofill:dbName');

var exports = module.exports = {};

function insertPic(fileName, filePath, metaData, callback) {
    console.log('INFO: inserting picture for ' + fileName +
                ' at ' + filePath + ' with metadata ' + metaData);
    var db = new Db(dbName, new Server(nconf.get('mongo:host'), 27017));
    db.open(function(err, db) {
        var gridStoreWrite = new GridStore(db, fileName, 'w',
                                 {chunkSize:1024, metadata: metaData });
        gridStoreWrite.writeFile(filePath, function(err, result) {
            if(err){
                console.log('failed inserting ' + fileName + ' ' + metaData);
            }
            assert.equal(err, null);
            assert.ok(typeof result.close == 'function');
            db.close();
            callback(result.fileId);
        });
    });
}

exports.insert = function(fileName, metaData, callback) {
    var filePath = './auto/pics/birds/bird_' +
                   Math.floor(Math.random() * (30 - 1) + 1) + '.jpg';

    insertPic(fileName, filePath, metaData, function(fileId) {
        callback(fileId);
    });
};
