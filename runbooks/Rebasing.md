### branch isn't up to date with master?
1. `git fetch` the latest changes to the remote repo
2. `git stash` if you have any changes on your branch
3. `git checkout master`
4. `git pull` apply the latest changes to master
5. `git checkout YOUR_BRANCH`
6. `git rebase master`
7. `git stash apply` put back your branch changes
