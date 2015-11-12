#!/bin/bash

SLAVE_NAME="${SLAVE_NAME_PREFIX}-`hostname`"

echo "Starting jenkins slave \"${SLAVE_NAME}\" with the labels \"${SLAVE_LABELS}\""

su -p -l \
    -s "/bin/bash" \
    -c "java -jar /var/tmp/swarm-client.jar -labels \"${SLAVE_LABELS}\" -master \"http://172.17.0.121:8080\" -executors \"4\" -disableSslVerification -name \"${SLAVE_NAME}\" -fsroot \"/var/tmp\""
