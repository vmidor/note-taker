
# journal.io

```
    ___  ________  ___  ___  ________  ________   ________  ___           ___  ________     
   |\  \|\   __  \|\  \|\  \|\   __  \|\   ___  \|\   __  \|\  \         |\  \|\   __  \    
   \ \  \ \  \|\  \ \  \\\  \ \  \|\  \ \  \\ \  \ \  \|\  \ \  \        \ \  \ \  \|\  \   
 __ \ \  \ \  \\\  \ \  \\\  \ \   _  _\ \  \\ \  \ \   __  \ \  \        \ \  \ \  \\\  \  
|\  \\_\  \ \  \\\  \ \  \\\  \ \  \\  \\ \  \\ \  \ \  \ \  \ \  \____  __\ \  \ \  \\\  \ 
\ \________\ \_______\ \_______\ \__\\ _\\ \__\\ \__\ \__\ \__\ \_______\\__\ \__\ \_______\
 \|________|\|_______|\|_______|\|__|\|__|\|__| \|__|\|__|\|__|\|_______\|__|\|__|\|_______|
                                                                                            
(Fonts by http://patorjk.com/software/taag)                                                                                        
```

An external simple logs web-socket server.
Meant originally to send log updates via web-socket but it can run
any command and capture it's output.

* Install:
```
npm install journal.io
```
Then create under your home folder a sub-folder "node_modules" (if does not exist already) and add a journal.io.config.json file there. See below an example.

* Simple example usage (API) (Server):
```
let server = require('journal.io');

server.setPort(8054); //If you want to override the default websocket port (8068)
server.configure();
server.start(() => {
  server.sendServerOutput(`tail -f somelogfile.log`);
  //To send instead a message to another channel
});

```
This terminal command will send log changes when they happen to the file 'somelogfile.log'.
Then you can connect via web-sockets client (see examples referenced below).
NOTE: any command has a default timeout of 10 seconds. Meaning even the command above would not receive any more updates after 10 seconds. To override that time use:
```
//Override the default timeout for commands
server.setCommandTimeout(ms);
// then issue your command
server.sendServerOutput(`tail -f somelogfile.log`);
```
Or alternatively if you want no default timeout:
```
server.setCommandTimeout(0);
```

Library Functions
-----------------
Instead of issuing a command to the server you can also use a list of pre-defined libraries and functions like so:
```
server.sendServerOutput({
  lib: "ping",       //Name of the js library
  func: "pingOne",   //Function
  channel: "ping"    //Optional, channel where to send the output to (see Channels, below)
});
```
* Existing library / commands:
- ping / pingOne: Pings one IP (equivalent to sending ping command over terminal). Right now this is only used for testing purposes and it pings localhost;
- ping / pingAll: Pings all nodes in the "192.168.0.xxx" space. Beware to only use this on your controlled network environments.
Returns a list of nodes in the network;


Extending with your own functions
---------------------------------
Right now I have not really thought well about this but I plan to include it in the near future.

Channels
--------
Channels are just different URLs for the client to point to, e.g.:
```
var server = require('journal.io');
var WebSocketClient = require('websocket').client;
var client = new WebSocketClient();

client.connect(server.getEndpoint() + '/channel1', 'echo-protocol');
//Sending a message to any client listening to channel1
server.sendServerOutput({
  lib: "ping",
  func: "pingOne",
  channel: "channel1"
});
```
This means you can have the same server working on different tasks and sending the output to different clients.
Right now channels are only possible to use with Library functions (not raw commands).

Rules (WIP)
-----------
In future the server will be able to filter content captured based on some basic rules which can be configure.
I'll update this section soon with details.

Test socket clients
-------------------
Inside the "lib" folder there are 2 socket clients which you can use if you want:
* 'Server-side' (NodeJS) client: mock.js
* HTML client (Javascript): mock.html

Tests (mocha)
-------------
Just run 
```
mocha --exit
```
Or
```
npm test
```

Log level
---------
If for some reason you need to change the log level when you are running your script use LOG_LEVEL environment variable like so:
```
LOG_LEVEL=debug node your_script_using_journal.io

# Mocha

LOG_LEVEL=debug mocha --exit
```

Docker
------
You can build a local docker container by running ./bin/build_docker.sh
It packs the app into the container and tags it with the current npm package version
Then run it using the docker-compose file on this repo:
````
docker-compose up
````

Documentation
-------------
Documentation is generated via the npm 'documentation' package. To re-generate documentation do
````
./bin/doc.sh
````

