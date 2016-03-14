# AMG Guatemala Child Sponsorship
2015-2016 Gordon College Senior Project by Jake Buettner, Joshua Richard, and Dane Vanden Berg.

The purpose of this system is to provide AMG Guatemala with a new web application and database that will allow local Guatemalan donors the opportunity to support children in their own country as part of AMGG's 2015-2020 five year plan. Node.js, the current de facto standard among web applications, was chosen as the framework due to the high availability it offers. MongoDB was chosen for persistant storage due to it's seamless integration with Node.js and it's ease of use.

An additional goal of this project is to help AMG Guatemala better focus their aid efforts through computed analytics on the child data they have stored. Although it is still unknown if there will be time at the end of the core functionality development for additional work done with analytics, the system will be designed with this option available by further development teams. At the very least, web analytics will be incorporated into the web application using Google Analytics.

Preliminary system documentation for this project can be found in `planning/`.

### Dependencies
Node and npm are required to build this system.

For linux and mac osx:
```shell
$ sudo apt-get install nodejs
$ brew install nodejs
```

For windows:
Download and run an installer: https://nodejs.org/en/download/

You must also have access to an instance of MongoDB, however you're welcome to use our instance as long as you make sure you change the names of the database you will be using.

Our server's IP address is `73.227.187.84`. MongoDB is running on the default port `27017`.

### Building
Run `npm install` to install all dependencies.

Unzip the two keys and put them in a folder called `keys/` in the root directory of the project.

Lastly, run `mkdir log` to create the log directory.

### Configuration
To configure the system, you need to edit a couple of things in the `config.json` file.

Firstly, and this is **very, very important** - change name of the database you're working with in the config file. *Please change the name of the database to your name.* This will ensure that it does not interfere with our own development environment. The two places you need to remove the current database **endgame** and add in your own name are `mongo:db` and `autofill:db`. See below for clarification.

Additionally, you'll need to add your email and password to the `admin:email` and `admin:password` entries.

```javascript
{
    "mongo": {
        "host": "73.227.187.84",
        "port": "27017",
        "username": "x",
        "password": "x",
        "db": "endgame",    // put your name here
        "childCollection": "children",
        "donorCollection": "donors",
        "cartCollection": "carts"
    },
    "app": {
        "port": 3000
    },
    "autofill": {
        "db": "endgame",    // put your name here
        "childCollection": "children",
        "donorCollection": "donors",
        "numOfDocs": "10"
    },
    "auth": {
        "secret": "x"
    },
    "keys": {
        "key": "./keys/key.pem",
        "cert": "./keys/cert.pem"
    },
    "admin": {
        "email": "eos.josh.richard@gmail.com",  // put your email here
        "password": "x"    // put your email password here
    }
}
```

### Running
Run `node app.js | bunyan` to start the application and pipe the server logs into bunyan for human readible formatting. Go to `https://localhost:3000/` in your browser to get access to the project.

### Automated Testing
Grunt has both eslint and mocha/chai hooked up for automated testing. Currently the only written tests are those that test the REST API (found in `test/api.js`).

You'll need the grunt-cli as an added dependency.

```shell
$ sudo npm install -g grunt-cli
```

Run `grunt test` to test the api. You'll need to have a running instance of the system to do this.

### Logging
Bunyan is used for server side logging. All log files are stored in `log/`.

### Database
Mongo runs in a Docker container on our test server. See `runbooks/MONGO.md` for more information.

### Runbooks
Developer runbooks are provided in `runbooks/`. Read these for information on different aspects of our system.

### Continuous Integration
We use Jenkins running in a Docker container on our test server for automated testing and pull request linting.

### Development Utilities
A separate repository contains development docker containers. Find it here: https://github.com/joshuarichard/amgg-docker
