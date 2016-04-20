# AMG Guatemala Child Sponsorship
2015-2016 Gordon College Senior Project by Jake Buettner, Joshua Richard, and Dane Vanden Berg.

The purpose of this system is to provide AMG Guatemala with a web application that will allow local Guatemalan donors the opportunity to support children in their own country as part of AMGG's 2015-2020 five year plan.

Node.js, the current de facto standard among web applications, was chosen as the framework due to the high availability it offers. MongoDB was chosen firstly because AMGG's data is highly denormaized, and secondly for it's strong relationship within the MEAN stack.

Preliminary system documentation for this project can be found in `planning/`.

### Dependencies
Node and npm are required to build this system.

Linux and mac osx:
```shell
$ sudo apt-get install nodejs
$ brew install nodejs
```

Windows:
Download and run an installer: https://nodejs.org/en/download/

You must also have access to an instance of MongoDB, however you're welcome to use our instance as long as you make sure you change the names of the database you will be using. To fill a database with test data run `node auto/fill.js`.

Our server's IP address is `73.227.187.84`. MongoDB is running on the default port `27017`.

### Building
Run `npm install` to install all dependencies.

Unzip the two keys and put them in a folder called `keys/` in the root directory of the project.

Lastly, run `mkdir log` to create the log directory.

### Configuration
Everything needed to configure the system is in `config.json` in the root directory of the project.
### Running
Run `node app.js --password <PASSWORD> | bunyan` to start the application and pipe the server logs into bunyan for human readible formatting. PASSWORD should be the password used to start the system.

Go to `https://localhost:3000/` in your browser to get access to the project.

### Automated Testing
Grunt has both eslint and mocha/chai hooked up for automated testing. Currently the only written tests are those that test the REST API (found in `test/api.js`).

You'll need the grunt-cli as an added dependency for these features.

```shell
$ sudo npm install -g grunt-cli
```

Run `grunt test` to test the api. You'll need to have a running instance of the system to do this.

### Logging
Bunyan is used for server side logging. All log files are stored in `log/`.

### Database
Mongo runs in a Docker container on our test server. See `runbooks/MONGO.md` for more information.

### Continuous Integration
We use Jenkins running in a Docker container on our test server for automated testing and pull request linting.

### Development Utilities
A separate repository contains development docker containers. Find it here: https://github.com/joshuarichard/amgg-docker
Additionally an admin page is also associated with this project for managing the database as an administrator. Find this repo here: https://github.com/joshuarichard/amgg-admin-page
