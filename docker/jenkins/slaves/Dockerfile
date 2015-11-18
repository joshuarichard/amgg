FROM ubuntu:14.04
MAINTAINER Joshua Richard <eos.josh.richard@gmail.com>

RUN apt-get update && \
    apt-get install -y \
    openjdk-7-jdk \
    openssh-server \
    git \
    nodejs \
    npm \
    wget

RUN ln -s /usr/bin/nodejs /usr/local/bin/node

RUN mkdir -p /var/run/sshd
RUN sed -i 's|session    required     pam_loginuid.so|session    optional     pam_loginuid.so|g' /etc/pam.d/sshd  

RUN useradd jenkins
RUN echo "jenkins:jenkins" | chpasswd

RUN wget -O /var/tmp/swarm-client.jar http://maven.jenkins-ci.org/content/repositories/releases/org/jenkins-ci/plugins/swarm-client/2.0/swarm-client-2.0-jar-with-dependencies.jar

ENV SLAVE_NAME_PREFIX "slave"
ENV SLAVE_LABELS "node npm grunt"

COPY run.sh /var/tmp/
RUN chmod +x /var/tmp/run.sh

VOLUME /var/log/jenkins

EXPOSE 22

CMD ["/var/tmp/run.sh"]
