#!/usr/bin/env node

/*
 * Ping Core Library
 */
var cmd = require('../command');
var log = require('../utils').log;
let results = [];

function sendback(callback, output) {
  log.info("Sending to final callback...")
  log.debug(output);
  callback(output);
}

exports.pingOne = (callback, host = '127.0.0.1') => {
  log.debug(`Called function with args: "${callback}", "${host}`);
  let _cmd = `ping ${host}`;
  let processRef = cmd.do(_cmd, (data) => {
    //Example output: 64 bytes from localhost (127.0.0.1): icmp_seq=1 ttl=64 time=0.106 ms
    log.debug(`Received intermediate callback from 'cmd.do' stdout: "${data}"`);
    let _output;
    if(data.indexOf("Host Unreachable") > 0) {
      _output = { error: "Host Unreachable", input_cmd: _cmd };
      return sendback(callback, _output);
    }
    let _bytes = data.split(' ')[0];
    let _host = data.split(':')[0].split(' ');
    let _attrs = data.split(':')[1].split(' ');
    _output = {
      error: null,
      input_cmd: _cmd, 
      bytes: _bytes,
      host: _host[_host.length -1],
      icmp_seq: parseInt(_attrs[1].split('=')[1]),
      ttl: parseInt(_attrs[2].split('=')[1]),
      time: parseFloat(_attrs[3].split('=')[1]),
      time_unit: _attrs[4].trim()
    };
    return sendback(callback, _output);
  }, 1, 1);
  return processRef;
}

exports.pingAll = (callback, progressCallback, pattern = '192.168.0.*', from = 1, count = 0) => {
  log.debug(`Called function with args: "${callback}", "${progressCallback}", "${pattern}", "${from}", "${count}"`);
  let _limit = count == 0 ? 255 : count;
  from = from <= 0 ? 1 : from;
  _first = from;
  results = [];
  let processRefs = [];
  let _iter = () => {
    //console.log(from);
    let processRef = exports.pingOne((data) => {
      results.push(data);
      log.debug("   Progress: ", data);
      if(progressCallback) progressCallback(data);
      if(results.length == _limit) {
        log.debug("   FINISHED, executing callback: ", results);
        callback(results);
      }
    }
    , `${pattern.replace('*', from)}`);
    processRefs.push(processRef);
    from++;
    if((from-_first) <= _limit) {
      setTimeout(_iter, 1);
    }
  }
  _iter();
  return processRefs;
}

if (require.main === module) {
  exports.pingAll((msg) => {
    log.info("done!");
  }, (msg) => {
    if(!msg.error) log.info(msg.host);
  });
} else {
  log.info('Required as a module');
}
 
