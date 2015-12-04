FROM ubuntu:14.04
MAINTAINER Joshua Richard <eos.josh.richard@gmail.com>

# import public key
RUN sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10

# create a list file for mongo
RUN echo "deb http://repo.mongodb.org/apt/ubuntu precise/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list

RUN apt-get update && apt-get install -y mongodb-org

RUN mkdir -p /data/db

EXPOSE 27017

ENTRYPOINT ["/usr/bin/mongod"]
