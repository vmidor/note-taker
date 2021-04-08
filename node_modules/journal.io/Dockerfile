
# Dockerfile
# Journal.io
# Author: Tiago Cardoso
# Inspired on: https://nodejs.org/fr/docs/guides/nodejs-docker-webapp/
# Second 12-alpine image inspired on
# https://medium.com/faun/how-to-build-a-node-js-application-with-docker-f596fbd3a51

# Image
#FROM node:10
FROM node:12-alpine

# RUN command to make sure to grant necessary permission into 
# node_module and app folders, so that when npm install can be executed.
RUN mkdir -p /home/node/journal.io/node_modules && chown -R node:node /home/node/journal.io

# App Directory
WORKDIR /home/node/journal.io

# App Dependencies
COPY package*.json ./
USER node
RUN npm install
# run above command with --only=production if for production

# Copy journal.io application code with the appropriate permissions to 
# the application directory on the container:
COPY --chown=node:node . .
VOLUME ["/home/node/journal.io/logs", "/home/node/journal.io/bin", "/home/node/journal.io/target"]

EXPOSE 8068
EXPOSE 8084

# main command
CMD ["/bin/sh", "./bin/startup.sh"]
