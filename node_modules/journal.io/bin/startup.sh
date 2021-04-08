#!/bin/sh

#
# Custom start script
#
echo "============================  Starting JOURNAL.io  ============================"
LOG_LEVEL=info
UUIDG=$(uuidgen)
SCRIPTPATH="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
echo $SCRIPTPATH
$SCRIPTPATH/server.js start cancel_id=$UUIDG > ./logs/journal.io.log &
echo $! > ./process.pid
echo $UUIDG > ./process.uuid
echo "Started with process id: `cat ./process.pid`"

sleep 2s

tail -f ./logs/journal.io.log
echo $! > ./process.log.pid
