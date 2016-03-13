/* eslint-env node */

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var password = require('../data/password.js');

var nconf = require('nconf');
nconf.env()
     .file({ file: 'config.json'});

var dbName = nconf.get('autofill:db');
var collectionName = nconf.get('autofill:donorCollection');
var numOfDocs = nconf.get('autofill:numOfDocs');

var url = 'mongodb://' + nconf.get('mongo:host') + ':' +
           nconf.get('mongo:port') + '/' + dbName;

console.log('Importing ' + numOfDocs + ' documents into db:' + dbName +
            ' and collection:' + collectionName + ' at ' + url + '.');

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

function generateAddress() {
    var address = '';
    var numbers = '0123456789';
    var upper_letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var lower_letters = 'abcdefghijklmnopqrstuvwxyz';
    var type = ['Street', 'Ave', 'Lane', 'Circle', 'Drive'];

    var number_length = Math.floor(Math.random() * (5 - 1) + 1);
    for(var a = 0; a < number_length; a++) {
        address += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    address += ' ';
    address += upper_letters[Math.floor(Math.random() * upper_letters.length)];

    var street_length = Math.floor(Math.random() * (15 - 3) + 3);
    for(var b = 0; b < street_length; b++) {
        address += lower_letters.charAt(Math.floor(Math.random() *
                   lower_letters.length));
    }

    address += ' ';
    address += type[Math.floor(Math.random() * type.length)];

    return address;
}

function generateEmail() {
    var email = nombre[Math.floor(Math.random() * nombre.length)] + '@' +
                nombre[Math.floor(Math.random() * nombre.length)] + '.com';

    return email;
}

function generateDocument(callback) {
    var name = nombre[Math.floor(Math.random() * nombre.length)];
    var lastName = apellido[Math.floor(Math.random() * apellido.length)];
    var telephone = Math.floor((Math.random() * (9999999999) + 1));
    var email = generateEmail();
    var street = generateAddress();
    var city = ciudad[Math.floor(Math.random() * ciudad.length)];
    var country = provincia[Math.floor(Math.random() * provincia.length)];

    var passwordClear = 'testing';
    password.encrypt(passwordClear, function(hash, salt) {
        console.log('INFO: inserting ' + name + ' ' + lastName);

        var doc = {
            'nombre': name,
            'apellido': lastName,
            'telefono': telephone,
            'direccion_de_casa': street,
            'ciudad': city,
            'provincia': country,
            'correo_electrónico': email,
            'password': hash,
            'salt': salt
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
