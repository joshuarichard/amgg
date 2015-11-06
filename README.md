### amg-m4c
Repo for work done in 2015-16 Josh, Dane, Jake

### dependencies
node, npm, grunt

### building
`npm install` in the root directory

### running
`node app.js`

### dev workflow
make changes to your branch.
run `grunt checkstyle` to lint your code
`git add FILES_TO_COMMIT`
`git commit`
add a commit message
`git push`

if your branch is not up to date with master:
`git fetch` the latest changes to the remote repo
`git stash` if you have any changes on your branch
`git checkout master`
`git pull` apply the latest changes to master
`git checkout YOUR_BRANCH`
`git rebase master`
`git stash apply` put back your branch changes
all done, nice work.
