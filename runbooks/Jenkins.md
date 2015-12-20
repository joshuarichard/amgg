### Jenkins
Runbook for Jenkins. All of these commands require shell access on the server.

```shell
$ ssh -i PRIVATE_KEY_PATH amgg@73.227.187.84
```

##### Starting Jenkins
```shell
cd /home/amgg/jenkins/server
sh start-jenkins.sh
```
Jenkins will automatically connect to the correct data volume with the `start-jenkins.sh` script.

If after running `sh start-jenkins.sh` you get an error saying that a container with that name already exists, just delete that container with the ID the error message will give you by doing `docker rm ID_OF_JENKINS_TO_DELETE`. It's ok, you're not deleting any important data, that's all stored in a different data volume.

Once you've done this, make sure that Jenkins knows it's IP address by doing the following:

1. `docker ps` to get the container ID for jenkins
2. `docker inpsect JENKINS_CONTAINER_ID` to get the IP address. likely will be a 172.17.x.x
3. go to http://73.227.187.84:8043/configure/
4. Edit the Jenkins Location => Jenkins URL with the IP you got from the docker inspect and port number 8080.

Do this so slaves can correctly connct to Jenkins.

##### Building and Running Slaves
Jenkins slaves are Docker containers running on the test server. They connect over ssh to Jenkins master and are tasked with jobs based on labels.

If you need a slave with new dependencies, create a new folder in `docker/jenkins/slaves/` that is descriptive of this new slave's role.

Create and Edit a Dockerfile following the same conventions in `docker/jenkins/slaves/Dockerfile`, adding any dependencies you require.

Build and run the slave and push it to your feature branch for merging when you're ready for a code review.
