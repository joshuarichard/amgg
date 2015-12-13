### amgg
2015 Gordon College Senior Project
Jake Buettner, Joshua Richard, Dane Vanden Berg

Preliminary system documentation for this project can be found in `planning/`

### dependencies
node, npm, and grunt

### building
`npm install`

### running
`node app.js`

### db
mongo and mongo-express run in docker containers. see `docker/mongo`.

### development workflow
1. read about your assigned issue
2. create a new branch called GHxx where `xx` is the issue number
3. `git fetch` the latest changes
4. `git checkout YOUR_BRANCH`
5. make your changes
6. run `grunt checkstyle` to lint your code and fix any errors
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

### autofilling db
run `node auto/fill.js` from the root directory. make sure you run it from the root directory otherwise nconf doesn't know where to find the config file.

### Testing
We use jenkins running in a docker container for automated testing.

Talk to josh if you want more information on this.
