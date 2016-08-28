var nodemailer = require('nodemailer');
var nconf = require('nconf');
var argv = require('minimist')(process.argv.slice(2));
var crypto = require('crypto');
var bunyan = require('bunyan');

var decrypt = require('./decrypt.js');

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

var ADMIN_EMAIL = '';
var ADMIN_PASSWORD = '';

decrypt.email(argv.password, function(decryptedEmail) {
    if (decryptedEmail.hasOwnProperty('err')) {
        log.error(decryptedEmail.err);
        process.exit();
    }

    ADMIN_EMAIL = decryptedEmail.decryptedEmail[0];
    ADMIN_PASSWORD = decryptedEmail.decryptedEmail[1];
});

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
