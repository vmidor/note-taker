#!/bin/sh

#
# Custom documentation script
# Dependencies: documentation npm package e.g. to install globally do:
# ````
# npm install documentation -g
# ````
#
echo "============================  Creating documentation for JOURNAL.io  ============================"
FILE=./config.json
if [ -f "$FILE" ]; then
  echo "config.json file exists. Let's create some documentation!"
else 
  echo "config.json file does not exist! I need to create it first!"
  echo '{}' > ./config.json
fi

documentation build -o DOCUMENTATION.md -f md **.js
