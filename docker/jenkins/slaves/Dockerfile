FROM ubuntu:14.04
MAINTAINER Joshua Richard <eos.josh.richard@gmail.com>

RUN apt-get update && \
    apt-get install -y \
    openjdk-7-jdk \
    git \
    wget

RUN wget -O /var/tmp/swarm-client.jar http://maven.jenkins-ci.org/content/repositories/releases/org/jenkins-ci/plugins/swarm-client/2.0/swarm-client-2.0-jar-with-dependencies.jar

ENV SWARM_CLIENT_NAME_PREFIX "slave-one"
ENV SWARM_CLIENT_LABELS "test"

COPY run.sh /var/tmp/
RUN chmod +x /var/tmp/run.sh

VOLUME /var/log/jenkins

CMD ["/var/tmp/run.sh"]
