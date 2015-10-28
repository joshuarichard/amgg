#!/bin/bash

SLAVE_LABELS="${SWARM_CLIENT_LABELS}"
SLAVE_NAME="${SWARM_CLIENT_NAME_PREFIX}-`hostname`"

echo "Starting jenkins slave \"${SLAVE_NAME}\" with the labels \"${SLAVE_LABELS}\""

su -p -l \
    -s "/bin/bash" \
    -c "java -jar /var/tmp/swarm-client.jar -labels \"${SLAVE_LABELS}\" -executors \"4\" -master \"http://192.168.99.100:8080\" -disableSslVerification -name \"${SLAVE_NAME}\" -fsroot \"/var/tmp\""