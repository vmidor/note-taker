#!/bin/sh

_package=$(npm list --depth=0 2>&1 | head -n 1 | awk '{print $1;}')

echo "Building image: journal.io:${_package#*@}..."

#USERNAME=$(cat ~/docker/.docker_registry_username)

#cat ~/docker/.docker_registry_access_token | docker login registry.gitlab.com --username $USERNAME --password-stdin

docker build -t registry.gitlab.com/tcardoso1/journal.io:${_package#*@} .

docker push registry.gitlab.com/tcardoso1/journal.io
