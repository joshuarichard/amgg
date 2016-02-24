var nodemailer = require('nodemailer');

var exports = module.exports = {};

exports.email = function(toAddress, callback) {
    // create reusable transporter object using the default SMTP transport
    var transporter = nodemailer.createTransport('smtps://eos.josh.richard@gmail.com:Daisy3009@smtp.gmail.com');

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: 'AMG Guatemala <eos.josh.richard@gmail.com>',
        to: toAddress,
        subject: 'Thank you for your sponsorship',
        text: 'You sponsored a child. Nice work!!!!!!!!!!'
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message sent: ' + JSON.stringify(info));
        callback();
    });
};
