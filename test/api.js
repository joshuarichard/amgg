/* eslint-env mocha */

var expect = require('chai').expect;
var supertest = require('supertest');
var api = supertest('https://localhost:3000/api/v1');
var jwt = require('jsonwebtoken');
var nconf = require('nconf');
var password = require('../data/password.js');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

nconf.file({
    file: './config.json'
});

// unsponsored child pool
var ids = [];
var donorID = '';
var donorToken = '';

describe('child api should', function() {
    it ('return unsponsored children in JSON', function(done) {
        var ors = [{
            '$or': [{'status': 'Waiting for Sponsor - No Prior Sponsor'},
                    {'status': 'Waiting for Sponsor - Discontinued'},
                    {'status': 'Additional Sponsor Needed'}]
        }];

        var selector = {};
        selector['$and'] = ors;

        api.get('/children/find/' + JSON.stringify(selector))
           .end(function(err, res) {
               expect(err).to.be.null;
               expect(res.status).to.equal(200);

               var kids = res.body;
               for (var id in kids) {
                   expect(id.length).to.equal(24);
                   expect(kids[id].hasOwnProperty('nombre')).to.be.true;
                   expect(kids[id].hasOwnProperty('años')).to.be.true;
                   expect(kids[id].hasOwnProperty('cumpleaños')).to.be.true;
                   expect(kids[id].hasOwnProperty('centro_de_ninos'))
                                                                    .to.be.true;
                   expect(kids[id].hasOwnProperty('provincia')).to.be.true;
                   ids.push(id);
               }
               done();
           });
    });

    it ('get info for an unsponsored child', function(done) {
        var random = Math.floor(Math.random() * ids.length);
        api.get('/children/id/' + ids[random])
           .end(function(err, res) {
               expect(err).to.be.null;
               expect(res.status).to.equal(200);

               var kid = res.body[ids[random]];
               expect(kid.hasOwnProperty('nombre')).to.be.true;
               expect(kid.hasOwnProperty('años')).to.be.true;
               expect(kid.hasOwnProperty('cumpleaños')).to.be.true;
               expect(kid.hasOwnProperty('centro_de_ninos')).to.be.true;
               expect(kid.hasOwnProperty('provincia')).to.be.true;
               done();
           });
    });

    it ('get a picture for an unsponsored child', function(done) {
        this.timeout(5000);
        var random = Math.floor(Math.random() * ids.length);
        api.get('/pictures/id/' + ids[random])
           .end(function(err, res) {
               expect(err).to.be.null;
               expect(res.status).to.equal(200);

               var kid = res.body;
               expect(kid.hasOwnProperty('id')).to.be.true;
               expect(kid.hasOwnProperty('data')).to.be.true;
               done();
           });
    });

    it ('fail if getting a picture with a bad child id', function(done) {
        api.get('/pictures/id/badbadbadbadbadbadbadbad')
           .end(function(req, res) {
               expect(res.status).to.equal(500);
               expect(res.body.success).to.be.false;
               done();
           });
    });

    /* need to handle this error before testing it
    it ('return an error if trying to get a child with a bad 24 char id',
        function(done) {
            api.get('/children/id/badbadbadbadbadbadbadbad')
               .end(function(err, res) {
                   expect(err).to.be.null;
                   expect(res.status).to.equal(what?);

                   done();
               });
        });
    */
});

var sponsoredKids = [];
var donor = {};
describe('donor api should', function() {
    it ('sponsor three children and create a new donor', function(done) {
        this.timeout(5000);
        donor = {
            'nombre': 'test',
            'apellido': 'testing',
            'teléfono': '1-800-testing',
            'calle': 'test city',
            'ciudad': '2 test lane',
            'país': 'Testing',
            'correo_electrónico': 'test@testing.com',
            'password': 'testing',
            'niños_patrocinadoras': [
                ids[Math.floor(Math.random() * ids.length)],
                ids[Math.floor(Math.random() * ids.length)],
                ids[Math.floor(Math.random() * ids.length)]
            ]
        };

        api.post('/donor/sponsor')
           .send(donor)
           .end(function(err, res) {
               expect(err).to.be.null;
               expect(res.status).to.equal(200);
               expect(res.body['success']).to.be.true;
               done();
           });
    });

    it ('get a json web token with valid donor credentials', function(done) {
        var donorGetToken = {
            'correo_electrónico': 'test@testing.com',
            'password': 'testing'
        };

        api.post('/donor/auth')
           .send(donorGetToken)
           .end(function(err, res) {
               expect(err).to.be.null;

               expect(res.status).to.equal(200);
               expect(res.body['success']).to.be.true;
               expect(res.body['id'].length).to.equal(24);

               jwt.verify(res.body['token'], nconf.get('auth:secret'),
                   function(err) {
                       expect(err).to.be.null;
                       donorID = res.body['id'];
                       donorToken = res.body['token'];
                       done();
                   });
           });
    });

    it ('get the donor\'s document with a valid id and token', function(done) {
        var donorGet = {
            'token': donorToken
        };

        api.post('/donor/id/' + donorID)
           .send(donorGet)
           .end(function(err, res) {
               sponsoredKids = res.body['niños_patrocinadoras'];

               expect(err).to.be.null;
               expect(res.status).to.equal(200);
               expect(donor['nombre']).to.equal(res.body['nombre']);
               expect(donor['apellido']).to.equal(res.body['apellido']);
               expect(donor['teléfono']).to.equal(res.body['teléfono']);
               expect(donor['calle']).to.equal(res.body['calle']);
               expect(donor['ciudad']).to.equal(res.body['ciudad']);
               expect(donor['país']).to.equal(res.body['país']);
               expect(donor['correo_electrónico'])
                                 .to.equal(res.body['correo_electrónico']);
               done();
           });
    });

    it ('unsponsor one of the children', function(done) {
        var unluckyKid = sponsoredKids[
                              Math.floor(Math.random() * sponsoredKids.length)];

        var donorUnsponsor = {
            'id': donorID,
            'token': donorToken,
            'child_unsponsoring': unluckyKid
        };
        api.post('/donor/unsponsor')
           .send(donorUnsponsor)
           .end(function(err, res) {
               expect(res.body['success']).to.be.true;
               expect(res.body['message']).to.equal('Child unsponsored.');
               done();
           });
    });

    it ('return an error when logging in with a bad password', function(done) {
        var donorBadpw = {
            'correo_electrónico': 'test@testing.com',
            'password': 'bad password'
        };

        api.post('/donor/auth')
           .send(donorBadpw)
           .end(function(err, res) {
               expect(err).to.be.null;
               expect(res.status).to.equal(401);
               expect(res.body['success']).to.be.false;
               done();
           });
    });

    it ('returns an error when logging in with a bad email', function(done) {
        var donorBademail = {
            'correo_electrónico': 'bad@email.com',
            'password': 'bad password'
        };

        api.post('/donor/auth')
           .send(donorBademail)
           .end(function(err, res) {
               expect(err).to.be.null;
               expect(res.status).to.equal(401);
               expect(res.body['success']).to.be.false;
               done();
           });
    });

    it ('delete the donor just inserted', function(done) {
        this.timeout(5000);
        var donorDeleting = {
            'id': donorID
        };

        api.post('/donor/delete')
           .send(donorDeleting)
           .end(function(err, res) {
               expect(err).to.be.null;
               expect(res.status).to.equal(200);
               expect(res.body['success']).to.be.true;
               done();
           });

    });
});
