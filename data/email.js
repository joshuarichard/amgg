var nodemailer = require('nodemailer');
var nconf = require('nconf');

nconf.file({
    file: './config.json'
});

var adminEmail = nconf.get('admin:email');
var adminPassword = nconf.get('admin:password');

var exports = module.exports = {};

exports.email = function(toAddress, header, body, callback) {
    // create reusable transporter object using the default SMTP transport
    var transporter = nodemailer.createTransport('smtps://' + adminEmail + ':' + adminPassword + '@smtp.gmail.com');

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: 'AMG Guatemala <' + adminEmail + '>',
        to: toAddress,
        subject: header,
        text: body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error){
        if(error){
            callback(false);
        }
        callback(true);
    });
};
