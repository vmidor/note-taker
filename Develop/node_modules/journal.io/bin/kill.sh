#!/bin/sh

#
# Custom stop script
#
echo "============================  Stopping JOURNAL.io  ============================"
kill `cat ./process.pid`
echo "Done killing process `cat ./process.pid`"
rm ./process.pid
