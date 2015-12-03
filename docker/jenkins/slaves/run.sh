#!/bin/bash

SLAVE_NAME="${SLAVE_NAME_PREFIX}-`hostname`"

echo "Starting jenkins slave \"${SLAVE_NAME}\" with the labels \"${SLAVE_LABELS}\""

su -p -l \
    -s "/bin/bash" \
    -c "java -jar /var/tmp/swarm-client.jar -labels \"${SLAVE_LABELS}\" -executors \"4\" -disableSslVerification -name \"${SLAVE_NAME}\" -username \"josh\" -password \"xxx\" -fsroot \"/var/tmp\""
