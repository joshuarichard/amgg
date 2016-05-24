var nodemailer = require('nodemailer');
var nconf = require('nconf');
var argv = require('minimist')(process.argv.slice(2));
var crypto = require('crypto');
var bunyan = require('bunyan');

// bunyan options for server logs
var log = bunyan.createLogger({
    name: 'app',
    streams: [
        {
            level: 'info',
            stream: process.stdout
        }
    ]
});

nconf.file({
    file: './config.json'
});

var algorithm = 'aes-256-ctr';

// encrypt and decrypt functions taken from:
// http://lollyrock.com/articles/nodejs-encryption/
function decrypt(text, pass) {
    var decipher = crypto.createDecipher(algorithm, pass);
    var decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

if (typeof argv.password === 'undefined') {
    log.error('Add password with the --password option.');
    process.exit();
}

var decryptedEmail = decrypt(nconf.get('admin:email'), argv.password);
decryptedEmail = decryptedEmail.split('|');
var emailHash = crypto.createHash('md5')
                      .update(decryptedEmail[0] + '|' +
                              decryptedEmail[1])
                      .digest('hex');

var ADMIN_EMAIL = decryptedEmail[0];
var ADMIN_PASSWORD = decryptedEmail[1];

var exports = module.exports = {};

exports.email = function(toAddress, header, body, callback) {
    // create reusable transporter object using the default SMTP transport

    var smtpsConfig = {
        host: 'smtpout.secureserver.net',
        port: 465,
        secure: true, // use SSL
        tls: {
            rejectUnauthorized: false
        },
        auth: {
            user: ADMIN_EMAIL,
            pass: ADMIN_PASSWORD
        }
    };

    var transporter = nodemailer.createTransport(smtpsConfig);
    //var transporter = nodemailer.createTransport('smtps://' + ADMIN_EMAIL + ':' + ADMIN_PASSWORD + '@smtpout.secureserver.net');

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: 'AMG Guatemala <' + ADMIN_EMAIL + '>',
        to: toAddress,
        subject: header,
        text: body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error) {
        if(error) {
            callback(error);
        } else {
            callback(true);
        }
    });
};
