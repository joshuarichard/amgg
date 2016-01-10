/* eslint-env node */

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var pics = require('./pics.js');

var nconf = require('nconf');
nconf.env()
     .file({ file: 'config.json'});

var dbName = nconf.get('autofill:dbName');
var collectionName = nconf.get('autofill:collection');
var numOfDocs = nconf.get('autofill:numOfDocs');
var url = 'mongodb://' + nconf.get('mongo:host') + ':' +
           nconf.get('mongo:port') + '/' + dbName;

console.log('Importing ' + numOfDocs + ' documents into db:' + dbName +
            ' and collection:' + collectionName + ' at ' + url + '.');

var centro_de_ninos = [
    'Filadelfia Childcare Center', 'Getsemani Childcare Center',
    'Las Vistas Childcare Center', 'Matochos Childcare Center',
    'Oratorio Childcare Center', 'Yalu Nim Jay Childcare Center'
];

var status = [
    'New Child - In Process', 'Sponsored',
    'Waiting for Sponsor - No Prior Sponsor',
    'Waiting for Sponsor - Discontinued', 'Additional Sponsor Needed',
    'No Longer in the Program - Deleted', 'Review Requested', 'Duplicate'
];

var nombre = [
    'Sofia', 'Isabella', 'Camila', 'Valentina', 'Mariana',
    'Luciana', 'Daniela', 'Gabriela', 'Victoria', 'Martina',
    'Lucia', 'Sara', 'Samanatha', 'Maria Jose', 'Emma', 'Catalina',
    'Julieta', 'Mia', 'Antonella', 'Renata', 'Emilia', 'Natalia',
    'Zoe', 'Santiago', 'Sebastian', 'Matias', 'Mateo', 'Nicolas',
    'Diego', 'Samuel', 'Benjamin', 'Daniel', 'Lucas', 'Joaguin',
    'Tomas', 'Gabriel', 'Martin', 'David', 'Emiliano', 'Emmanuel',
    'Agustin', 'Juan', 'Pablo', 'Jose', 'Andres', 'Thiago', 'Leonardo',
    'Felipe', 'Angel', 'Maximiliano', 'Christopher', 'Juan Diego',
    'Diego', 'Nicole', 'Paula', 'Amanda', 'Maria Fernanda', 'Emily',
    'Elena', 'Manuela', 'Juana', 'Alejandra', 'Antonia', 'Guadalupe',
    'Agustina', 'Maria'
];

var apellido = [
    'Garcia', 'Rodriguez', 'Hernandez', 'Lopez', 'Gonzalez', 'Perez',
    'Sanchez', 'Torres', 'Ramirez', 'Gomez', 'Diaz', 'Reyes', 'Cruz',
    'Guitierrez', 'Ramos', 'Alvarez', 'Mendoza', 'Castillo', 'Jimenez',
    'Moreno', 'Romero', 'Herrera', 'Vega'
];

var genero = [
    'masculino',
    'mujer'
];

var ciudad = [
    'Guatemala City', 'Mixco', 'Quetzaltenango', 'San Miguel Petapa',
    'Escuintla', 'San Juan Sacatepequez', 'Villa Canales',
    'Chinaulta', 'Chimaltenango', 'Amatitlan', 'Huehuetenango',
    'Santa Lucia Cotzumalguapa', 'Puerto Barrios', 'Coban',
    'Chichicastenango', 'Sant Catarina Pinula', 'Totonicapan',
    'Coatepeque', 'Mazatenango', 'Jalapa', 'Chiquimula', 'Retalhuleu',
    'San Francisco El Alto', 'Antigua Guatemala', 'San Pedro Sacatepequez',
    'San Jose Pinula', 'Solola', 'Zacapa', 'San Pedro Ayampuc', 'Jutiapa',
    'Ciudad Vieja', 'San Benito', 'Palin', 'Barberena', 'Jacaltenango',
    'Momostenango', 'Ostuncalco', 'Santa Cruz del Quiche', 'San Marcos'
];

var provincia = [
    'Alta Verapaz', 'Baja Verapaz', 'Chimaltenango', 'Chiquimula',
    'El Progreso', 'Escuintla', 'Guatemala', 'Huehuetenango',
    'Izabal', 'Jalapa', 'Jutiapa', 'Peten', 'Quetzaltenango',
    'Quiche', 'Retalhuleu', 'Sacatepequez', 'San Marcos',
    'Santa Rosa', 'Solola', 'Suchitepequez', 'Totonicapan',
    'Zacapa'
];

var ocupacion = [
    'plumber', 'mailman', 'firefighter', 'computer programmer', 'dogwatcher',
    'police officer', 'carpenter', 'accountant', 'writer', 'poet', 'musician',
    'detective', 'circus clown', 'dentist', 'vet', 'zookeeper',
    'animal trainer', 'nanny', 'maid', 'gardener', 'butler', 'contracter',
    'actor', 'director', 'producer', 'editor', 'teacher', 'principal',
    'janitor', 'car salesman', 'manager', 'president'
];

var padres = [
    'padre',
    'madre',
    'abuelo',
    'abuela',
    'tio',
    'tia',
    'hermano',
    'hermana'
];

var abscent = [
    'true',
    'false'
];

var religion_de_la_familia = [
    'Christianity',
    'Buddhism',
    'Islam',
    'Hinduism',
    'Atheism',
    'Baha\'i'
];

var church = [
    'Red Church',
    'Blue Church',
    'Green Church',
    'Orange Church',
    'Black Church',
    'White Church',
    'Brown Church',
    'Purple Church'
];

