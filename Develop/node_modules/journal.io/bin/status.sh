#!/bin/sh

#
# Custom status script
#
echo "============================  Status of JOURNAL.io  ============================"
FILE=./process.pid
if [ -f "$FILE" ]; then
  # Check if process actually is running
  kill -0 $(cat $FILE)
  echo "Journal.io last running process id: `cat ${FILE}`"
else 
  echo "Journal.io is not running"
fi

