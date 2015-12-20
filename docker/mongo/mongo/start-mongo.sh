#!/bin/bash

docker run \
       -p 27017:27017 \
       --name $1 \
       --volumes-from=$2 \
       -d \
       mongodb
