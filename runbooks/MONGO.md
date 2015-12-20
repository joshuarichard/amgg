### Mongo
Runbook for MongoDB. All of these commands require shell access on the server.

```shell
ssh -i PRIVATE_KEY_PATH amgg@73.227.187.84
```

### Most common problem
If Mongo or Mongo-Express is down, it's almost always the case that you just need to restart them. To do this...

```shell
cd /home/amgg/mongo/mongo
sh start-mongo.sh MONGO_NAME DATA_VOLUME_NAME            # make sure you put in both args
cd ../mongo-express
sh start-mongo-express MONGO_EXPRESS_NAME MONGO_NAME     # same thing, make sure you put in the args
```

### Create an entirely new Mongo
##### Mongo
If you want to spin up your own entirely new mongo instance you can do that but you'll have to do some extra work.

First, create your Mongo's data volume.
```shell
docker run --name DATA_VOLUME_NAME mongo-data
```
Next, modify the `/home/amgg/mongo/mongo/start-mongo.sh` script to include a new port number.
For example, if there is already an instance of mongo running at 27017, change the first part of the docker port mapping to 27018. The order is `host:container`. Do a `docker ps` or `nmap localhost` if you aren't sure which ports are available.

```shell
cd /home/amgg/mongo/mongo
nano start-mongo.sh
```

start-mongo.sh (change the `-p 27017:27017` to `-p 27018:27017`)
```shell
#!/bin/bash

docker run \
       -p 27017:27017 \        # port mapped as host:container
       --name $1 \             # name for the container
       --volumes-from=$2 \     # link the data volume (note uses name not id or tag)
       -d \                    # daemonize the container
       mongodb
```

After this you'll be ready to start mongo.
```shell
sh start-mongo.sh MONGO_NAME DATA_VOLUME_NAME            # make sure you put in both args
```

##### Mongo-Express
Now to start start mongo-express. You'll need to again modify the startup script if there's already mongo-express running somewhere.

start-mongo-express.sh (change the `-p 8081:8081` to `-p 8082:8081`)
```shell
#!/bin/bash

docker run \
       -t \                    # which tag to run
       -rm \                   # rm on shutdown
       -p 8081:8081 \          # port mapped as host:container
       --name $1 \             # name for the container
       --link $2:mongodb \     # link to mongo (note uses name not id or tag)
       mongo-express
```

You'll have to ask Josh to open up your new mongo-express port on LAN the test server is on.

Now, start Mongo Express.
```shell
cd ../mongo-express
sh start-mongo-express MONGO_EXPRESS_NAME MONGO_NAME     # same thing, make sure you put in the args
```

And confirm that everything's up and running:
```shell
sudo docker ps
```

Great, Mongo should now be running at `localhost:SOME_PORT` and Mongo-Express should be accessible in your browser at `localhost:SOME_PORT`.
