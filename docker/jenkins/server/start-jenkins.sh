#!/bin/bash

docker run \
    -p 8043:8080 \
    -p 50000:50000 \
    --name=jenkins-master \
    --volumes-from=jenkins-data \
    -d \
    jenkins-server
