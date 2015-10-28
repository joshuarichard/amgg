#!/bin/bash

docker run -d \
    -p 8080:8080 \
    --volumes-from jenkins-volume --name jenkinsserver amg/jenkins-server
