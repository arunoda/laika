var util = require('util');
var EventEmitter = require('events').EventEmitter;
var helpers = require('../helpers');

function ClientConnector(phantom, appUrl) {
  appUrl = appUrl || "http://localhost:3000";  
  var self = this;

  //load the phantom page
  var pageOpened = false;
  var page;
  phantom.createPage(function(err, p) {
    if(err) {
      throw err;
    } else {
      page = p;
      page.open(appUrl, afterOpened);
    }
  });

  function afterOpened(err, status) {
    if(err) {
      throw err;
    } else if(status != 'success') {
      throw new Error('unsuccessful status: ' + status);
    } else {
      pageOpened = true;
      page.onCallback = onCallback;
      self.emit('pageOpened');
    }
  }

  function onCallback(result) {
    if(typeof(result) == 'string') {
      result = [result];
    }
    self.emit.apply(self, result);
  };

  this.eval = function eval(clientCode) {
    var parentArguments = arguments;
    var args = [];
    for(var key in arguments) {
      if(key != '0') {
        args.push(arguments[key]);
      }
    }

    if(pageOpened) {
      args.unshift(clientCode, function() {});
      page.evaluate.apply(page, args);
    } else {
      self.on('pageOpened', function() {
        self.eval.apply(self, parentArguments);
      });
    }
  };

  this.close = function close() {
    this.removeAllListeners('pageOpened');
    if(page) {
      page.onCallback = null;
      page.close();
    }
  };
}

util.inherits(ClientConnector, EventEmitter);

module.exports = ClientConnector;