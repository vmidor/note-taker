#!/usr/bin/env node

var WebSocket = require('ws');
var url = require('url')
var http = require('http');
var cmd = require('./lib/command');
var connections = {};
var wsservers = {};
var heartbeat = require('./lib/monitoring/heartbeat')
var Library = (library) => require(`./lib/core/${library}`);
var processRules = require('./lib/ruleProcessor').process;
let LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const DEFAULT_CHANNEL = '/main'; //Channel used for the socket communication
const CLIENT_CHANNEL = '/client'; //Channel used by the client to send messages to server

/**
 * Default port which the Journal.io application runs on.
 * If a environment variable LOG_SOCKET_PORT exists, it will
 * default to that value, otherwise defaults to 8068.
 * @default 8068
 * @private
 */
let DEFAULT_PORT = process.env.LOG_SOCKET_PORT || 8068;
let utils = require('./lib/utils.js');
let log = utils.setLevel(LOG_LEVEL);
let config = require('journal.io.config.json');

//Event default callbacks
let _onConnectFn = () => {};

log.debug(` Default port: ${DEFAULT_PORT}`);
log.debug(process.env);

var server;
var lastPref; //Last process refence which gets ran via node-cmd

var library = (name) => {
  log.debug(`Called function with args: "${name}"`);
  switch(name) {
    case "ping":
      return Library(name);
    default:
      throw new Error(`${name} is not a defined library.`);
  }
}

var libraryCommand = (channel, callback) => {
  log.debug(`Called function with args: "${channel}", "${callback}`);
  return library(channel.lib)[channel.func]((msg) => {
    log.debug(`Called function with args: "${msg}"`);
    callback(typeof msg == 'string' ? msg : JSON.stringify(msg)); 
  });
}

var reset = (close = true, callback) => {
  log.debug(`Called function with args: "${close}", "${callback}`);
  server.close();
  server.listen(getPort(), function(a) {
    log.info(`Server is listening on port ${getPort()}`);
    if (callback) {
      callback(a);
    }
  });
}

var getChannels = () => {
  log.debug(`Called function`);
  return Object.keys(connections);
}

var getConnectionsCount = () => {
  log.debug(`Called function`);
  return getChannels().length;
}

var getPort = () => {
  log.debug(`Called function`);
  return DEFAULT_PORT;
}

var setPort = (port) => {
  log.debug(`Called function with args: "${port}"`);
  DEFAULT_PORT = port;
  reset();
}

var start = (callback) => {
  log.debug(`Called function with args: "${callback}`);
  if(!server) {
    throw new Error("No server instance found. Did you forget to run 'configure()' first?");
  }
  reset(false, callback);
}

server = http.createServer()

