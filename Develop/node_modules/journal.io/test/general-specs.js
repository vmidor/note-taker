"use strict" 
/*****************************************************
 * General
 *****************************************************/

let chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
let should = chai.should();
let server = require("../index.js");
const chokidar = require('chokidar');
let WebSocketClient = require('websocket').client; 
let client = new WebSocketClient();
client.__name = "default";
let conn;
let callback;

before(function(done) {
  server.closeLog(); //Remove excess of verbosity to allow seeing better the test results, uncomment line below if you want to set the logging verbosity level
  //server.setLogLevel('debug');
  server.configure();
  server.start((a) => {
    done();
  });
});

after(function(done) {
  // here you can clear fixtures, etc.
  client.abort();
  done();
});

describe("1. Considering a socket server,", function() {
  it("  1.1. A client should be able to connect to it", function (done) {
    //Prepare
    this.timeout(4000);
    function sendNumber() {
      var number = Math.round(Math.random() * 0xFFFFFF);
      callback = (data) => {
        number.toString().should.equal(data);
        done();
      }
      if (conn.connected) {
        conn.sendUTF(number.toString());
      }
      else {
        console.error("Client not connected yet!, test will fail.");
      }
    }
    //server.configure();
    server.start((a) => {
      //Evaluate
      client.connect(server.getEndpoint(), 'echo-protocol');
      setTimeout(sendNumber, 100);
    });
  });

  it("  1.2. A client should receive a message pushed by the server (trigger)", function (done) {
    this.timeout(4000);
    callback = (clientData) => {
      clientData.should.equal("Message from server!!!");
      done();
    }
    
    server.onConnect((connection) => {
      server.serverSend("Message from server!!!", connection.__resource);
    });
    client.connect(server.getEndpoint(), 'echo-protocol');
  });

  it("  1.3. Should be able to listen to changes on stdout from a command", function (done) {
    this.timeout(4000);
    callback = (clientData) => {
      clientData.trim().should.eql('TEST');
      done();
    }
    server.onConnect((connection) => {
      connection.__resource.should.equal("/");
      server.sendServerOutput('echo TEST', [], (error, output) => {
        error.should.equal(false);
        output.trim().should.equal("TEST");
      }, true, connection.__resource);
    });
    client.connect(server.getEndpoint(), 'echo-protocol');
  });

  it("  1.4. Should be able to listen to 'ping', as a result of a library function call", function (done) {
    this.timeout(4000);
    callback = (clientData) => {
      try {
        clientData = JSON.parse(clientData);
      } catch(e) {
        if(e instanceof SyntaxError) {
          //ignore
          return;
          throw e;
        }
      }
      (clientData.error == null).should.eql(true);
      clientData.ttl.should.be.gt(0);
      done();
    }
    server.onConnect((connection) => {
      if(connection.__resource == "/ping") {
        server.sendServerOutput({
          lib: "ping",
          func: "pingOne",
          channel: "/ping"
        }, [], (error, output) => {
          error.should.equal(false);
          JSON.parse(output).host.should.equal("127.0.0.1");
        }, true, connection.__resource);
      } else {
        //Other channel calls will be ignored
      }
    });
    client.connect(server.getEndpoint() + '/ping', 'echo-protocol');
  });

  it("  1.5. Should be able get the number of active connections", function (done) {
    server.getConnectionsCount().should.be.gt(0);
    console.log(`  > TEST: current connections: ${server.getChannels()}`);
    done();
  });

  it("  1.6. Client should not be able to listen to 'ping' url, when message was sent from root url", function (done) {
    this.timeout(4000);
    //Create another totally different client
    let client2 = new WebSocketClient();
    let client3 = new WebSocketClient();
    client2.__name = "client2";
    setup(client2, (clientData, source) => {
      client2.should.be.eql(source);
      if (clientData.trim() == 'PING from /main')
        should.fail();
    });
    let _pingCount = 0;
    setup(client3, (clientData, source) => {
      console.log(`"${clientData}"`);
      //will receive ping twice
      if (clientData.trim() == 'PING from /main') {
        _pingCount++;
        //ok
        if(_pingCount == 2)
          done();
      }
    });
    client2.connect(server.getEndpoint() + '/ping', 'echo-protocol');
    client3.connect(server.getEndpoint() + '/main', 'echo-protocol');
    server.onConnect((connection) => {
      //Ping was sent from Root
      server.sendServerOutput(`echo PING from ${connection.__resource}`);
    });
  });
});

//helper functions
function setup(_client, _callback) {
  _client.on('connectFailed', function(error) {
    console.log('  > TEST (client): Connect Error: ' + error.toString());
  });
 
  _client.on('connect', function(connection) {
    console.log(`  > TEST (client::${_client.__name}): Client Connected!`);
    conn = connection;
    connection.on('error', function(error) {
      console.log(`  > TEST (client::${_client.__name}): Connection Error: ` + error.toString());
    });
    connection.on('close', function() {
      console.log(`  > TEST (client::${_client.__name}): echo-protocol Connection Closed`);
    });
    connection.on('message', function(message) {
      if (message.type === 'utf8') {
        console.log(`  > TEST (client::${_client.__name}) Received: "${message.utf8Data}", returning to callback now...`);
        if(!_callback) {
          callback(message.utf8Data, _client);
        } else {
          _callback(message.utf8Data, _client);
        }
      }
    });
  });
}

setup(client);
