"use strict" 
/*****************************************************
 * Network Specs
 *****************************************************/

let chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
let should = chai.should();
let server = require("../index.js");
const chokidar = require('chokidar');
let WebSocketClient = require('websocket').client; 
let client = new WebSocketClient();
let conn;
let callback;

before(function(done) {
  done();
});

after(function(done) {
  // here you can clear fixtures, etc.
  client.abort();
  done();
});

describe("Considering a socket server,", function() {
  it("A client should be able to connect to it", function (done) {
    //Prepare
    this.timeout(4000);
    function connect() {
      done();
    }
    server.configure();
    server.start((a) => {
      //Evaluate
      client.connect(server.getEndpoint(), 'echo-protocol');
      setTimeout(connect, 1000);
    });
  });

  it("A client should receive the result of the ping function from Advanced Libraries", function (done) {
    this.timeout(4000);
    client.connect(server.getEndpoint(), 'echo-protocol');
    setTimeout(() => {
      server.Lib('ping').pingOne((result) => {
        console.log(result);
        done();
      });
    }, 500);
  });
});

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});
 
client.on('connect', function(connection) {
    console.log('Client Connected!');
    conn = connection;
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log(`Received: "${message.utf8Data}", returning to callback now...`);
            callback(message.utf8Data);
        }
    });
});
