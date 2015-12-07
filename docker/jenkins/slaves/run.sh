#!/bin/bash

SLAVE_NAME="${SLAVE_NAME_PREFIX}-`hostname`"

su -p -l \
    -s "/bin/bash" \
    -c "java -jar /var/tmp/swarm-client.jar -labels \"${SLAVE_LABELS}\" -executors \"4\" -disableSslVerification -name \"${SLAVE_NAME}\" -username \"x\" -password \"x\" -fsroot \"/var/tmp\""
