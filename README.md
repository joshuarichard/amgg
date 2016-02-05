# amgg child sponsorship
2015 Gordon College Senior Project

Jake Buettner, Joshua Richard, and Dane Vanden Berg

### Dependencies
Node and npm are required to build this system.

```shell
$ sudo apt-get install nodejs
$ brew install nodejs
```

or just go here and run an installer: https://nodejs.org/en/download/

### Building
Run `npm install` to install all dependencies.

### Running
Run `node app.js | bunyan` to start the application and pipe the server logs into bunyan for human readible formatting. Go to `https://localhost:3000/home` in your browser to get access to the project.

Recently we moved from http to https so you'll need an open ssl key and cert (registered or unregistered) to run. Talk with Josh if you'd like the test one we've been using. Put it in a folder `keys/`, or you can modify `config.json` and put it anywhere you'd like.

### Database
Mongo runs in a Docker container on our test server. See `runbooks/MONGO.md` for more information.

### Development
You'll also need grunt-cli as an added dependency just for eslint.

```shell
$ sudo npm install -g grunt-cli
```

### Logging
Bunyan is used for server side logging. All log files are stored in `var/log/`.

### Runbooks
Developer runbooks are provided in `runbooks/`. Read these for information on different aspects of our system.

### Testing
We use Jenkins running in a Docker container on our test server for automated testing and pull request linting.

### Development Utilities
A separate repository contains development docker containers. Find it here: https://github.com/joshuarichard/amgg-docker
