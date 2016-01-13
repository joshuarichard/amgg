### amgg
2015 Gordon College Senior Project

Jake Buettner, Joshua Richard, and Dane Vanden Berg

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
Run `node app.js | bunyan` to start the application and pipe the server logs into bunyan for human readible formatting. Go to `localhost:3000/home` in your browser to get access to the project.

### Database
Mongo and Mongo-Express run in Docker containers on our test server. see `runbooks/MONGO.md` for more information.

### Logging
Bunyan is used for server side logging. All log files are stored in `var/log/`.

### Runbooks
Developer runbooks are provided in `runbooks/`. Read these for information on different aspects of our system.

### Testing
We use Jenkins running in a Docker container on our test server for automated testing and pull request linting.

### Development Utilities
A separate repository contains development docker containers. Find it here: https://github.com/joshuarichard/amgg-docker
