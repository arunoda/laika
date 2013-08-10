var net = require('net');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var DtfParser = require('../dtf_parser');
var Connector = require('./connector');
var helpers = require('../helpers');
var Future = require('fibers/future');

function ServerConnector(port) {
  Connector.call(this);
  var self = this;
  var client = net.connect({port: port});
  var parser = new DtfParser();

  client.on('data', onClientData);
  client.once('end', cleanup);

  var future;

  function onClientData(message) {
    parser.parse(message.toString());
  }

  parser.on('data', function(payloadString) {
    var payload = JSON.parse(payloadString);
    if(payload['error']) {
      var errorMessage =  '[Error on Server] ' + payload['error'][0];
      var error = new Error(errorMessage);
      error.stack =  payload['error'][1];
      self.emit('error', error);
    } else {
      var args = helpers.objectToArray(payload['emit']);
      self.emit.apply(self, args);
    }
  });

  function cleanup() {
    client.removeListener('data', onClientData);
    client.removeListener('end', cleanup);
  }

  this.eval = function eval(serverCode) {
    var args = [];
    for(var key in arguments) {
      if(key != '0') {
        args.push(arguments[key]);
      }
    }
    var payload = {
      func: serverCode.toString(),
      args: args
    };
    client.write(JSON.stringify(payload));
    return this;
  };

  this.close = function() {
    cleanup();
    client.destroy();
  };
}

util.inherits(ServerConnector, EventEmitter);

module.exports = ServerConnector;