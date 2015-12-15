### Mongo
Runbook for MongoDB. All of these commands require shell access on the server.

```shell
$ ssh -i PRIVATE_KEY_PATH amgg@73.227.187.84
```

### Building containers
##### Most common use case
If Mongo or Mongo-Express is down, it's almost always the case that you

##### Mongo persistent data
Mongo doesn't have much use without a persistent data store. This isn't always necessary, if you want to just spin up a few instances for quick testing that's fine.

You can store this persistent data in another container known in docker as a data volume.

Build and run the Dockerfile in `docker/mongo/data/`.

```shell
$ docker build -t mongo-data .
$ docker run --name YOUR_NAME_FOR_MONGO_DATA mongo-data
```

##### Mongo
An actual instance of Mongo.

Build and run the Dockerfile in `docker/mongo/mongo`.

```shell
$ docker build -t mongo .
```

Then modify `docker/mongo/mongo/start-mongo.sh` with the name you gave the mongo persistent data volume.

Example:
```shell
$ docker run \
         -p 27017:27017 \
         --name YOUR_NAME_FOR_MONGO \
         --volumes-from=YOUR_NAME_FOR_MONGO_DATA \
         -d \
         mongodb
```

Once you've modified it, run the command:
```shell
$ sh start-mongo.sh
```

If you don't want to attach a persistent volume, just pull out the `--volumes-from` option, but make sure to keep the `-p 27017:27017`, `--name`, and `-d` options.

##### Mongo express
Mongo can be accessed with the Mongo shell, but if you want to access it with a web UI then spin up a Mongo-Express container.

cd into `docker/mongo/mongo-express/` and build the container.

```shell
$ docker build -t mongo-express .
```

Start Mongo-Express with the shell script in the same directory. Put as an argument the name of your mongo container.

```shell
$ sh start-mongo-express.sh YOUR_NAME_FOR_MONGO
```

Mongo should now be running at `localhost:27017` and Mongo-Express should be accessible in your browser at `localhost:8081`.
