/* eslint-env node */
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var fs = require('fs');

var nconf = require('nconf');
nconf.env()
     .file({ file: 'config.json'});

var dbName = nconf.get('autofill:db');
var collectionName = nconf.get('autofill:childCollection');
var numOfDocs = nconf.get('autofill:numOfDocs');

var url = 'mongodb://' + nconf.get('mongo:host') + ':' + nconf.get('mongo:port') + '/' + dbName;

console.log('Importing ' + numOfDocs + ' documents into db:' + dbName + ' and collection:' + collectionName + ' at ' + url + '.');

var centro_de_ninos = [
    'Filadelfia Childcare Center', 'Getsemani Childcare Center',
    'Las Vistas Childcare Center', 'Matochos Childcare Center',
    'Oratorio Childcare Center', 'Yalu Nim Jay Childcare Center'
];

var status = [
    'New Child - In Process', 'Sponsored',
    'Waiting for Sponsor - No Prior Sponsor',
    'Waiting for Sponsor - Discontinued', 'Additional Sponsor Needed'
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

var departamento = [
    'Alta Verapaz', 'Baja Verapaz', 'Chimaltenango', 'Chiquimula',
    'El Progreso', 'Escuintla', 'Guatemala', 'Huehuetenango',
    'Izabal', 'Jalapa', 'Jutiapa', 'Peten', 'Quetzaltenango',
    'Quiche', 'Retalhuleu', 'Sacatepequez', 'San Marcos',
    'Santa Rosa', 'Solola', 'Suchitepequez', 'Totonicapan',
    'Zacapa'
];

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
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
    for (var b = 0; b < street_length; b++) {
        address += lower_letters.charAt(Math.floor(Math.random() * lower_letters.length));
    }

    address += ' ';
    address += type[Math.floor(Math.random() * type.length)];

    return address;
}

function generateDocument(callback) {
    var birthday = randomDate(new Date(2000, 0, 1), new Date());
    var amgId = Math.floor((Math.random() * 99999999) + 1);
    var name = nombre[Math.floor(Math.random() * nombre.length)];
    var lastName = apellido[Math.floor(Math.random() * apellido.length)];

    var filePath = './auto/pics/kids/kid_' + randomNumber(5, 20) + '.jpg';
    var picture = Buffer(fs.readFileSync(filePath)).toString('base64');

    console.log('INFO: inserting ' + name + ' ' + lastName + ' with amg_id ' + amgId);

    var doc = {
        'estado': status[Math.floor(Math.random() * status.length)],
        'nombre': name,
        'segundo_nombre': nombre[Math.floor(Math.random() * nombre.length)],
        'apellido': lastName,
        'género': genero[Math.floor(Math.random() * genero.length)],
        'cumpleaños': birthday,
        'centro_de_niños' : centro_de_ninos[Math.floor(Math.random() * centro_de_ninos.length)],
        'direccion_de_casa': generateAddress(),
        'ciudad': ciudad[Math.floor(Math.random() * ciudad.length)],
        'departamento': departamento[Math.floor(Math.random() * departamento.length)],
        'código_postal': Math.floor((Math.random() * (99999) + 1)),
        'pasatiempos': 'Reading, playing baseball, and swinging. Other stuff too.',
        'foto': picture,
        'sueños': 'I just want to be a real boy.',
        'biodata': 'Child biodata goes here. This is where a lot of the child\'s other information will go.'
    };
    callback(doc);
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
