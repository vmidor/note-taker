#!/bin/sh

#
# Custom restart script
#
./bin/kill.sh
echo "Sleeping for 2 seconds before restarting..."
sleep 2s
./bin/startup.sh
