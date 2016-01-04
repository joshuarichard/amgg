2015 Gordon College Senior Project

Jake Buettner, Joshua Richard, and Dane Vanden Berg

Preliminary system documentation for this project can be found in `planning/`

### dependencies
node, npm, and grunt

### building
`npm install` in the root dir

### running
`node app.js` also in the root dir

### dev workflow
1. read about your assigned issue
2. create a new branch called GHxx where `xx` is the issue number
3. `git fetch` the latest changes
4. `git checkout YOUR_BRANCH`
5. make your changes
6. run `grunt checkstyle` to lint your code
7. `git add FILES_TO_COMMIT`
8. `git commit`
9. add a commit message
10. `git push`

### branch isn't up to date with master?
1. `git fetch` the latest changes to the remote repo
2. `git stash` if you have any changes on your branch
3. `git checkout master`
4. `git pull` apply the latest changes to master
5. `git checkout YOUR_BRANCH`
6. `git rebase master`
7. `git stash apply` put back your branch changes
all done, nice work.

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
