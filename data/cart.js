var nconf = require('nconf');

var mongo = require('./mongo.js');

nconf.file({
    file: 'config.json'
});

var exports = module.exports = {};

var cartCollection = nconf.get('mongo:cartCollection');

/** update(donorID, childIDs, callback)
 *
 * donorID  (string) - donor's _id
 * childIDs  (array) - string array of child _id's to add to cart
 * callback   (func) - callback function to execute after completion
 */
exports.update = function(donorID, childIDs, callback) {
    var cart = {
        'donor_id': donorID,
        'last_modified': new Date(),
        'niños_patrocinadoras': childIDs
    };

    mongo.find({'donor_id': donorID}, cartCollection, 1, false, function(doc) {
        if(JSON.stringify(doc) === '{}') {
            mongo.insert(cart, cartCollection, function(result) {
                callback(result);
            });
        } else {
            for (var key in doc) {
                mongo.edit(key, cart, cartCollection, function(result) {
                    callback(result);
                });
            }
        }
    });
};

exports.find = function(donorID, callback) {
    mongo.find({'donor_id': donorID}, cartCollection, 1, false, function(doc) {
        callback(doc);
    });
};

exports.delete = function(donorID, callback) {
    exports.find(donorID, function(doc) {
        for (var key in doc) {
            var cartID = key;
            mongo.delete(cartID, cartCollection, function(res) {
                if (res.hasOwnProperty('err')) {
                    callback(false);
                } else {
                    callback(true);
                }
            });
        }
    });
};

// TODO: periodically delete expired cart docs