var estado_civil_de_los_padres = [
    'Married',
    'Divorced'
];

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() *
                   (end.getTime() - start.getTime()));
}

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function generateAddress() {
    var address = '';
    var numbers = '0123456789';
    var upper_letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var lower_letters = 'abcdefghijklmnopqrstuvwxyz';
    var type = ['Street', 'Ave', 'Lane', 'Circle', 'Drive'];

    var number_length = randomNumber(1, 5);
    for(var a = 0; a < number_length; a++) {
        address += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    address += ' ';
    address += upper_letters[Math.floor(Math.random() * upper_letters.length)];

    var street_length = randomNumber(3, 15);
    for(var b = 0; b < street_length; b++) {
        address += lower_letters.charAt(Math.floor(Math.random() *
                   lower_letters.length));
    }

    address += ' ';
    address += type[Math.floor(Math.random() * type.length)];

    return address;
}

// generate random number of guardian mini-documents
function generateGuardians() {
    var guardians = {};
    var numOfGuardians = randomNumber(1, 4);
    for(var x = 0; x < numOfGuardians; x++) {
        var guardian = {
            'relacion': padres[Math.floor(Math.random() * padres.length)],
            'nombre': nombre[Math.floor(Math.random() * nombre.length)],
            'apellido': apellido[Math.floor(Math.random() * apellido.length)],
            'ocupación': ocupacion[Math.floor(Math.random() *
                         ocupacion.length)],
            'ingreso_mensual_en_usd': Math.floor((Math.random() * 100000) + 1),
            'cumpleaños': randomDate(new Date(1950, 00, 01),
                                     new Date(2000, 00, 01))
        };
        guardians['guardian_' + x] = guardian;
    }
    return guardians;
}

// generate random number of hermanos mini-documents
function generateHermanos() {
    var hermanos = {};
    var numOfHermanos = randomNumber(1, 4);
    for(var x = 0; x < numOfHermanos; x++) {
        var hermano = {
            'nombre': nombre[Math.floor(Math.random() * nombre.length)],
            'apellido': apellido[Math.floor(Math.random() * apellido.length)],
            'cumpleaños': randomDate(new Date(1990, 00, 01), new Date()),
            'grado_u_ocupación': randomNumber(0, 12),
            'género': genero[Math.floor(Math.random() * genero.length)],
            'status': status[Math.floor(Math.random() * status.length)],
            'amg_id':  Math.floor((Math.random() * 99999999) + 1),
            'alt_id': Math.floor((Math.random() * 99999999) + 1)
        };
        hermanos['hermanos_' + x] = hermano;
    }
    return hermanos;
}

function generateDocument(callback) {
    var birthday = randomDate(new Date(2000, 0, 1), new Date());
    var amgId = Math.floor((Math.random() * 99999999) + 1);
    var name = nombre[Math.floor(Math.random() * nombre.length)];
    var lastName = apellido[Math.floor(Math.random() * apellido.length)];

    console.log('INFO: inserting ' + name + ' ' + lastName +
                ' with amg_id ' + amgId);

    // insert picture for this child and get the image_id
    pics.insert(name + '_' + lastName, { amg_id: amgId}, function(fileId) {
        var doc = {
            'amg_id':  amgId,
            'alt_id': Math.floor((Math.random() * 99999999) + 1),
            'image_id': fileId,
            'status': status[Math.floor(Math.random() * status.length)],
            'patrocinado_por': randomDate(new Date(2005, 00, 01), new Date()),
            'nombre': name,
            'segundo_nombre': nombre[Math.floor(Math.random() * nombre.length)],
            'apellido': lastName,
            'género': genero[Math.floor(Math.random() * genero.length)],
            'cumpleaños': birthday,
            'años': Math.abs((new Date(Date.now() - birthday.getTime()))
                                                    .getUTCFullYear() - 1970),
            'centro_de_ninos' : centro_de_ninos[Math.floor(Math.random() *
                                centro_de_ninos.length)],
            'direccion_de_casa': generateAddress(),
            'ciudad': ciudad[Math.floor(Math.random() * ciudad.length)],
            'provincia': provincia[Math.floor(Math.random() *
                                   provincia.length)],
            'código_postal': Math.floor((Math.random() * (99999) + 1)),
            'patrocinador_id': Math.floor((Math.random() * (99999) + 1)),
            'patrocinador_nombre': nombre[Math.floor(Math.random() *
                                   nombre.length)],
            'última_actualización': randomDate(new Date(2013, 00, 01),
                                               new Date()),
            'abscent_padre': abscent[Math.floor(Math.random() *
                                     abscent.length)],
            'abscent_madre': abscent[Math.floor(Math.random() *
                                     abscent.length)],
            'religión_de_la_familia': religion_de_la_familia[Math.floor(
                                      Math.random() *
                                      religion_de_la_familia.length)],
            'iglesia_de_la_familia': church[Math.floor(Math.random() *
                                     church.length)],
            'estado_civil_de_los_padres': estado_civil_de_los_padres[
                                          Math.floor(Math.random() *
                                          estado_civil_de_los_padres.length)],
            'comidas_al_día_en_el_hogar': randomNumber(0, 3),
            'guardians': generateGuardians(),
            'hermanos': generateHermanos()
        };
        callback(doc);
    });
}

var insertDocument = function(db, callback) {
    generateDocument(function(doc) {
        db.collection(collectionName).insertOne(doc, function(err, result) {
            assert.equal(err, null);
            callback(result);
        });
    });
};

// this for loop controls basically the entire operation
for (var x = 0; x < numOfDocs; x++) {
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        insertDocument(db, function() {
            db.close();
            console.log('INFO: inserted document.');
        });
    });
}
