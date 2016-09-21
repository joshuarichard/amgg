var crypto = require('crypto');
var nconf = require('nconf');
var mongo = require('../data/mongo.js');
var csvWriter = require('csv-write-stream');
var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');

var writer = csvWriter({sendHeaders: false});

nconf.file({
    file: './config.json'
});

function decrypt(text) {
    var decipher = crypto.createDecipher('aes-256-ctr', argv.password)
    var dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
    return dec;
}

mongo.find({'niños_patrocinadoras':{$ne:null}}, nconf.get('mongo:donorCollection'), 10000, false, function(donorDocs) {
    var donor = {};
    writer.pipe(fs.createWriteStream('donor_payments_' + new Date() + '.csv'));

    for (var i = 0; i < donorDocs.length; i++) {
        donor = {};

        var date = new Date();
        var exp = decrypt(donorDocs[i].expiration);

        donor.one = 1;
        donor.name = donorDocs[i].nombre + ' ' + donorDocs[i].apellido;
        donor.ref = 'Padrino ' + (i + 1);
        donor.ccnumber = decrypt(donorDocs[i].ccnumber);
        donor.exp = exp.slice(0,2) + '20' + exp.slice(2, 4);
        donor.amount = 200 * donorDocs[i].niños_patrocinadoras.length;
        donor.date = date.getDate().toString() + (date.getMonth() + 1).toString() + date.getFullYear().toString().replace('20', '');
        donor.email = donorDocs[i].correo_electrónico;
        writer.write(donor);
    }

    writer.end();
});
