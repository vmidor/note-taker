"use strict"

var utils = require('../utils');
var log = utils.log;
var feature = require('../features/features');

/**
 * Default heartbeat interval
 * @private
 */
const DEFAULT_INTERVAL = 10000;
/**
 * Sets up a heartbeat Basic process if the feature is enabled in config
 * @param {*} fnRef a function reference which we want to monitor 
 * @private
 */
exports.setup = (fnRef, connections) => {
  if(feature.isOn("heartbeat")) {
    let _heartBeatCount = 0;
    log.info("Setting up Heartbeat...");
    let _interval = config.heartbeat.every || DEFAULT_INTERVAL;
    setInterval(() => {
      _heartBeatCount++;
      log.info(`Sending heartbeat #${_heartBeatCount} to clients...`);
      if(!fnRef) {
        log.warn("Background running process does not exist, will skip heartbeat. This is ok if you are just testing");
        return;
      }
      for(var conn in connections) {
        connections[conn].send(`heartbeat 
 connected: ${lastPref.connected},\
 signalCode: ${lastPref.signalCode},\
 exitCode: ${lastPref.exitCode},\
 pid: ${lastPref.pid},\
 killed: ${lastPref.killed},\
 beat: ${_heartBeatCount},\
 timed-out: ${lastPref.timedOut}`);
        log.debug(lastPref);
        if(lastPref.killed) {
          log.error(`Oh no! The underlying process was killed (pid: ${lastPref.pid})`);
          log.debug(lastPref);
        }
      }
    }, _interval);
  }
}
