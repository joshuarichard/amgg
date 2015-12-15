### amgg
2015 Gordon College Senior Project
Jake Buettner, Joshua Richard, Dane Vanden Berg

Preliminary system documentation for this project can be found in `planning/`

### Dependencies
Node, npm, and grunt-cli are all required to build this system.

```shell
$ sudo apt-get install nodejs
$ sudo npm install -g grunt-cli
```

### Building
Run `npm install` to install all dependencies.

### Running
Run `node app.js` and go to `localhost:3000/home` in your browser.

### Database
Mongo and Mongo-Express run in Docker containers on our test server. see `runbooks/MONGO.md` and `docker/mongo/` for more information.

### Runbooks
Developer runbooks are provided in `runbooks/`. Read these for information on different aspects of our system.

### Autofilling Mongo
Run `node auto/fill.js` from the root directory. Make sure you run it from the root directory otherwise nconf doesn't know where to find the config file. An example JSON document can be found in `auto/example.json`.

### Testing
We use Jenkins running in a Docker container on our test server for automated testing and pull request linting.
