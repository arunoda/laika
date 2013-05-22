var net = require('net');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var DtfParser = require('../dtf_parser');
var helpers = require('../helpers');

function ServerConnector(port) {
  var self = this;
  var client = net.connect({port: port});
  var parser = new DtfParser();

  client.on('data', onClientData);
  client.once('end', cleanup);

  function onClientData(message) {
    parser.parse(message.toString());
  }

  parser.on('data', function(args) {
    var args = helpers.objectToArray(JSON.parse(args));
    self.emit.apply(self, args);
  });

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