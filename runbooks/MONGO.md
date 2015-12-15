### mongo
Runbook for MongoDB.

### Building containers
Firstly build and run the Dockerfile in `docker/mongo/data/` with these commands

```shell
$ docker build -t mongo-data .
$ docker run --name mongo-data mongo-data
```
