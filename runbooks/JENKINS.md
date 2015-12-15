### Jenkins
Runbook for Jenkins. All of these commands require shell access on the server.

```shell
$ ssh -i PRIVATE_KEY_PATH amgg@73.227.187.84
```
##### Jenkins persistent data
Unlike Mongo, Jenkins really requires a persistent data store to run. You can spin one up following the same procedure for building a mongo-data container, the Jenkins persistent volume is another data container just like Mongo's. Location: `docker/jenkins/data/`.

##### Starting Jenkins
A shell script is provided at `docker/jenkins/jenkins/start-jenkins.sh`. Run it with

```shell
$ sh start-jenkins.sh
```

##### Building and Running Slaves
Jenkins slaves are Docker containers running on the test server. They connect over ssh to Jenkins master and are tasked with jobs based on labels.

If you need a slave with new dependencies, create a new folder in `docker/jenkins/slaves/` that is descriptive of this new slave's role.

Create and Edit a Dockerfile following the same conventions in `docker/jenkins/slaves/Dockerfile`, adding any dependencies you require.

Build and run the slave and push it to your feature branch for merging when you're ready for a code review.
