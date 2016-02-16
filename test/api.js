/* eslint-env mocha */

var expect = require('chai').expect;
var supertest = require('supertest');
var api = supertest('https://localhost:3000/api/v1');
var jwt = require('jsonwebtoken');
var nconf = require('nconf');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

nconf.file({
    file: './config.json'
});

describe('child api should', function() {
    var ids = [];

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
                   expect(kids[id].hasOwnProperty('centro_de_ninos')).to.be.true;
                   expect(kids[id].hasOwnProperty('provincia')).to.be.true;
                   ids.push(id);
               }
               done();
           });
    });

    it ('get info and picture for an unsponsored child', function(done) {
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

    it ('get info and picture for an unsponsored child', function(done) {
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

    it ('get info and picture for an unsponsored child', function(done) {
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

    it ('get info and picture for an unsponsored child', function(done) {
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

    it ('get info and picture for an unsponsored child', function(done) {
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

describe('donor api should', function() {
    it ('get a json web token with valid donor credentials', function(done) {
        var donor = {
            'correo_electrónico': 'Antonia@Juan Diego.com',
            'password': 'testing'
        };

        api.post('/donor/auth')
           .send(donor)
           .end(function(err, res) {
               expect(err).to.be.null;

               expect(res.status).to.equal(200);
               expect(res.body['success']).to.be.true;
               expect(res.body['id'].length).to.equal(24);

               jwt.verify(res.body['token'], nconf.get('auth:secret'),
                   function(err) {
                       expect(err).to.be.null;
                       done();
                   });
           });
    });

    it ('return an error when logging in with a bad password', function(done) {
        var donor = {
            'correo_electrónico': 'Antonia@Juan Diego.com',
            'password': 'bad password'
        };

        api.post('/donor/auth')
           .send(donor)
           .end(function(err, res) {
               expect(err).to.be.null;
               expect(res.status).to.equal(401);
               expect(res.body['success']).to.be.false;
               done();
           });
    });

    /* GH113 to merge before this test will work
    it ('returns an error when logging in with a bad email', function(done) {
        var donor = {
            'correo_electrónico': 'bad@email.com',
            'password': 'bad password'
        };

        api.post('/donor/auth')
           .send(donor)
           .end(function(err, res) {
               expect(err).to.be.null;
               expect(res.status).to.equal(401);
               expect(res.body['success']).to.be.false;
               done();
           });
    });
    */
});
