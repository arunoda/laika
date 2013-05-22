var net = require('net');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function ServerConnector(port) {
  var self = this;
  var client = net.connect({port: port});
  client.on('data', onClientData);
  client.once('end', cleanup);

  function onClientData(args) {
    var args = objectToArray(JSON.parse(args));
    self.emit.apply(self, args);
  }

  function cleanup() {
    client.removeListener('data', onClientData);
    client.removeListener('end', cleanup);
  }

  this.run = function run(serverCode) {
    client.write(serverCode.toString());
    return this;
  };

  this.close = function() {
    cleanup();
    client.end();
  };
}

util.inherits(ServerConnector, EventEmitter);

module.exports = ServerConnector;

function objectToArray(obj) {
  var arr = [];
  for(var key in obj) {
    arr.push(obj[key]);
  }
  return arr;
}