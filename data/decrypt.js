var nconf = require('nconf');
var crypto = require('crypto');

var algorithm = 'aes-256-ctr';

var exports = module.exports = {};

// encrypt and decrypt functions taken from:
// http://lollyrock.com/articles/nodejs-encryption/
function decrypt(text, pass) {
    // do a try/catch to catch the bad input string error
    var decipher = crypto.createDecipher(algorithm, pass);
    var decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function isUndefined(password) {
    if (typeof password === 'undefined') {
        return true;
    } else {
        return false;
    }
}

exports.email = function(argvPassword, callback) {
    if (isUndefined(argvPassword) === true) {
        callback({'err': 'password option not given.'});
    }

    var decryptedEmail = decrypt(nconf.get('admin:credentials'), argvPassword);
    decryptedEmail = decryptedEmail.split('|');
    var emailHash = crypto.createHash('md5')
                          .update(decryptedEmail[0] + '|' +
                                  decryptedEmail[1])
                          .digest('hex');

    if (emailHash !== decryptedEmail[2]) {
        callback({'err': 'incorrect password given at startup.'})
    } else {
        callback({'decryptedEmail': decryptedEmail});
    }
};

exports.bank = function(argvPassword, callback) {
    if (isUndefined(argvPassword) === true) {
        callback({'err': 'password option not given.'});
    }

    var decryptedBank = decrypt(nconf.get('credomatic:credentials'), argvPassword);
    decryptedBank = decryptedBank.split('|');
    var credomaticHash = crypto.createHash('md5')
                               .update(decryptedBank[0] + '|' +
                                       decryptedBank[1] + '|' +
                                       decryptedBank[2])
                               .digest('hex');

    if (credomaticHash !== decryptedBank[3]) {
        callback({'err': 'incorrect password given at startup.'})
    } else {
        callback({'decryptedBank': decryptedBank});
    }
};

exports.mongo = function(argvPassword, callback) {
    if (isUndefined(argvPassword) === true) {
        callback({'err': 'password option not given.'});
    }

    var decryptedMongo = decrypt(nconf.get('mongo:credentials'), argvPassword);
    decryptedMongo = decryptedMongo.split('|');
    var mongoHash = crypto.createHash('md5')
                          .update(decryptedMongo[0] + '|' +
                                  decryptedMongo[1])
                          .digest('hex');

    if (mongoHash !== decryptedMongo[2]) {
        callback({'err': 'incorrect password given at startup.'})
    } else {
        callback({'decryptedBank': decryptedMongo});
    }
};