server.on('upgrade', function upgrade(request, socket, head) {
  log.debug("Called function");

  const pathname = url.parse(request.url).pathname;
  log.info(`Request to Path: ${pathname}`);
  log.info(`Existing connections: ${Object.keys(connections)}...`)

  if(wsservers[pathname]) {
    wsservers[pathname].handleUpgrade(request, socket, head, function done(ws) {
      wsservers[pathname].emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

var configure = (channel = DEFAULT_CHANNEL) => {
  log.debug(`Called function`);
  let wss, connection;

  wss = new WebSocket.Server({ noServer: true });

  wss.on('connection', function(ws, req) {
    const ip = req.socket.remoteAddress;
    log.info(`New connection to wsserver from IP: ${ip}...`);
    connection = ws;

    ws.on('message', function incoming(message) {
      log.info(`[${channel}] received: ${message}`);
    });
   
    //ws.send('ping from server!');
    log.info(`Current Server connections: ${ws._socket.server.connections}`);
    let _resource = channel ? channel : '/';
    connections[_resource] = connection;
    //Add a reverse reference on the connection
    connections[_resource].__resource = _resource;
    //If it reaches this point means the request is successful, callback now
    _onConnectFn(connections[_resource]);
  });
  wsservers[channel] = wss;
  heartbeat.setup(lastPref);
}

function setupProcessErrorHandling() {
  if(config.processErrorHandling && config.processErrorHandling.on) {
    if(lastPref) {
      log.info("Setting up Process Error Handling...");
      lastPref.on('close', (exitCode, signalCode) => {
        log.error(`Last Process Closed: ${exitCode}, ${signalCode}, will respawn it...`);
        //Attempting retry?
        let _command = lastPref.spawnargs[2];
        exports.sendServerOutput(_command);
      });
      lastPref.on('error', (arg1, arg2, arg3) => {
        log.error(`Last Process Error: ${arg1}, ${arg2}, ${arg3}`);
      });
    }
  }
}

process.on('exit', function(code) {
  return console.log(`Journal.io is about to exit with code ${code}`);
});

//internal functions

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

//Public exports

exports.startChannel = (channel) => {
  exports.sendServerOutput(`echo 'starting channel "${channel}"'`, [], undefined, true, channel);
}

exports.serverSend = (data, channel = DEFAULT_CHANNEL) => {
  let _isActive = connections[channel] && connections[channel].connected;
  log.info(`Sending data: connection '${channel}' is active? ${_isActive}`);
  if(!_isActive) {
    throw new Error(`Channel named '${channel} is not connected, cannot send message to socket client.'`);
  }
  connections[channel].sendUTF(data);
}

exports.sendServerOutput = (command, rules = [], callback, send = true, defaultChannel = DEFAULT_CHANNEL) => {
  log.info(`Called function with args: "${command}", "${rules}", "${callback}", "${send}", "${defaultChannel}"`);
  let fn = typeof command == "string" ? cmd.do : libraryCommand;
  lastPref = fn(command, (dataToSend) => {
    log.debug(`Callback from sendServerOutput with args: '${command}', '${dataToSend}'...`);
    try{
      log.info(`Received output ${command}, initiating rules processing...`);
      processRules(dataToSend, rules, (output) => {
        //console.log(data_line);
        if (callback) {
          setTimeout(() => {
            log.info('Returning to callback');
            log.debug(output);
            callback(false, output);
          }, 1);
        }
        let _channel = `${command.channel}` == 'undefined' ? defaultChannel : command.channel;
        log.info(`SOCKET: send event to channel '${_channel}'?`);
        //log.warn(connections[_channel])
        log.debug(`${send}, '${_channel}', ${connections[_channel]}`);
        log.debug(`Existing connections: ${Object.keys(connections)}`);
        if(send) {
          if(connections[_channel]) {
            connections[_channel].send(output);
            log.info(`sent info via socket to channel '${_channel}'`);
          } else {
            let _err = `Trying to send message to channel '${_channel}', but that channel does not exist!`;
            log.error(_err);
          }
        }
      });
    } catch(e) {
      if (callback) {
        callback(true, e.message);
      } else { //Re-throw
        throw e;
      }
      return;
    }
  });
  setupProcessErrorHandling();
}

/**
 * Overrides the default timeout of the command used for journal.io,
 * which is defined in config.json or if not defined, defaults to
 * DEFAULT_TIMEOUT
 * @see DEFAULT_TIMEOUT
 * @param {number} t timeout in milliseconds
 * @public
 */
exports.setCommandTimeout = (t) => cmd.setTimeout(t);

exports.ignoreLines = (b) => cmd.ignoreLines(b);
/**
 * Gets the port which the journal.js http server runs in
 * @see DEFAULT_TIMEOUT
 * @public
 */
exports.getPort = getPort;

/**
 * Gets the port which the journal.js http server runs in
 * @see DEFAULT_TIMEOUT
 * @param {number} port a valid port number
 * @public
 */
exports.setPort = setPort;

exports.getEndpoint = () => `ws://localhost:${getPort()}`;

exports.start = start;

exports.configure = configure;

exports.Lib = library;

exports.getConnectionsCount = getConnectionsCount;

exports.getChannels = getChannels;

exports.setLogLevel = (level = LOG_LEVEL) => utils.setLevel(level);

exports.closeLog = () => utils.closeLog();

// Main Callbacks
exports.onConnect = (fn) => _onConnectFn = fn;