Config.json
-----------
The application requires a ./config.json file (in the root of the project folder) which allow enabling several features:
* logging
* heartbeat
* processErrorHandling 
This file is mandatory, but because it might contain sensitive information has not been included in the source code repository, therefore you need to create it manually. A minimal example is below:
````
{
    "target": [
        "/path/to/your/file"
    ]
}
````

Version History
---------------
* v 0.4.1: (WIP) started adding cucumber for tests
* v 0.4.0: Refactoring to improve readability and structure of code (WIP), refactoring of heartbeat code
* v 0.3.10: Added Github workflow actions (ci.yml), tested on self-hosted runner 
* v 0.3.9: Created function 'startChannel'; Troubleshooting not being able to have 2 sockets listening to different paths and one server. Changed implementation of Node.js Websockets from "WebSocket" library to "ws" to support multiple endpoints on same HTTPS server.
* v 0.3.8: Adding support to receive messages from client, added push docker image script to registry
* v 0.3.7: Creating build docker script in ./bin/build_docker.sh, starting work on CLI tool for interacting with the client (WIP);
* v 0.3.6: kill ends the server.js process but not the underlying processes, need to handle that first, starting process and CLI specs
* v 0.3.5: 
  - (WIP) Creating monitor to look at principal command task since it seems to be timing out unexpectably
  - Revisiting test suites, as I haven't looked into them for a while
  - Created onConnect callback, after the server receives a successful connection, instead of having hard-coded timeouts.
* v 0.3.4: Changed configuration to allow several files to be monitored and to separate command from target. Started documentation (via npm documentation package). Created dev-dependency to eslint (WIP)
  * Issues:
    * mocha tests are failing for this release, only did some basic manual regression testing
    * config.json has to be done manually. an improvement should be to have that as a command
    * Linting must be still initialized via
    ````./node_modules/.bin/eslint --init````
* v 0.3.3: Implementing logging level changes on the fly (e.g. no need to restart application);
* v 0.3.2: Added support to log into a different file (WIP), added heartbeat configuraiton option, fixed process being killed after a while by respawning the process;
* v 0.3.1: Adding start, status and stop scripts (Backend job)
* v 0.3.0: Bug fixes, added config.json file. timeout = -1 means the command never times out;
* v 0.2.9: First docker version, will add instructions later, starting API with 'reset' action which restarts the server;
* v 0.2.8: Dockerizing app (WIP);
* v 0.2.7: Limit of lines also now allowed to override via "ignoreLines(true)";
* v 0.2.6: Allowing override of command timeout "setCommandTimeout" (Default is 10 seconds);
* v 0.2.5: implemented paralell channels; 
* v 0.2.4: (WIP) bug fixes for working with 2 paralell channels
* v 0.2.3: (WIP) bug fixes for channels
* v 0.2.2: (WIP) working on channels, refactored logging code now using a proper library (tracer)
* v 0.2.1: (WIP) creating channels (starting with ping channel)
* v 0.2.0: Starting to implement more complex pre-defined core functions ran from libraries instead of direct terminal commands (WIP); created node-cmd wrapper for simplifying issuing terminal commands.
* v 0.1.11: Implementing handling of clients which do not specify protocol, before it was crashing the server.
* v 0.1.10: Re-adding again LOG_SOCKET_PORT as environment variable
* v 0.1.9: Bug fix: sending just the line changed and not the full output
* v 0.1.8: Server now does not start when required (imported), but only after running "configure()" and "start()" method
* v 0.1.7: Added setPort to allow changing the default port of a given instance without having to fiddle with Environment variables, removed ENV variable setting for ports
* v 0.1.7: Added setPort to allow changing the default port of a given instance without having to fiddle with Environment variables, removed ENV variable setting for ports
* v 0.1.6: Added first rules, split, trim, length, array (WIP)
* v 0.1.5: Minor change on test file
* v 0.1.4: Code and test code improvements, added LOG_SOCKET_PORT environment variagle which can be used to override the server socket port. In future, the name of the library should be renamed as it does not relate to homebrige, it is a generic log socket tool. Adjusted CI instructions.
* v 0.1.3: Added Web-page mock client. Started working with rules syntax (WIP).
* v 0.1.2: WIP on listening to command stdout changes.
* v 0.1.1: Added example for server trigger push to client via function "serverSend".
* v 0.1.0: First test using https://www.npmjs.com/package/websocket example.

