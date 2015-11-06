FROM jenkins
MAINTAINER Joshua Richard <eos.josh.richard@gmail.com>

COPY plugins.txt /jenkins/plugins.txt
RUN /usr/local/bin/plugins.sh /jenkins/plugins.txt
