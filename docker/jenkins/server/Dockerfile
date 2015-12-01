FROM jenkins:latest
MAINTAINER Joshua Richard <eos.josh.richard@gmail.com>

USER root
RUN mkdir /var/log/jenkins
RUN mkdir /var/cache/jenkins
RUN chown -R jenkins:jenkins /var/log/jenkins
RUN chown -R jenkins:jenkins /var/cache/jenkins
USER jenkins

COPY plugins.txt /jenkins/plugins.txt
RUN /usr/local/bin/plugins.sh /jenkins/plugins.txt

ENV JENKINS_OPTS="--handlerCountStartup=100 --handlerCountMax=300 --logfile=/var/log/jenkins/jenkins.log --webroot=/var/cache/jenkins/war"
