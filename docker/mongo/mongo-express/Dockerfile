FROM ubuntu:14.04
MAINTAINER Joshua Richard <eos.josh.richard@gmail.com>

RUN apt-get update && apt-get install -y \
    nodejs \
    npm

RUN ln -s /usr/bin/nodejs /usr/local/bin/node

RUN npm install -g mongo-express

RUN cd /usr/local/lib/node_modules/mongo-express && \
    cp config.default.js config.js

ENV ME_CONFIG_BASICAUTH_USERNAME="x"
ENV ME_CONFIG_BASICAUTH_PASSWORD="x"

EXPOSE 8081

CMD ["/usr/local/bin/mongo-express", "-test"]
