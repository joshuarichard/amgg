var crypto = require('crypto');
var nconf = require('nconf');
var mongo = require('../data/mongo.js');

nconf.file({
    file: './config.json'
});

mongo.find({'niños_patrocinadoras':{$ne:null}}, nconf.get('mongo:donorCollection'), 10000, false, function(donorDocs) {
    console.log(JSON.stringify(donorDocs));

    for (var i = 0; i < donorDocs.length; i++) {
        delete donorDocs[i].transacciones;
        delete donorDocs[i].password;
        delete donorDocs[i].salt;
    }

    console.log('===================================================');
    console.log(donorDocs);
});
