var nconf = require('nconf');
var bunyan = require('bunyan');

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
        "donor": donorID,
        "last_modified": new Date(),
        "children": childIDs
    };

    mongo.insert(cart, cartCollection, function(result) {
        if (result.result.ok === 1 && result.result.n === 1) {
            callback(result);
        } else {
            callback({
                success: false,
                code: result.code,
                message: result.message
            });
        }
    });
}
