"use strict"

var utils = require('../utils');
var log = utils.log;
let config = require('journal.io.config.json');

function exists(attr) {
  return config.hasOwnProperty(attr);
}

function isOn(attr) {
  config[attr].hasOwnProperty("on") && config[attr].on === true;
}

/**
 * Checks if a feature (toggle) is on on the config.json files
 * @example { "heartbeat": { "on": "true"}}
 * @returns true is is on
 */
exports.isOn = (feature) => {
  if(typeof feature === 'string') {
    return exists(feature) && isOn(feature);
  } else {
    log.error("A feature must be of string type.");
  }
}
