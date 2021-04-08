/**
 * Wrapper to the node-cmd library
 * @private
 */
var cmd = require('node-cmd');
var config = require('journal.io.config.json');
var eventsCount = 0;
var utils = require('./utils');
var log = utils.log;

/**
 * Default timeout (in milliseconds) for which a command lasts for.
 * @constant
 */
const DEFAULT_TIMEOUT = 10000;
let _timeout = config.timeout ? config.timeout : DEFAULT_TIMEOUT;
let getTimeout = () => _timeout == -1 ? undefined : _timeout;
let setTimeout = (t) => _timeout = t;

//If ignore lines = True means the command will not stop when terminal reaches more than _lines (meaning max lines). TODO: Consider just replacing by a single variable?
let _ignoreLines = false;
let _lines = 10;
let getLines = () => _lines;
let setLines = (n) => _lines = n;

exports.logToFile = (preffix = 'Commands') => log = utils.fileLogger(preffix); 

exports.setTimeout = (t) => setTimeout(t);

exports.setLines = (n) => setLines(n);

exports.ignoreLines = (b) => _ignoreLines = b;

exports.do = (command, callback, from = 0, lines = getLines(), timeout = getTimeout()) => {
  log.debug(`Called function with args: "${command}, ${callback}, ${from}, ${lines}, ${timeout}"`);
  let processRef = cmd.get(command, (err, _, stderr) => {
    if(err) {
      log.error(stderr);
    }
  });
  let data_line = "";
  let index = 0;
  //listen to the terminal output
  let _event = ('data', (data) => {
    log.debug(`Received data from output: ${data}...`);
    if (!_ignoreLines && lines <= 0) {
      eventsCount--;
      log.warn(`Limit of lines expired, ignoring data from terminal and removing event (count = ${eventsCount})...`);
      processRef.stdout.removeListener('data', _event);
      return;
    }
    index++;
    log.debug(`'index' was increased to ${index}...`);
    if(index <= from) return;
    data_line += data;
    if (data_line[data_line.length-1] == '\n') {
      log.debug('Received all the data from this line');
      lines--;
      index++;
      if(index <= from) return; 
      //Make sure we really copy the original string and not a reference of it
      let dataToSend = '' + data_line;
      data_line = ""; //We don't need it anymore
      log.debug(`Sending final data to callback: '${dataToSend}'`);
      callback(dataToSend);
    }
  });
  processRef.stdout.on('data', _event);
  processRef.timedOut = false;
  //Set event timeout
  if(timeout) {
    setTimeout(() => {
      try {
        log.info(`Removing event due to timeout...`);
        processRef.timedOut = true;
        processRef.stdout.removeListener('data', _event);
        processRef.kill();
        eventsCount--; 
      } catch(e) {
        log.error(`Exception happened while trying to remove event listener and killed process reference ${processRef.pid}: ${e.message}`);
        log.error(e);
      }
    }, timeout);
  }
  eventsCount++;
  return processRef;
}
