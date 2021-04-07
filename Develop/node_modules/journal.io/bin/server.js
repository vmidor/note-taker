#!/usr/bin/env node

//let main = require('../../journal.io/index.js');
let server = require('../index');
let http = require('http');
let config = require('journal.io.config.json');

const { program } = require('commander');
program.version(config.version);

let targetItem = 0; //Default target file to monitor from the array

const API_PORT = process.env.API_PORT || 8084;

//
//main.sendServerOutput('homebridge -D');

function startWebServer() {
  http.createServer((req, res) => {
    if (req.method == "GET") {
      res.writeHead(200, { "Content-type": "text/json" });
      if(req.url == "/reset") {
        try {
          startServer();
        } catch(e) {
           res.end(`{ error: ${e.message} }`);
        }
        res.end("{ restartServer: true }");
      } else {
        console.log(`GET: ${req.url}`);
        res.end("{}");
      }
    }
  }).listen(API_PORT);
}
function startServer() {
  server.start((a) => {
    server.setCommandTimeout(0);
    server.ignoreLines(true);
    /*server.sendServerOutput({
      lib: "ping",
      func: "pingAll",
      channel: "ping"
    })*/
    //For the next command I want to disable the timeout
    if(!config || !config.target)
    {
      throw new Error("To run the application please define a config.json file with a 'target' attribute which points to the file you want to monitor.");
    }
    let target = config.target[targetItem];
    server.sendServerOutput(`${config.command} ${target}`);
  });
}

program
  .option('-d, --debug', 'output extra debugging')

program
  .command('start')
  .description('start the server')
  .action(() => {
    try{
      //Configure 2 servers
      server.configure();
      server.configure('/client');
      startWebServer();
      startServer();
    }catch(e){
      console.log("OOOooops an error occured!");
      console.error(e);
    }
  });

program.parse(process.argv);

if (program.debug) {
  server.setLogLevel('debug');
}

