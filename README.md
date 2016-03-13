# amgg child sponsorship
2015 Gordon College Senior Project

Jake Buettner, Joshua Richard, and Dane Vanden Berg

 Preliminary system documentation for this project can be found in `planning/`

### Dependencies
Node and npm are required to build this system.

```shell
$ sudo apt-get install nodejs
$ brew install nodejs
```

or just go here and run an installer: https://nodejs.org/en/download/

You must also have access to an instance of MongoDB, however you're welcome to use our instance as long as you make sure you change the names of the collections you will be using.

Our server's IP address is `73.227.187.84`. MongoDB is running on the default port `27017`.

### Building
Run `npm install` to install all dependencies.

Unzip the two keys and put them in a folder called `keys/` in the root directory of the project.

### Configuration
To configure the system, you need to edit a couple of things in the `config.json` file.

Firstly, and this is **very, very important** - change name of the database you're working with in the config file. *Please change the name of the database to your name.* This will ensure that it does not interfere with our own development environment. The two places you need to removed the current database **endgame** and add in your name are `mongo:db` and `autofill:db`. Below is an example.

Additionally, you'll need to add your email and password to the `admin:email` and `admin:password` entries.

```json
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
Bunyan is used for server side logging. All log files are stored in `var/log/`.

### Database
Mongo runs in a Docker container on our test server. See `runbooks/MONGO.md` for more information.

### Runbooks
Developer runbooks are provided in `runbooks/`. Read these for information on different aspects of our system.

### Continuous Integration
We use Jenkins running in a Docker container on our test server for automated testing and pull request linting.

### Development Utilities
A separate repository contains development docker containers. Find it here: https://github.com/joshuarichard/amgg-docker
