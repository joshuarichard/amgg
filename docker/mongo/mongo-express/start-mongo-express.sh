#!/bin/bash

docker run \
       -t \
       -rm \
       -p 8081:8081 \
       --name $1 \
       --link $2:mongodb \
       mongo-express
