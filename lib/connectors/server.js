var net = require('net');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var DtfParser = require('../dtf_parser');
var helpers = require('../helpers');
var Future = require('fibers/future');

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

  this.evalSync = function evalSync() {
    var future = new Future();
    var result;
    
    this.on('return', function(_result) {
      result = _result;
      future.return();
    });
    this.eval.apply(this, arguments);
    future.wait();
    return result;
  };

  this.close = function() {
    cleanup();
    client.destroy();
  };
}

util.inherits(ServerConnector, EventEmitter);

module.exports = ServerConnector;