"use strict" 
/*****************************************************
 * CLI
 ******************************************************/

let chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
let should = chai.should();
let cmd = require("../lib/command.js");
let server = require("../index.js");

before(function(done) {
  server.setLogLevel('debug');
  done();
});

after(function(done) {
  done();
});

describe("1. 'start/status/kill',", function() {
  it("  1.1. 'start' should return a ChildProcess object", function () {
    //Prepare
    let pRef = cmd.do('./bin/server.js start');
    (pRef.constructor.name == "ChildProcess").should.equal(true);
    pRef.pid.should.be.gt(1);
  });
  it("  1.2. 'status' should show current process id");
  it("  1.3. 'kill' should kill current process id");
  it(`  1.4. Should start a server on default port ${server.getPort()}`, function (done) {
    //Prepare
    let pRef = cmd.do('./bin/server.js start', (stdout) => {
      stdout.should.equal(true);
      done();
    });
    //Assert
  });

})
