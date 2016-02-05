var crypto = require('crypto');

var exports = module.exports = {};

exports.encrypt = function(plaintext, callback) {
    var salt = crypto.randomBytes(128).toString('base64');
    var hash = crypto.createHmac('sha256', salt)
                     .update(plaintext)
                     .digest("hex").toString('base64');
    callback(hash, salt);
}

exports.encryptWithSalt = function(plaintext, salt, callback) {
    var hash = crypto.createHmac('sha256', salt)
                     .update(plaintext)
                     .digest("hex").toString('base64');
    callback(hash, salt);
}
