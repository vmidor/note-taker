#!/bin/sh

_package=$(npm list --depth=0 2>&1 | head -n 1 | awk '{print $1;}')

echo "Building image: journal.io:${_package#*@}..."

docker build -t tcardoso2/journal.io:${_package#*@} .
