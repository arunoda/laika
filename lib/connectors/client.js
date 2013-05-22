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

  this.run = function run(clientCode) {
    if(pageOpened) {
      page.evaluate(clientCode);
    } else {
      self.on('pageOpened', function() {
        self.run(clientCode);
      });
    }
  };

  this.close = function close() {
    this.removeAllListeners('pageOpened');
    page.onCallback = null;
    if(page) {
      page.close();
    }
  };
}

util.inherits(ClientConnector, EventEmitter);

module.exports = ClientConnector;