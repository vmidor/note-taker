/*
 * Mock Websocket client
 * To override the IP which is connecting to, set the environment var WS_IP
 *    - By default it connects to 127.0.0.1
 * To override the Port which is connecting to, set the environment var WS_PORT
 *    - By default if connects to the port from the server module "getPort" function
 */

var server = require('../index');
var WebSocketClient = require('websocket').client; 
var client = new WebSocketClient();

const WS_IP = process.env.WS_IP || "127.0.0.1";
const WS_PORT = process.env.WS_PORT || server.getPort();

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});
 
client.on('connect', function(connection) {
    console.log('CLIENT: Client Connected');
    conn = connection;
    connection.on('error', function(error) {
        console.log("CLIENT: Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('CLIENT: echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("CLIENT: Received: '" + message.utf8Data + "'");
            callback(message.utf8Data);
        }
    });
});
let callback = (data) => {
    console.log("CLIENT: (Callback)", data);
}
client.connect(`ws://${WS_IP}:${server.getPort()}/`, 'echo-protocol');
