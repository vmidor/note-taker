/*
 * Utils: General utils class for stuff which needs to be used by every other file in this module.
 *        also referred in main, and can be accessed externally from the module via utils.
 *        originally taken from another of my side-projects, vermon.
 * @author: Tiago Cardoso
 * @from: 0.2.2
 */
let flatted = require('flatted')
let tracer = require('tracer')
// Log level is set by default to 'trace', this can be overriden by the environment variable LOG_LEVEL
// But it is preferred to set it in the config.json file instead
let config = require('journal.io.config.json')
let LOG_LEVEL = config.logging && config.logging.on ? config.logging.level: process.env.LOG_LEVEL || 'trace';
let LOG_RELOAD_INTERVAL = 10000;

try {
  !__log;
} catch(e) {
  global.__log = tracer.colorConsole({ level: 'trace' }) // initialization requires it to go to trace level, can go up but not down, see https://www.npmjs.com/package/tracer
  //__log.info('Setting global log for the first time...');
  __log.warning = __log.warn
  tracer.setLevel(LOG_LEVEL) // Will start with this level
  tracer.console({
    inspectOpt: {
      showHidden: true, // the object's non-enumerable properties will be shown too
      depth: 5 // tells inspect how many times to recurse while formatting the object. This is useful for inspecting large complicated objects. Defaults to 2. To make it recurse indefinitely pass null.
    }
  })
}

//Will check every 10 seconds if config.logging has changed
setInterval(() => {
  let _name = require.resolve('journal.io.config.json');
  __log.info(`Checking if config.logging has changed from level: ${LOG_LEVEL} (module ${_name})...`)
  delete require.cache[_name];
  config = require('journal.io.config.json')
  if(config.logging && config.logging.on) {
    if(config.logging.level != LOG_LEVEL) {
      LOG_LEVEL = config.logging.level
      __log.warn(`Logging level will be changed from ${LOG_LEVEL} to ${config.logging.level}`)
      tracer.setLevel(LOG_LEVEL)
    }
  } else {
    __log.info("Logging feature is not defined, skipping.") 
  }
}, LOG_RELOAD_INTERVAL)

exports = module.exports = {
  JSON: {
    stringify: (str) => {
      try {
        return JSON.stringify(str)
      } catch (e) {
        if (e instanceof TypeError) {
          __log.debug(`Error in stringifying object (${e.message}), attempting with "flatted"...`)
          try {
            return flatted.stringify(str)
          } catch (e) {
            let msg = `Error in stringifying object (${e.message})`
            __log.warn(msg)
            return msg
          }
        }
        // Unhandled, re-throw
        throw e
      }
    }
  },
  fileLogger: (fileName, root = '.', maxLogFiles = 10) => {
    var logger = require('tracer').dailyfile({
      root: root,
      maxLogFiles: maxLogFiles,
      allLogsFileName: fileName
    });
    return logger;
  },
  log: __log,
  closeLog: () => tracer.close(), //close all log output. Can resume by re-setting the log level
  setLevel: (traceLevel) => {
    // This is required to reset the current instance
    __log.warn(`Setting log level to ${traceLevel}.`)
    tracer.setLevel(traceLevel)
    return __log
  },
  splitArgs (func) {
    // Returns array of the arguments in the class constructor
    return (func + '').
      replace(/[/][/].*$/mg, ''). // strip single-line comments
      replace(/\s+/g, ''). // strip white space
      replace(/[/][*][^/*]*[*][/]/g, ''). // strip multi-line comments
      split('){', 1)[0].replace(/^[^(]*[(]/, ''). // extract the parameters
      replace(/=[^,]+/g, ''). // strip any ES6 defaults
      split(',').
      filter(Boolean) // split & filter [""]
  },
  extend (obj, src) {
    for (let key in src) {
      if (src.hasOwnProperty(key)) { obj[key] = src[key]; }
    }
    return obj;
  }
}
