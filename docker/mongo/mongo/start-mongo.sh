#!/bin/bash
docker run \
       -p 27017:27017 \
       --name mongo_1 \
       --volumes-from=mongo-data \
       -d \
       mongodb
